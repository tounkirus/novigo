import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import {
  InitiateParams, InitiateResult, PaymentProvider, ProviderTransaction, RefundResult, WebhookResult,
} from "./payment-provider";

@Injectable()
export class WaveProvider extends PaymentProvider {
  readonly method = "WAVE" as const;
  private readonly logger = new Logger("Wave");
  constructor(private config: ConfigService) { super(); }

  private get baseUrl(): string {
    return this.config.get<string>("WAVE_BASE_URL") ?? "https://api.wave.com";
  }

  async initiate(p: InitiateParams): Promise<InitiateResult> {
    const apiKey = this.config.get<string>("WAVE_API_KEY");
    const baseUrl = this.baseUrl;

    if (apiKey) {
      try {
        const res = await fetch(`${baseUrl}/v1/checkout/sessions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: String(p.amount), currency: p.currency, client_reference: p.reference,
            success_url: this.config.get("PAYMENT_RETURN_URL"),
            error_url: this.config.get("PAYMENT_RETURN_URL"),
          }),
        });
        const j = await res.json();
        return {
          providerRef: j?.id ?? j?.client_reference ?? `WV-${randomUUID()}`,
          instruction: j?.wave_launch_url ? `Payez via Wave : ${j.wave_launch_url}` : `Ouvrez l'app Wave pour confirmer.`,
        };
      } catch (e) {
        this.logger.error(`Échec initiation Wave : ${e}`);
        throw e;
      }
    }

    const providerRef = `WV-${randomUUID()}`;
    return {
      providerRef,
      instruction: `Ouvrez l'app Wave pour confirmer ${p.amount} ${p.currency} (réf ${providerRef}).`,
    };
  }

  async refund(providerRef: string, amount: number, currency: string): Promise<RefundResult> {
    const apiKey = this.config.get<string>("WAVE_API_KEY");
    if (!apiKey) return { ok: false, reason: "provider_not_configured" };
    try {
      // Wave rembourse une session de checkout par son id.
      const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${providerRef}/refund`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: String(amount), currency }),
      });
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.logger.warn(`Remboursement Wave refusé (${res.status}) pour ${providerRef}`);
        return { ok: false, providerRef, reason: `provider_status_${res.status}`, raw };
      }
      return { ok: true, providerRef, raw };
    } catch (e) {
      this.logger.error(`Échec remboursement Wave ${providerRef} : ${e}`);
      return { ok: false, providerRef, reason: "provider_error" };
    }
  }

  async fetchProviderTransactions(from?: Date, to?: Date): Promise<ProviderTransaction[] | null> {
    const apiKey = this.config.get<string>("WAVE_API_KEY");
    if (!apiKey) return null;
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("date_from", from.toISOString());
      if (to) qs.set("date_to", to.toISOString());
      const res = await fetch(`${this.baseUrl}/v1/transactions?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`transactions ${res.status}`);
      const j = await res.json();
      const rows: any[] = Array.isArray(j) ? j : (j?.items ?? j?.transactions ?? []);
      return rows.map((r) => ({
        providerRef: r.client_reference ?? r.id,
        amount: Number(r.amount ?? 0),
        currency: r.currency ?? "XOF",
        status: ["SUCCESS", "SUCCEEDED", "COMPLETED"].includes(String(r.status).toUpperCase())
          ? "SUCCEEDED" : String(r.status).toUpperCase() === "PENDING" ? "PENDING" : "FAILED",
        occurredAt: r.when_created ? new Date(r.when_created) : undefined,
      }));
    } catch (e) {
      this.logger.error(`Échec récupération transactions Wave : ${e}`);
      return null;
    }
  }

  parseWebhook(payload: any): WebhookResult {
    const status = ["SUCCESS", "SUCCEEDED", "COMPLETED"].includes(String(payload?.status).toUpperCase())
      ? "SUCCEEDED" : "FAILED";
    return { providerRef: payload?.client_reference ?? payload?.providerRef ?? payload?.id, status };
  }

  verifySignature(rawBody: string, signature?: string): boolean {
    return this.verifyHmac(rawBody, signature, this.config.get<string>("WAVE_WEBHOOK_SECRET"));
  }
}
