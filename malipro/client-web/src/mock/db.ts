import type { Store, Product, Review, Order, MenuSection, Driver } from "@/types";
import { DATASET_TARGETS } from "@/constants";
import {
  generateStores, generateMenu, generateReviews, generateOrdersForUser, generateCoupons,
  generatePromotions, generateNotifications, generateUser, generateDrivers,
} from "./generators";

/**
 * Base de démonstration NOVIGO.
 * Les métadonnées des boutiques sont générées une seule fois (eager).
 * Les menus, avis et détails lourds sont générés à la demande et mémoïsés,
 * pour garder l'app rapide même avec une volumétrie « massive ».
 */
const STORE_COUNTS = {
  RESTAURANT: DATASET_TARGETS.restaurants,
  SUPERMARKET: DATASET_TARGETS.supermarkets,
  PHARMACY: DATASET_TARGETS.pharmacies,
  BAKERY: DATASET_TARGETS.bakeries,
  BUTCHER: DATASET_TARGETS.butchers,
  MARKET: DATASET_TARGETS.markets,
  SHOP: DATASET_TARGETS.shops,
} as const;

let _stores: Store[] | null = null;
const _menuCache = new Map<string, MenuSection[]>();
const _reviewCache = new Map<string, Review[]>();

export function stores(): Store[] {
  if (!_stores) _stores = generateStores(STORE_COUNTS);
  return _stores;
}

export function storeById(id: string): Store | undefined {
  return stores().find((s) => s.id === id);
}

export function storeBySlug(slug: string): Store | undefined {
  return stores().find((s) => s.slug === slug);
}

export function menuOf(store: Store): MenuSection[] {
  let m = _menuCache.get(store.id);
  if (!m) {
    m = generateMenu(store);
    _menuCache.set(store.id, m);
  }
  return m;
}

export function productsOf(store: Store): Product[] {
  return menuOf(store).flatMap((s) => s.products);
}

export function productById(storeId: string, productId: string): Product | undefined {
  const s = storeById(storeId);
  if (!s) return undefined;
  return productsOf(s).find((p) => p.id === productId);
}

export function reviewsOf(store: Store, count = 14): Review[] {
  let r = _reviewCache.get(store.id);
  if (!r) {
    r = generateReviews(store, count);
    _reviewCache.set(store.id, r);
  }
  return r;
}

/** Sélection de produits mis en avant, agrégée depuis les meilleures boutiques. */
let _featured: Product[] | null = null;
export function featuredProducts(): Product[] {
  if (!_featured) {
    const top = [...stores()].sort((a, b) => b.rating - a.rating).slice(0, 24);
    _featured = top.flatMap((s) => productsOf(s).filter((p) => p.isFeatured || p.isBestSeller).slice(0, 4));
  }
  return _featured;
}

let _drivers: Driver[] | null = null;
export function drivers(): Driver[] {
  if (!_drivers) _drivers = generateDrivers(220);
  return _drivers;
}

// Données de l'utilisateur courant + jeux annexes (petits, eager).
export const user = generateUser(stores());
let _orders: Order[] | null = null;
export function orders(): Order[] {
  if (!_orders) _orders = generateOrdersForUser(user, stores(), 26);
  return _orders;
}
export function orderById(id: string): Order | undefined {
  return orders().find((o) => o.id === id);
}
export function activeOrder(): Order | undefined {
  return orders().find((o) => o.status === "DELIVERING" || o.status === "ASSIGNED" || o.status === "PREPARING");
}

export const coupons = generateCoupons(48);
export const promotions = generatePromotions(stores(), 16);
export const notifications = generateNotifications(24);
