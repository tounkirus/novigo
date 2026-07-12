import { createHmac } from "crypto";

export interface InitiateParams { amount: number; currency: string; phone: string; reference: string; }
export interface InitiateResult { providerRef: string; instruction: string; }
export interface WebhookResult { providerRef: string; status: "SUCCEEDED" | "FAILED"; }

/// Résultat d'un remboursement opérateur.
export interface RefundResult {
  ok: boolean;
  providerRef?: string;
  /// Motif lisible en cas d'échec (ou d'absence de support/identifiants).
  reason?: string;
  raw?: any;
}

/// Ligne de transaction telle que rapportée par l'opérateur (côté réconciliation).
export interface ProviderTransaction {
  providerRef: string;
  amount: number;
  currency: string;
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  occurredAt?: Date;
}

/// Contrat commun à tous les fournisseurs Mobile Money.
export abstract class PaymentProvider {
  abstract readonly method: "ORANGE_MONEY" | "WAVE";
  abstract initiate(p: InitiateParams): Promise<InitiateResult>;
  abstract parseWebhook(payload: any): WebhookResult;

  /// Remboursement réel côté opérateur. Par défaut : non supporté (les sous-classes
  /// surchargent). Ne jette pas : renvoie { ok:false } pour laisser le service décider.
  async refund(_providerRef: string, _amount: number, _currency: string): Promise<RefundResult> {
    return { ok: false, reason: "refund_not_supported" };
  }

  /// Récupère les transactions de l'opérateur sur une période, pour la réconciliation.
  /// Renvoie null si l'API opérateur n'est pas configurée (repli interne dans le service).
  async fetchProviderTransactions(_from?: Date, _to?: Date): Promise<ProviderTransaction[] | null> {
    return null;
  }

  /// Vérifie la signature HMAC du webhook. En dev (secret absent) : accepte.
  protected verifyHmac(rawBody: string, signature: string | undefined, secret?: string): boolean {
    if (!secret) return true;
    if (!signature) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signature;
  }
  abstract verifySignature(rawBody: string, signature?: string): boolean;
}
