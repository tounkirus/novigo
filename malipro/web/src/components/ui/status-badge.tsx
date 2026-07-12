

import { cn } from "@/lib/utils";

// Palette de statuts partagée (commandes + paiements).
const TONE: Record<string, string> = {
  // succès
  DELIVERED: "success", SUCCEEDED: "success", ACTIVE: "success", APPROVED: "success",
  // en cours
  CONFIRMED: "info", PREPARING: "info", READY: "info", ASSIGNED: "info",
  PICKED_UP: "info", IN_TRANSIT: "info", INITIATED: "info", PENDING: "warn",
  // attente KYC
  NOT_SUBMITTED: "muted",
  // réconciliation
  MATCHED: "success", AMOUNT_MISMATCH: "warn",
  MISSING_IN_PROVIDER: "danger", MISSING_IN_INTERNAL: "danger",
  // échec / annulé
  CANCELLED: "danger", FAILED: "danger", BANNED: "danger", SUSPENDED: "danger",
  REJECTED: "danger", REFUNDED: "muted",
};

// Tons dérivés des jetons sémantiques (globals.css) : s'adaptent au mode sombre.
const CLASSES: Record<string, string> = {
  success: "bg-brand-soft text-brand-dark",
  info: "bg-info-soft text-info",
  warn: "bg-gold-soft text-gold-dark",
  danger: "bg-error-soft text-error",
  muted: "bg-line text-muted",
};

const LABELS: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée", PREPARING: "Préparation",
  READY: "Prête", ASSIGNED: "Assignée", PICKED_UP: "Récupérée",
  IN_TRANSIT: "En route", DELIVERED: "Livrée", CANCELLED: "Annulée",
  REFUNDED: "Remboursée", INITIATED: "Initié", SUCCEEDED: "Réussi",
  FAILED: "Échoué", ACTIVE: "Actif", SUSPENDED: "Suspendu", BANNED: "Banni",
  NOT_SUBMITTED: "Non soumis", APPROVED: "Approuvé", REJECTED: "Rejeté",
  MATCHED: "Rapproché", AMOUNT_MISMATCH: "Écart montant",
  MISSING_IN_PROVIDER: "Absent opérateur", MISSING_IN_INTERNAL: "Absent SI",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        CLASSES[tone]
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
