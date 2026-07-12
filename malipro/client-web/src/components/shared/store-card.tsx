"use client";

import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import { motion } from "framer-motion";
import { Clock, Bike, MapPin, Flame, BadgeCheck, Wallet } from "lucide-react";
import type { Store } from "@/types";
import { Rating } from "@/components/ui/rating";
import { StoreBadges } from "./badges";
import { FavoriteButton } from "./favorite-button";
import { Icon } from "./icon";
import { formatFcfa, formatDistance, cn } from "@/lib/utils";
import { STORE_CATEGORY_LABEL } from "@/constants";

export function StoreCard({ store, className, priority }: { store: Store; className?: string; priority?: boolean }) {
  // Mise en avant style Uber Eats : livraison offerte (rouge marque) ou « Populaire » (forte demande).
  const isPopular = store.rating >= 4.6 && store.reviewCount >= 150;
  const isVerified = store.badges.includes("VERIFIED" as (typeof store.badges)[number]);
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className={cn("group", className)}>
      <Link href={`/store/${store.slug}`} className="block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow hover:shadow-lifted">
        <div className="relative aspect-[16/10] overflow-hidden bg-shell">
          <MediaImage
            src={store.cover}
            alt={store.name}
            fill
            sizes="(max-width: 768px) 90vw, 320px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Léger dégradé bas pour la lisibilité du temps de livraison sur photo claire */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {store.deliveryFee === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white shadow-card">
                  <Bike className="h-3 w-3" /> Livraison offerte
                </span>
              )}
              {isPopular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white shadow-card backdrop-blur">
                  <Flame className="h-3 w-3" /> Populaire
                </span>
              )}
            </div>
            <FavoriteButton storeId={store.id} />
          </div>
          {!store.isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">Fermé — ouvre bientôt</span>
            </div>
          )}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink backdrop-blur dark:bg-black/55 dark:text-white">
              <Clock className="h-3 w-3" /> {store.deliveryTimeMin} min
            </span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink backdrop-blur dark:bg-black/55 dark:text-white">
                <BadgeCheck className="h-3 w-3 text-brand" /> Vérifié
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-ink">{store.name}</h3>
            <Rating value={store.rating} count={store.reviewCount} />
          </div>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
            {STORE_CATEGORY_LABEL[store.category]} · {store.subCategories.slice(0, 2).join(" · ")}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Bike className="h-3.5 w-3.5" />
              {store.deliveryFee === 0 ? "Gratuit" : formatFcfa(store.deliveryFee)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {formatDistance(store.distanceKm)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              ~{formatFcfa(store.avgPrice)}
            </span>
          </div>
          {store.badges.length > 0 && <StoreBadges badges={store.badges} max={2} className="mt-2.5" />}
        </div>
      </Link>
    </motion.div>
  );
}

export function StoreCardCompact({ store }: { store: Store }) {
  return (
    <Link href={`/store/${store.slug}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-shell">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-shell">
        <MediaImage src={store.cover} alt={store.name} fill sizes="56px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-ink">{store.name}</p>
        <p className="line-clamp-1 text-[12px] text-muted">{store.district}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <Rating value={store.rating} />
          <span className="text-[12px] text-muted">· {store.deliveryTimeMin} min</span>
        </div>
      </div>
      <Icon name="ChevronRight" className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
