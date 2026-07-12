/**
 * Mappers DTO backend → types de domaine du client-web (SP9).
 *
 * L'API Spring expose un modèle plus compact que les types riches du front.
 * Les champs absents côté backend sont complétés de façon **déterministe**
 * (hash de l'identifiant) afin de respecter la règle « aucun Math.random / Date.now »
 * et de garder un rendu stable entre deux requêtes.
 */
import type { Store, Product, Category, StoreCategory, Vertical, Badge, GeoPoint } from "@/types";
import type { PaymentProvider } from "@/types/backoffice";
import { STORE_CATEGORY_VERTICAL } from "@/constants";
import type { CategoryDto, StoreDto, ProductDto, ProviderDto } from "./dto";

/* ---------- Déterminisme ---------- */

/** Hash 32 bits stable (FNV-1a) d'une chaîne. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Entier déterministe dans [min, max] à partir d'une graine textuelle. */
function seededInt(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

/* ---------- Catégories ---------- */

const STORE_CATEGORIES: StoreCategory[] = [
  "RESTAURANT", "SUPERMARKET", "PHARMACY", "BAKERY", "BUTCHER", "MARKET", "SHOP",
];
const VERTICALS: Vertical[] = ["FOOD", "GROCERY", "PHARMACY", "MARKET", "PARCEL", "TAXI", "SERVICES"];

const CATEGORY_ICON: Record<StoreCategory, string> = {
  RESTAURANT: "UtensilsCrossed", SUPERMARKET: "ShoppingCart", PHARMACY: "Cross",
  BAKERY: "Croissant", BUTCHER: "Beef", MARKET: "Store", SHOP: "ShoppingBag",
};
const CATEGORY_COLOR: Record<StoreCategory, string> = {
  RESTAURANT: "text-brand", SUPERMARKET: "text-emerald-500", PHARMACY: "text-sky-500",
  BAKERY: "text-amber-500", BUTCHER: "text-rose-500", MARKET: "text-orange-500", SHOP: "text-violet-500",
};

/** Normalise un code catégorie backend (chaîne libre) vers l'enum front. */
export function normalizeStoreCategory(code: string | null | undefined): StoreCategory {
  const up = (code ?? "").toUpperCase();
  const exact = STORE_CATEGORIES.find((c) => c === up);
  if (exact) return exact;
  if (up.includes("REST") || up.includes("FOOD")) return "RESTAURANT";
  if (up.includes("PHARMA")) return "PHARMACY";
  if (up.includes("BAK") || up.includes("PAIN")) return "BAKERY";
  if (up.includes("BOUCH") || up.includes("MEAT")) return "BUTCHER";
  if (up.includes("MARK") || up.includes("MARCH")) return "MARKET";
  if (up.includes("SUPER") || up.includes("GROC")) return "SUPERMARKET";
  return "SHOP";
}

function normalizeVertical(v: string | null | undefined, fallback: Vertical): Vertical {
  const up = (v ?? "").toUpperCase();
  return VERTICALS.find((x) => x === up) ?? fallback;
}

export function mapCategory(dto: CategoryDto, count = 0): Category {
  const sc = normalizeStoreCategory(dto.code);
  return {
    id: dto.code || dto.id,
    label: dto.label,
    icon: dto.icon || CATEGORY_ICON[sc],
    vertical: normalizeVertical(dto.vertical, STORE_CATEGORY_VERTICAL[sc]),
    color: CATEGORY_COLOR[sc],
    count,
  };
}

/* ---------- Boutiques ---------- */

const BAMAKO: GeoPoint = { lat: 12.6392, lng: -8.0029 };

export function mapStore(dto: StoreDto): Store {
  const category = normalizeStoreCategory(dto.category);
  const district = dto.district || "Bamako";
  const cover = dto.coverUrl || `https://picsum.photos/seed/${dto.id}/800/600`;
  const logo = dto.logoUrl || `https://picsum.photos/seed/${dto.id}-logo/200/200`;
  const rating = dto.rating != null ? Number(dto.rating) : seededInt(dto.id, 38, 49) / 10;
  const freeDelivery = dto.deliveryFee === 0;

  const badges: Badge[] = [];
  if (freeDelivery) badges.push("FREE_DELIVERY");
  if (dto.deliveryTimeMin > 0 && dto.deliveryTimeMin <= 25) badges.push("FAST");
  if (rating >= 4.5) badges.push("TOP_SELLER");
  if ((dto.status ?? "").toUpperCase() === "VERIFIED") badges.push("VERIFIED");

  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    description: `${dto.name} — ${district}`,
    category,
    subCategories: [category],
    logo,
    cover,
    gallery: [cover],
    district,
    city: "Bamako",
    address: dto.address || district,
    location: dto.lat != null && dto.lng != null ? { lat: dto.lat, lng: dto.lng } : BAMAKO,
    phone: dto.phone || "",
    openingHours: [],
    isOpen: dto.open,
    deliveryTimeMin: dto.deliveryTimeMin || seededInt(dto.id, 20, 45),
    prepTimeMin: seededInt(`${dto.id}-prep`, 8, 20),
    distanceKm: seededInt(`${dto.id}-dist`, 4, 90) / 10,
    deliveryFee: dto.deliveryFee,
    minOrder: seededInt(`${dto.id}-min`, 0, 5) * 500,
    avgPrice: seededInt(`${dto.id}-avg`, 3, 25) * 500,
    rating,
    reviewCount: dto.reviewCount,
    orderCount: seededInt(`${dto.id}-ord`, 50, 4000),
    badges,
    promotions: [],
    menu: [],
    faq: [],
    featuredProductIds: [],
  };
}

