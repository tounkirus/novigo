import type { Metadata } from "next";
import Image from "next/image";
import { MediaImage } from "@/components/ui/media-image";
import { notFound } from "next/navigation";
import {
  Share2, Phone, MessageCircle, Navigation, Clock, Bike, MapPin, ShoppingBag, ChefHat, Timer, Tag,
} from "lucide-react";
import type { Store, StorePromotion } from "@/types";
import { storeBySlug, menuOf, reviewsOf, productsOf } from "@/mock";
import { Rating } from "@/components/ui/rating";
import { StoreBadges, OpenStatus } from "@/components/shared/badges";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { Vitrine } from "@/features/store/vitrine";
import { FloatingCartBar } from "@/features/store/floating-cart-bar";
import { formatFcfa, formatDistance, formatCompact, cn } from "@/lib/utils";
import { NOW, STORE_CATEGORY_LABEL } from "@/constants";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = storeBySlug(params.slug);
  if (!store) return { title: "Commerce introuvable — NOVIGO" };
  return {
    title: `${store.name} — ${STORE_CATEGORY_LABEL[store.category]} à ${store.district} | NOVIGO`,
    description: store.slogan ?? store.description.slice(0, 155),
  };
}

// Charte resserrée Rouge/Graphite : rouge = promo/urgence, graphite = neutre (texte blanc AA sur les deux).
const PROMO_GRADIENT: Record<StorePromotion["type"], string> = {
  FLASH: "from-brand to-brand-dark",
  DISCOUNT: "from-brand to-brand-dark",
  FREE_DELIVERY: "from-brand to-brand-dark",
  COUPON: "from-[#1c202a] to-[#12141c]",
  HAPPY_HOUR: "from-[#1c202a] to-[#12141c]",
  PACK: "from-[#1c202a] to-[#12141c]",
};

function promoCountdown(endsAt?: string): string | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - NOW;
  if (diff <= 0) return "Dernières heures";
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return `Se termine dans ${days} j`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 1) return `Se termine dans ${hours} h`;
  return `Se termine dans ${Math.max(1, Math.floor(diff / 60_000))} min`;
}

export default function StorePage({ params }: { params: { slug: string } }) {
  const store = storeBySlug(params.slug);
  if (!store) notFound();

  const menu = menuOf(store);
  const reviews = reviewsOf(store, 14);
  const products = productsOf(store);
  const populars = products.filter((p) => p.isBestSeller || p.isFeatured).slice(0, 10);
  const featuredList = populars.length > 0 ? populars : products.slice(0, 10);

  const waNumber = (store.whatsapp ?? store.phone).replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(`Bonjour ${store.name}, je vous contacte via NOVIGO.`);

  return (
    <div>
      <StoreBanner store={store} waNumber={waNumber} waMessage={waMessage} />

      <div className="px-4">
        <InfoBar store={store} />

        {store.promotions.length > 0 && <PromotionsRail store={store} />}

        <div className="mt-6">
          <Vitrine store={store} menu={menu} reviews={reviews} populars={featuredList} />
        </div>
      </div>

      <FloatingCartBar storeId={store.id} />
    </div>
  );
}

/* ---------------------------------------------------------------- Bannière */

function StoreBanner({ store, waNumber, waMessage }: { store: Store; waNumber: string; waMessage: string }) {
  const actions = [
    { icon: Share2, label: "Partager", href: "#" },
    { icon: Phone, label: "Appeler", href: `tel:${store.phone}` },
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${waNumber}?text=${waMessage}` },
    { icon: Navigation, label: "Itinéraire", href: "#" },
  ];

  return (
    <div className="relative">
      <div className="relative h-56 w-full overflow-hidden bg-shell sm:h-72">
        <MediaImage
          src={store.cover}
          alt={store.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
        <div className="absolute right-3 top-3">
          <FavoriteButton storeId={store.id} size={20} />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="flex items-end gap-3">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/80 bg-surface shadow-lifted sm:h-20 sm:w-20">
              <Image src={store.logo} alt={`Logo ${store.name}`} fill sizes="80px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <OpenStatus isOpen={store.isOpen} />
                <StoreBadges badges={store.badges} max={3} />
              </div>
              <h1 className="truncate text-2xl font-black tracking-tight text-white drop-shadow sm:text-3xl">
                {store.name}
              </h1>
              {store.slogan && <p className="line-clamp-1 text-[13px] text-white/85">{store.slogan}</p>}
              <div className="mt-1 flex items-center gap-3 text-[13px] text-white/90">
                <Rating value={store.rating} count={store.reviewCount} className="text-white" />
                <span>· {STORE_CATEGORY_LABEL[store.category]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-surface px-4 py-2.5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.href}
              target={a.href.startsWith("http") ? "_blank" : undefined}
              rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-shell px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              <a.icon className="h-4 w-4" /> {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Barre infos */

function InfoBar({ store }: { store: Store }) {
  const items = [
    { icon: Clock, label: "Livraison", value: `${store.deliveryTimeMin} min` },
    { icon: Bike, label: "Frais", value: store.deliveryFee === 0 ? "Gratuit" : formatFcfa(store.deliveryFee) },
    { icon: MapPin, label: "Distance", value: formatDistance(store.distanceKm) },
    { icon: ShoppingBag, label: "Min. commande", value: formatFcfa(store.minOrder) },
    { icon: Timer, label: "Préparation", value: `${store.prepTimeMin} min` },
    { icon: ChefHat, label: "Commandes", value: `${formatCompact(store.orderCount)}+` },
  ];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface p-3 text-center shadow-card">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <it.icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold leading-none text-ink">{it.value}</span>
          <span className="text-[11px] text-muted">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- Promotions */

function PromotionsRail({ store }: { store: Store }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <Tag className="h-4 w-4 text-brand" />
        <h2 className="text-base font-bold tracking-tight text-ink">Promotions en cours</h2>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {store.promotions.map((promo) => {
          const countdown = promoCountdown(promo.endsAt);
          return (
            <div
              key={promo.id}
              className={cn(
                "relative flex w-64 shrink-0 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-card",
                PROMO_GRADIENT[promo.type],
              )}
            >
              <div>
                <p className="text-[15px] font-black leading-tight">{promo.title}</p>
                {promo.subtitle && <p className="mt-0.5 text-[12px] font-medium text-white/85">{promo.subtitle}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                {promo.code ? (
                  <span className="rounded-lg border border-dashed border-white/70 px-2.5 py-1 text-[12px] font-bold tracking-wider">
                    {promo.code}
                  </span>
                ) : (
                  <span />
                )}
                {countdown && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold">
                    <Timer className="h-3 w-3" /> {countdown}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
