import type { Store, Product, Category, StoreCategory, Vertical, SeriesPoint } from "@/types";
import { STORE_CATEGORY_VERTICAL, VERTICALS, NOW } from "@/constants";
import * as db from "./db";
import { seededRng } from "./rng";

export * from "./db";

/** Catégories affichées sur la home, comptées depuis le dataset réel. */
export function categories(): Category[] {
  const all = db.stores();
  const byCat = (c: StoreCategory) => all.filter((s) => s.category === c).length;
  const defs: { id: StoreCategory; label: string; icon: string; color: string }[] = [
    { id: "RESTAURANT", label: "Restaurants", icon: "UtensilsCrossed", color: "text-brand" },
    { id: "SUPERMARKET", label: "Supermarchés", icon: "ShoppingCart", color: "text-emerald-500" },
    { id: "PHARMACY", label: "Pharmacies", icon: "Cross", color: "text-sky-500" },
    { id: "BAKERY", label: "Boulangeries", icon: "Croissant", color: "text-amber-500" },
    { id: "BUTCHER", label: "Boucheries", icon: "Beef", color: "text-rose-500" },
    { id: "MARKET", label: "Marchés", icon: "Store", color: "text-orange-500" },
    { id: "SHOP", label: "Boutiques", icon: "ShoppingBag", color: "text-violet-500" },
  ];
  return defs.map((d) => ({
    id: d.id,
    label: d.label,
    icon: d.icon,
    vertical: STORE_CATEGORY_VERTICAL[d.id],
    color: d.color,
    count: byCat(d.id),
  }));
}

export interface StoreQuery {
  category?: StoreCategory;
  vertical?: Vertical;
  q?: string;
  sort?: "rating" | "delivery" | "distance" | "popular";
  freeDelivery?: boolean;
  openNow?: boolean;
  maxDeliveryFee?: number;
  page?: number;
  pageSize?: number;
}

export function queryStores(query: StoreQuery = {}): { items: Store[]; total: number } {
  let items = db.stores();
  if (query.category) items = items.filter((s) => s.category === query.category);
  if (query.vertical) items = items.filter((s) => STORE_CATEGORY_VERTICAL[s.category] === query.vertical);
  if (query.freeDelivery) items = items.filter((s) => s.deliveryFee === 0);
  if (query.openNow) items = items.filter((s) => s.isOpen);
  if (query.maxDeliveryFee != null) items = items.filter((s) => s.deliveryFee <= query.maxDeliveryFee!);
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.subCategories.some((c) => c.toLowerCase().includes(q)),
    );
  }
  const sort = query.sort ?? "popular";
  items = [...items].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "delivery") return a.deliveryTimeMin - b.deliveryTimeMin;
    if (sort === "distance") return a.distanceKm - b.distanceKm;
    return b.orderCount - a.orderCount;
  });
  const total = items.length;
  const page = query.page ?? 0;
  const size = query.pageSize ?? 24;
  return { items: items.slice(page * size, page * size + size), total };
}

export function popularStores(n = 12): Store[] {
  return [...db.stores()].sort((a, b) => b.orderCount - a.orderCount).slice(0, n);
}
export function topRatedStores(n = 12): Store[] {
  return [...db.stores()].sort((a, b) => b.rating - a.rating).slice(0, n);
}
export function newStores(n = 12): Store[] {
  return db.stores().filter((s) => s.badges.includes("NEW")).slice(0, n);
}
export function freeDeliveryStores(n = 12): Store[] {
  return db.stores().filter((s) => s.deliveryFee === 0).slice(0, n);
}
export function fastStores(n = 12): Store[] {
  return [...db.stores()].sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin).slice(0, n);
}
export function recommendedStores(n = 12): Store[] {
  return [...db.stores()]
    .filter((s) => s.rating >= 4.3 && s.isOpen)
    .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
    .slice(0, n);
}

/** Recherche transverse (boutiques + plats). */
export function search(q: string): { stores: Store[]; products: Product[] } {
  if (!q.trim()) return { stores: [], products: [] };
  const stores = queryStores({ q, pageSize: 12 }).items;
  const lower = q.toLowerCase();
  const products = db
    .featuredProducts()
    .filter((p) => p.name.toLowerCase().includes(lower))
    .slice(0, 12);
  return { stores, products };
}

export function favoriteStores(): Store[] {
  return db.user.favoriteStoreIds.map((id) => db.storeById(id)).filter(Boolean) as Store[];
}

export const verticals = VERTICALS;

/** Séries statistiques pour les dashboards (déterministes). */
export function revenueSeries(days = 14, seed = 7): SeriesPoint[] {
  const rng = seededRng(seed, days);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(NOW - (days - 1 - i) * 86400_000);
    return {
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      value: rng.int(180_000, 640_000),
      secondary: rng.int(40, 180),
    };
  });
}

export function hourlySeries(seed = 11): SeriesPoint[] {
  const rng = seededRng(seed, 24);
  return Array.from({ length: 24 }, (_, h) => ({
    label: `${h}h`,
    value: rng.int(2, 40) * (h >= 11 && h <= 14 ? 3 : h >= 19 && h <= 21 ? 4 : 1),
  }));
}

export function categoryShare(): SeriesPoint[] {
  return categories().map((c) => ({ label: c.label, value: c.count }));
}
