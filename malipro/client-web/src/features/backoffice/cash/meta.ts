import type {
  CashRegister,
  RemittanceMethod,
  RemittanceStatus,
  CashReconciliation,
  CashDiscrepancy,
} from "@/types/wallet";

type Tone = "brand" | "gold" | "success" | "error" | "info" | "warning" | "neutral";

/** Statuts des caisses livreurs. */
export const REGISTER_STATUS_META: Record<CashRegister["status"], { label: string; tone: Tone }> = {
  OK: { label: "Conforme", tone: "success" },
  OVER_LIMIT: { label: "Plafond dépassé", tone: "warning" },
  NEGATIVE: { label: "Solde négatif", tone: "error" },
  FROZEN: { label: "Gelée", tone: "neutral" },
};

/** Méthodes de remise. */
export const REMITTANCE_METHOD_META: Record<RemittanceMethod, { label: string; tone: Tone }> = {
  QR_CODE: { label: "QR", tone: "info" },
  OTP: { label: "OTP", tone: "brand" },
  MANUAL: { label: "Manuel", tone: "neutral" },
  AGENT: { label: "Agent", tone: "gold" },
};

/** Statuts des remises. */
export const REMITTANCE_STATUS_META: Record<RemittanceStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "En attente", tone: "warning" },
  VALIDATED: { label: "Validée", tone: "success" },
  REJECTED: { label: "Refusée", tone: "error" },
  LATE: { label: "En retard", tone: "neutral" },
};

/** Statuts de rapprochement. */
export const RECON_STATUS_META: Record<CashReconciliation["status"], { label: string; tone: Tone }> = {
  BALANCED: { label: "Équilibré", tone: "success" },
  GAP: { label: "Écart", tone: "error" },
  PENDING: { label: "En attente", tone: "warning" },
};

/** Sévérité des écarts. */
export const SEVERITY_META: Record<CashDiscrepancy["severity"], { label: string; tone: Tone }> = {
  LOW: { label: "Faible", tone: "info" },
  MEDIUM: { label: "Moyenne", tone: "warning" },
  HIGH: { label: "Élevée", tone: "error" },
};

/** Statuts des écarts. */
export const DISCREPANCY_STATUS_META: Record<CashDiscrepancy["status"], { label: string; tone: Tone }> = {
  OPEN: { label: "Ouvert", tone: "warning" },
  RESOLVED: { label: "Résolu", tone: "success" },
};

/** Seuil de double validation pour les grosses remises. */
export const DOUBLE_VALIDATION_THRESHOLD = 150_000;