/* ---------- Produits ---------- */

export function mapProduct(dto: ProductDto): Product {
  const image = dto.imageUrl || `https://picsum.photos/seed/${dto.id}/500/500`;
  return {
    id: dto.id,
    storeId: dto.storeId,
    name: dto.name,
    description: dto.description || dto.name,
    image,
    price: dto.price,
    oldPrice: dto.oldPrice ?? undefined,
    category: dto.menuSection || "Général",
    stock: dto.stock,
    available: dto.available,
    popularity: seededInt(`${dto.id}-pop`, 40, 100),
    rating: seededInt(`${dto.id}-rate`, 38, 49) / 10,
    reviewCount: seededInt(`${dto.id}-rev`, 3, 400),
    isBestSeller: dto.bestSeller,
    isNew: dto.isNew,
  };
}

/* ---------- Fournisseurs de paiement ---------- */

const PROVIDER_ICON: Record<string, { icon: string; color: string }> = {
  ORANGE_MONEY: { icon: "Smartphone", color: "text-orange-500" },
  MOOV_MONEY: { icon: "Smartphone", color: "text-sky-500" },
  MOOV: { icon: "Smartphone", color: "text-sky-500" },
  WAVE: { icon: "Waves", color: "text-blue-500" },
  STRIPE: { icon: "CreditCard", color: "text-ink" },
  CARD: { icon: "CreditCard", color: "text-ink" },
  CASH: { icon: "Banknote", color: "text-success" },
  BANK: { icon: "Landmark", color: "text-violet-500" },
};

export function mapProvider(dto: ProviderDto): PaymentProvider {
  const style = PROVIDER_ICON[dto.code.toUpperCase()] ?? { icon: "Wallet", color: "text-muted" };
  return {
    id: `pp_${dto.code.toLowerCase()}`,
    name: dto.label,
    icon: style.icon,
    color: style.color,
    status: dto.enabled ? "OPERATIONAL" : "DOWN",
    successRate: seededInt(`${dto.code}-sr`, 900, 999) / 10,
    volume30d: seededInt(`${dto.code}-vol`, 40, 520) * 1_000_000,
    fee: dto.feeBps / 100,
    enabled: dto.enabled,
  };
}
