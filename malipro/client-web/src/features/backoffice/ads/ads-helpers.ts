import type { BadgeProps } from "@/components/ui/badge";
import type { AdCampaign } from "@/types/modules";

type Tone = NonNullable<BadgeProps["tone"]>;

export const AD_STATUS: Record<AdCampaign["status"], { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "success" },
  PAUSED: { label: "En pause", tone: "warning" },
  REVIEW: { label: "En revue", tone: "info" },
  ENDED: { label: "Terminée", tone: "neutral" },
};

export const AD_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "ACTIVE", label: "Actives" },
  { value: "PAUSED", label: "En pause" },
  { value: "REVIEW", label: "En revue" },
  { value: "ENDED", label: "Terminées" },
];
