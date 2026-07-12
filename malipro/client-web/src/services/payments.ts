/**
 * Passerelle de paiement NOVIGO — abstraction multi-fournisseurs.
 * Implémentation MOCK. Chaque fournisseur expose la même interface `charge()`,
 * ce qui permet de brancher les vrais SDK sans changer les écrans :
 *   - Stripe (carte) → stripe.confirmPayment
 *   - Wave / Orange Money / Moov Money → API de collecte mobile money
 *   - Espèces / Portefeuille → traitement interne
 */
import type { PaymentMethodType } from "@/types";

export interface ChargeInput {
  provider: PaymentMethodType;
  amount: number;
  reference?: string;
  phone?: string;
}

export interface ChargeResult {
  ok: boolean;
  provider: PaymentMethodType;
  amount: number;
  transactionId: string;
  status: "SUCCEEDED" | "PENDING" | "FAILED";
  message: string;
}

const PROVIDER_LABEL: Record<PaymentMethodType, string> = {
  ORANGE_MONEY: "Orange Money",
  MOOV_MONEY: "Moov Money",
  WAVE: "Wave",
  CARD: "Carte bancaire (Stripe)",
  CASH: "Espèces",
  WALLET: "Portefeuille NOVIGO",
};

/** ID de transaction déterministe (pas de Math.random). */
function txId(provider: string, amount: number): string {
  let h = 0;
  const base = `${provider}-${amount}-${PROVIDER_LABEL[provider as PaymentMethodType] ?? ""}`;
  for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
  return `TX-${Math.abs(h).toString(36).toUpperCase().slice(0, 10)}`;
}

/** Simule un encaissement (latence + succès). Remplaçable par le vrai SDK. */
export async function charge(input: ChargeInput): Promise<ChargeResult> {
  const { provider, amount } = input;
  await new Promise((r) => setTimeout(r, 900));
  const mobileMoney = provider === "ORANGE_MONEY" || provider === "MOOV_MONEY" || provider === "WAVE";
  return {
    ok: true,
    provider,
    amount,
    transactionId: txId(provider, amount),
    status: mobileMoney ? "PENDING" : "SUCCEEDED",
    message: mobileMoney
      ? `Confirmez le paiement sur votre téléphone (${PROVIDER_LABEL[provider]}).`
      : `Paiement de ${amount} FCFA accepté via ${PROVIDER_LABEL[provider]}.`,
  };
}

export { PROVIDER_LABEL };
