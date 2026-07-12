import type { BadgeProps } from "@/components/ui/badge";
import type { CrmCustomer, CustomerSegment, SupportTicket } from "@/types/backoffice";

export type Tone = NonNullable<BadgeProps["tone"]>;

/** Métadonnées d'affichage d'un segment client (libellé court + couleur du Badge). */
export const SEGMENT_META: Record<CustomerSegment, { short: string; tone: Tone }> = {
  VIP: { short: "VIP", tone: "gold" },
  FIDELE: { short: "Fidèle", tone: "brand" },
  NOUVEAU: { short: "Nouveau", tone: "info" },
  INACTIF: { short: "Inactif", tone: "neutral" },
  A_RISQUE: { short: "À risque", tone: "warning" },
};

export const CUSTOMER_STATUS: Record<CrmCustomer["status"], { label: string; tone: Tone }> = {
  ACTIVE: { label: "Actif", tone: "success" },
  CHURN_RISK: { label: "À risque", tone: "warning" },
  INACTIVE: { label: "Inactif", tone: "neutral" },
};

export const TICKET_PRIORITY: Record<SupportTicket["priority"], { label: string; tone: Tone }> = {
  LOW: { label: "Basse", tone: "neutral" },
  MEDIUM: { label: "Moyenne", tone: "info" },
  HIGH: { label: "Haute", tone: "warning" },
  URGENT: { label: "Urgente", tone: "error" },
};

export const TICKET_STATUS: Record<SupportTicket["status"], { label: string; tone: Tone }> = {
  OPEN: { label: "Ouvert", tone: "info" },
  PENDING: { label: "En attente", tone: "warning" },
  RESOLVED: { label: "Résolu", tone: "success" },
};

export const CHANNEL_LABEL: Record<SupportTicket["channel"], string> = {
  CHAT: "Chat",
  EMAIL: "E-mail",
  PHONE: "Téléphone",
  APP: "Application",
};
