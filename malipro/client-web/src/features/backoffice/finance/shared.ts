import type { BadgeProps } from "@/components/ui/badge";
import type { WalletRole, WalletStatus, PayoutRequest } from "@/types/wallet";
import type { FraudAlert, FraudRisk, FraudStatus } from "@/types/ops";

export type Tone = NonNullable<BadgeProps["tone"]>;

/** Libellés & tons partagés par le centre financier administrateur. */

export const ROLE_LABEL: Record<WalletRole, string> = {
  CLIENT: "Client",
  DRIVER: "Livreur",
  MERCHANT: "Commerçant",
  ADMIN: "Admin",
};

export const ROLE_TONE: Record<WalletRole, Tone> = {
  CLIENT: "info",
  DRIVER: "brand",
  MERCHANT: "gold",
  ADMIN: "neutral",
};

export const WALLET_STATUS: Record<WalletStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Actif", tone: "success" },
  FROZEN: { label: "Gelé", tone: "error" },
  SUSPENDED: { label: "Suspendu", tone: "warning" },
};

export const PAYOUT_STATUS: Record<PayoutRequest["status"], { label: string; tone: Tone }> = {
  PENDING: { label: "En attente", tone: "warning" },
  APPROVED: { label: "Approuvé", tone: "info" },
  PAID: { label: "Payé", tone: "success" },
  REJECTED: { label: "Rejeté", tone: "error" },
};

export const FRAUD_TYPE_LABEL: Record<FraudAlert["type"], string> = {
  VELOCITY: "Vélocité",
  CHARGEBACK: "Rétrofacturation",
  CASH_GAP: "Écart de caisse",
  MULTI_ACCOUNT: "Multi-comptes",
  UNUSUAL_AMOUNT: "Montant inhabituel",
  REFUND_ABUSE: "Abus de remboursement",
};

export const FRAUD_RISK: Record<FraudRisk, { label: string; tone: Tone }> = {
  LOW: { label: "Faible", tone: "neutral" },
  MEDIUM: { label: "Moyen", tone: "warning" },
  HIGH: { label: "Élevé", tone: "error" },
};

export const FRAUD_STATUS: Record<FraudStatus, { label: string; tone: Tone }> = {
  OPEN: { label: "Ouverte", tone: "warning" },
  REVIEWING: { label: "En examen", tone: "info" },
  CLEARED: { label: "Classée", tone: "neutral" },
  CONFIRMED: { label: "Confirmée", tone: "error" },
};
