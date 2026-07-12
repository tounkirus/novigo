"use client";

import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import { MapPin, Clock, BadgeCheck, Star } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import type {
  ServiceProvider, ServiceCategoryDef, ServiceIntervention, InterventionStatus, ProviderBadge, KycStatus,
} from "@/types/services";
import { INTERVENTION_STATUS_META } from "@/mock/services";
import { cn, formatDistance, formatDate, formatFcfa } from "@/lib/utils";

/* ────────────────────────────── badges métier ───────────────────────────── */

const BADGE_META: Record<ProviderBadge, { label: string; icon: string; tone: "brand" | "gold" | "success" | "info" | "neutral" }> = {
  VERIFIED: { label: "Vérifié", icon: "BadgeCheck", tone: "info" },
  TOP_RATED: { label: "Top noté", icon: "Star", tone: "gold" },
  FAST_RESPONSE: { label: "Réponse rapide", icon: "Zap", tone: "success" },
  PRO: { label: "Pro", icon: "Award", tone: "brand" },
  ELITE: { label: "Élite", icon: "Crown", tone: "gold" },
  NEW: { label: "Nouveau", icon: "Sparkles", tone: "info" },
};

export function ProviderBadges({ badges, max = 3 }: { badges: ProviderBadge[]; max?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.slice(0, max).map((b) => {
        const m = BADGE_META[b];
        return (
          <Badge key={b} tone={m.tone}>
            <Icon name={m.icon} className="h-3 w-3" /> {m.label}
          </Badge>
        );
      })}
    </div>
  );
}

const KYC_META: Record<KycStatus, { label: string; tone: "success" | "warning" | "error" | "neutral" }> = {
  VERIFIED: { label: "KYC vérifié", tone: "success" },
  PENDING: { label: "KYC en attente", tone: "warning" },
  REJECTED: { label: "KYC rejeté", tone: "error" },
  EXPIRED: { label: "KYC expiré", tone: "neutral" },
};

export function KycBadge({ status }: { status: KycStatus }) {
  const m = KYC_META[status];
  return <Badge tone={m.tone}><BadgeCheck className="h-3 w-3" />{m.label}</Badge>;
}

/* ────────────────────────────── carte catégorie ───────────────────────────── */

export function CategoryTile({ category, count }: { category: ServiceCategoryDef; count?: number }) {
  return (
    <Link
      href={`/home-services/${category.id}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lifted active:scale-[0.97]"
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-card transition-transform duration-200 group-hover:scale-110",
          category.gradient,
        )}
      >
        <Icon name={category.icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="line-clamp-1 font-semibold text-ink">{category.label}</p>
        {count != null && <p className="text-[12px] text-muted">{count} pro{count > 1 ? "s" : ""}</p>}
      </div>
    </Link>
  );
}

/* ────────────────────────────── carte prestataire ───────────────────────────── */

export function ProviderCard({ provider }: { provider: ServiceProvider }) {
  return (
    <Link
      href={`/home-services/provider/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative h-32 w-full overflow-hidden bg-shell">
        <MediaImage
          src={provider.coverImage}
          alt={provider.categoryLabel}
          fill
          sizes="(max-width:768px) 100vw, 320px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute left-3 top-3">
          <Badge tone="solid">{provider.categoryLabel}</Badge>
        </span>
        {provider.online && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> En ligne
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-3">
          <Avatar src={provider.avatar} alt={provider.name} size={44} className="-mt-9 border-2 border-surface shadow-card" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate font-bold text-ink">{provider.name}</p>
              {provider.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" />}
            </div>
            <p className="line-clamp-1 text-[12px] text-muted">{provider.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-muted">
          <Rating value={provider.rating} count={provider.reviewCount} />
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{formatDistance(provider.distanceKm)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{provider.responseTimeMin} min</span>
        </div>
        <ProviderBadges badges={provider.badges} max={2} />
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-brand">{provider.priceLabel}</span>
          <span className="text-[12px] font-medium text-muted">{provider.jobsCompleted} missions</span>
        </div>
      </div>
    </Link>
  );
}

export function ProviderCardCompact({ provider }: { provider: ServiceProvider }) {
  return (
    <Link
      href={`/home-services/provider/${provider.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card transition hover:shadow-lifted"
    >
      <Avatar src={provider.avatar} alt={provider.name} size={52} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate font-semibold text-ink">{provider.name}</p>
          {provider.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-info" />}
        </div>
        <p className="truncate text-[12px] text-muted">{provider.categoryLabel} · {provider.district}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
          <span className="flex items-center gap-0.5 font-semibold text-ink"><Star className="h-3 w-3 fill-gold text-gold" />{provider.rating.toFixed(1)}</span>
          <span>·</span>
          <span className="font-medium text-brand">{provider.priceLabel}</span>
        </div>
      </div>
    </Link>
  );
}

/* ────────────────────────────── statut intervention ───────────────────────────── */

export function InterventionStatusBadge({ status }: { status: InterventionStatus }) {
  const m = INTERVENTION_STATUS_META[status];
  return <Badge tone={m.tone}><Icon name={m.icon} className="h-3 w-3" />{m.label}</Badge>;
}

const TONE_DOT: Record<string, string> = {
  brand: "bg-brand text-brand", success: "bg-success text-success",
  warning: "bg-warning text-warning", error: "bg-error text-error", info: "bg-info text-info",
};

export function InterventionTimeline({ intervention }: { intervention: ServiceIntervention }) {
  const events = [...intervention.timeline].reverse();
  return (
    <ol className="relative space-y-4 pl-6">
      <span className="absolute left-[7px] top-1.5 h-[calc(100%-1rem)] w-0.5 bg-line" aria-hidden />
      {events.map((e, i) => {
        const m = INTERVENTION_STATUS_META[e.status];
        const last = i === 0;
        return (
          <li key={`${e.status}-${i}`} className="relative">
            <span className={cn("absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-surface", last ? TONE_DOT[m.tone] : "bg-line")} />
            <p className={cn("text-sm font-semibold", last ? "text-ink" : "text-muted")}>{e.label}</p>
            <p className="text-[12px] text-muted">{new Date(e.at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
            {e.note && <p className="mt-0.5 text-[12px] text-muted">{e.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export function InterventionCard({ intervention, href }: { intervention: ServiceIntervention; href?: string }) {
  const body = (
    <>
      <Avatar src={intervention.providerAvatar} alt={intervention.providerName} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-ink">{intervention.providerName}</p>
          {intervention.urgent && <Badge tone="error">Urgent</Badge>}
        </div>
        <p className="truncate text-[12px] text-muted">{intervention.categoryLabel} · {intervention.ref}</p>
        <p className="mt-0.5 text-[12px] text-muted">{formatDate(intervention.createdAt)} · {intervention.district}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <InterventionStatusBadge status={intervention.status} />
        <span className="text-sm font-bold text-ink">
          {formatFcfa(intervention.finalAmount || intervention.quoteAmount)}
        </span>
      </div>
    </>
  );
  const cls = "flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:shadow-lifted";
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
