import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import {
  InitiateParams, InitiateResult, PaymentProvider, ProviderTransaction, RefundResult, WebhookResult,
} from "./payment-provider";

@Injectable()
export class OrangeMoneyProvider extends PaymentProvider {
  readonly method = "ORANGE_MONEY" as const;
  private readonly logger = new Logger("OrangeMoney");
  constructor(private config: ConfigService) { super(); }

  /// True si les identifiants opérateur sont présents (sinon : mode sandbox).
  private get configured(): boolean {
    return Boolean(
      this.config.get("ORANGE_MONEY_CLIENT_ID") &&
      this.config.get("ORANGE_MONEY_CLIENT_SECRET") &&
      this.config.get("ORANGE_MONEY_BASE_URL"),
    );
  }

  /// Jeton OAuth client_credentials, partagé par initiate/refund/reconciliation.
  private async getToken(): Promise<string> {
    const baseUrl = this.config.get<string>("ORANGE_MONEY_BASE_URL");
    const creds = Buffer.from(
      `${this.config.get("ORANGE_MONEY_CLIENT_ID")}:${this.config.get("ORANGE_MONEY_CLIENT_SECRET")}`,
    ).toString("base64");
    const res = await fetch(`${baseUrl}/oauth/v3/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) throw new Error(`OAuth Orange Money ${res.status}`);
    const token = (await res.json())?.access_token;
    if (!token) throw new Error("Jeton OAuth Orange Money absent.");
    return token;
  }

  async initiate(p: InitiateParams): Promise<InitiateResult> {
    if (this.configured) {
      try {
        const token = await this.getToken();
        const baseUrl = this.config.get<string>("ORANGE_MONEY_BASE_URL");
        // Etape 2 : creation du paiement web ; endpoint a adapter au contrat operateur.
        const payRes = await fetch(`${baseUrl}/orange-money-webpay/v1/webpayment`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: p.amount, currency: p.currency, order_id: p.reference,
            return_url: this.config.get("PAYMENT_RETURN_URL"),
            notif_url: this.config.get("PAYMENT_WEBHOOK_URL"),
          }),
        });
        const j = await payRes.json();
        return {
          providerRef: j?.pay_token ?? j?.order_id ?? `OM-${randomUUID()}`,
          instruction: j?.payment_url ? `Payez ici : ${j.payment_url}` : `Suivez les instructions Orange Money.`,
        };
      } catch (e) {
        this.logger.error(`Échec initiation Orange Money : ${e}`);
        throw e;
      }
    }

    // Repli sandbox (pas d'identifiants) : référence simulée, confirmation par webhook.
    const providerRef = `OM-${randomUUID()}`;
    return {
      providerRef,
      instruction: `Composez #144# puis validez le paiement de ${p.amount} ${p.currency} (réf ${providerRef}).`,
    };
  }

  async refund(providerRef: string, amount: number, currency: string): Promise<RefundResult> {
    if (!this.configured) return { ok: false, reason: "provider_not_configured" };
    try {
      const token = await this.getToken();
      const baseUrl = this.config.get<string>("ORANGE_MONEY_BASE_URL");
      const res = await fetch(`${baseUrl}/orange-money-webpay/v1/refund`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: providerRef, amount, currency }),
      });
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.logger.warn(`Remboursement Orange Money refusé (${res.status}) pour ${providerRef}`);
        return { ok: false, providerRef, reason: `provider_status_${res.status}`, raw };
      }
      return { ok: true, providerRef: raw?.refund_id ?? providerRef, raw };
    } catch (e) {
      this.logger.error(`Échec remboursement Orange Money ${providerRef} : ${e}`);
      return { ok: false, providerRef, reason: "provider_error" };
    }
  }

  async fetchProviderTransactions(from?: Date, to?: Date): Promise<ProviderTransaction[] | null> {
    if (!this.configured) return null;
    try {
      const token = await this.getToken();
      const baseUrl = this.config.get<string>("ORANGE_MONEY_BASE_URL");
      const qs = new URLSearchParams();
      if (from) qs.set("from", from.toISOString());
      if (to) qs.set("to", to.toISOString());
      const res = await fetch(`${baseUrl}/orange-money-webpay/v1/transactions?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`transactions ${res.status}`);
      const j = await res.json();
      const rows: any[] = Array.isArray(j) ? j : (j?.transactions ?? []);
      return rows.map((r) => ({
        providerRef: r.order_id ?? r.pay_token ?? r.reference,
        amount: Number(r.amount ?? 0),
        currency: r.currency ?? "XOF",
        status: ["SUCCESS", "SUCCEEDED", "PAID"].includes(String(r.status).toUpperCase())
          ? "SUCCEEDED" : String(r.status).toUpperCase() === "PENDING" ? "PENDING" : "FAILED",
        occurredAt: r.date ? new Date(r.date) : undefined,
      }));
    } catch (e) {
      this.logger.error(`Échec récupération transactions Orange Money : ${e}`);
      return null;
    }
  }

  parseWebhook(payload: any): WebhookResult {
    const status = ["SUCCESS", "SUCCEEDED", "PAID"].includes(String(payload?.status).toUpperCase())
      ? "SUCCEEDED" : "FAILED";
    return { providerRef: payload?.reference ?? payload?.providerRef, status };
  }

  verifySignature(rawBody: string, signature?: string): boolean {
    return this.verifyHmac(rawBody, signature, this.config.get<string>("ORANGE_MONEY_WEBHOOK_SECRET"));
  }
}
