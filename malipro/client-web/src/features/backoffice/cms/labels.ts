import type { CmsBanner, CmsPage } from "@/types/backoffice";
import type { BadgeProps } from "@/components/ui/badge";

type Tone = NonNullable<BadgeProps["tone"]>;

export const PLACEMENT_LABEL: Record<CmsBanner["placement"], string> = {
  HOME_HERO: "Accueil · Héros",
  HOME_STRIP: "Accueil · Bandeau",
  CATEGORY: "Catégorie",
  CHECKOUT: "Paiement",
};

export const CMS_STATUS: Record<CmsBanner["status"], { label: string; tone: Tone }> = {
  PUBLISHED: { label: "Publié", tone: "success" },
  DRAFT: { label: "Brouillon", tone: "neutral" },
  SCHEDULED: { label: "Programmé", tone: "info" },
};

export const PAGE_TYPE: Record<CmsPage["type"], { label: string; tone: Tone }> = {
  LEGAL: { label: "Légal", tone: "neutral" },
  HELP: { label: "Aide", tone: "info" },
  MARKETING: { label: "Marketing", tone: "brand" },
  BLOG: { label: "Blog", tone: "gold" },
};
