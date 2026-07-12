import Link from "next/link";
import { Truck, Flame, TrendingUp, Clock, Store as StoreIcon, ChevronRight } from "lucide-react";
import type { Store, Category } from "@/types";
import { MediaImage } from "@/components/ui/media-image";
import { themedImage } from "@/mock/media";
import { Icon } from "@/components/shared/icon";
import { Section, SectionHeader } from "@/components/shared/section";
import { HomeHero } from "@/features/home/hero";
import { PromoCarousel } from "@/features/home/promo-carousel";
import { StoreRail, ProductRail, StoreGrid } from "@/features/home/rails";
import { AiRecommendations } from "@/features/home/ai-recommendations";
import { ServicesStrip } from "@/features/home/services-strip";
import {
  categories, promotions, popularStores, topRatedStores, freeDeliveryStores, newStores,
  fastStores, recommendedStores, featuredProducts, stores as allStores,
} from "@/mock";
import { formatCompact } from "@/lib/utils";
import { DATASET_TARGETS } from "@/constants";

export default function HomePage() {
  const cats = categories();
  const promos = promotions;
  const popular = popularStores(10);
  const free = freeDeliveryStores(10);
  const nouveaux = newStores(10);
  const rapides = fastStores(10);
  const topRated = topRatedStores(10);
  const recommended = recommendedStores(6);
  const featured = featuredProducts();

  const storeMap: Record<string, Store> = {};
  for (const s of allStores()) storeMap[s.id] = s;
  const storeSlugs: Record<string, string> = {};
  for (const s of allStores()) storeSlugs[s.id] = s.slug;

  const offers = featured.filter((p) => p.oldPrice).slice(0, 12);
  const bestSellers = featured.filter((p) => p.isBestSeller).slice(0, 12);

  return (
    <div>
      <HomeHero />

      <div className="px-4">
        <Section>
          <SectionHeader title="Catégories" subtitle="Trouvez ce dont vous avez envie" href="/restaurants" />
          <CategoryCards categories={cats} />
        </Section>

        <Section>
          <ServicesStrip />
        </Section>

        <Section>
          <PromoCarousel promotions={promos} storeSlugs={storeSlugs} />
        </Section>

        <StatsBar />

        <Section>
          <SectionHeader title="Offres du jour" subtitle="Jusqu'à -40% aujourd'hui" href="/restaurants" />
          <ProductRail products={offers} stores={storeMap} />
        </Section>

        <Section>
          <SectionHeader title="Restaurants populaires" subtitle="Les plus commandés à Bamako" href="/restaurants?sort=popular" />
          <StoreRail stores={popular} />
        </Section>

        <FreeDeliveryBanner />

        <Section>
          <SectionHeader title="Livraison gratuite" subtitle="0 FCFA de frais de livraison" href="/restaurants?freeDelivery=1" />
          <StoreRail stores={free} />
        </Section>

        <Section>
          <SectionHeader title="Meilleures ventes" subtitle="Les produits stars du moment" href="/restaurants" />
          <ProductRail products={bestSellers} stores={storeMap} />
        </Section>

        <Section>
          <SectionHeader title="Nouveautés" subtitle="Ils viennent d'arriver" href="/restaurants" />
          <StoreRail stores={nouveaux} />
        </Section>

        <Section>
          <SectionHeader title="Livraison express" subtitle="En moins de 25 minutes" href="/restaurants?sort=delivery" />
          <StoreRail stores={rapides} />
        </Section>

        <Section>
          <AiRecommendations />
        </Section>

        <Section>
          <SectionHeader title="Recommandés pour vous" subtitle="Sélection selon vos goûts" href="/restaurants" />
          <StoreGrid stores={recommended} />
        </Section>

        <Section>
          <SectionHeader title="Meilleures notes" subtitle="Plébiscités par la communauté" href="/restaurants?sort=rating" />
          <StoreRail stores={topRated} />
        </Section>

        <CollectionsBanner />
      </div>
    </div>
  );
}

// Cartes de catégories premium (style Uber Eats) : tuile claire, icône rouge de marque,
// ombre douce, effet hover discret. Charte Rouge/Noir/Blanc/Gris — aucune couleur parasite.
function CategoryCards({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {categories.slice(0, 12).map((c) => (
        <Link
          key={c.id}
          href={`/restaurants?category=${c.id}`}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lifted"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand transition-transform duration-200 group-hover:scale-110">
            <Icon name={c.icon} className="h-6 w-6" />
          </span>
          <span className="line-clamp-1 text-[13px] font-semibold text-ink">{c.label}</span>
          <span className="text-[11px] text-muted">{c.count} commerces</span>
        </Link>
      ))}
    </div>
  );
}

function StatsBar() {
  const items = [
    { icon: StoreIcon, label: "Commerces", value: `${formatCompact(DATASET_TARGETS.restaurants + DATASET_TARGETS.supermarkets + DATASET_TARGETS.pharmacies + DATASET_TARGETS.bakeries + DATASET_TARGETS.shops)}+` },
    { icon: TrendingUp, label: "Commandes livrées", value: `${formatCompact(DATASET_TARGETS.orders)}+` },
    { icon: Truck, label: "Livreurs actifs", value: `${DATASET_TARGETS.drivers}` },
    { icon: Clock, label: "Livraison moyenne", value: "28 min" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <it.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold leading-none text-ink">{it.value}</p>
            <p className="mt-1 text-[12px] text-muted">{it.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Bannière promo premium façon store international : fond graphite (Noir/Gris), accent ROUGE.
function FreeDeliveryBanner() {
  return (
    <Section>
      <Link
        href="/coupons"
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 to-black p-5 text-white shadow-card"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/25 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
          <Flame className="h-7 w-7" />
        </span>
        <div className="relative flex-1">
          <p className="text-lg font-black leading-tight">Code MALI10 — -10% sur votre 1re commande</p>
          <p className="text-[13px] font-medium text-white/70">Cumulable avec la livraison offerte. Offre limitée.</p>
        </div>
        <span className="relative hidden items-center gap-1 rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white transition group-hover:bg-brand-dark sm:inline-flex">
          J'en profite <ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </Section>
  );
}

// Collections avec vraies photos HD (médiathèque) + voile sombre pour la lisibilité.
function CollectionsBanner() {
  const collections = [
    { label: "Produits locaux 🇲🇱", desc: "Le meilleur du terroir", href: "/restaurants?vertical=MARKET", img: themedImage("market,vegetables", "coll-local", 500, 320) },
    { label: "Healthy & équilibré", desc: "Manger sain à Bamako", href: "/restaurants", img: themedImage("salad,food", "coll-healthy", 500, 320) },
    { label: "Envie de sucré", desc: "Pâtisseries & desserts", href: "/restaurants?category=BAKERY", img: themedImage("cake,dessert", "coll-sweet", 500, 320) },
    { label: "Pharmacies 24/7", desc: "Santé à toute heure", href: "/restaurants?vertical=PHARMACY", img: themedImage("pharmacy", "coll-pharma", 500, 320) },
  ];
  return (
    <Section className="pb-10">
      <SectionHeader title="Collections" subtitle="Explorez par envie" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {collections.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group relative flex h-32 flex-col justify-end overflow-hidden rounded-2xl p-4 text-white shadow-card transition-shadow hover:shadow-lifted"
          >
            <MediaImage src={c.img} alt={c.label} fill sizes="(max-width: 1024px) 45vw, 260px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="relative">
              <p className="text-base font-black leading-tight">{c.label}</p>
              <p className="text-[12px] text-white/85">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
