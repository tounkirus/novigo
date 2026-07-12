import type { Product } from "@/types";

/** Seuil de stock faible pour le catalogue commerçant. */
export const LOW_STOCK = 5;

export type ProductFilter = "all" | "available" | "unavailable" | "promo" | "low" | "popular";

export const PRODUCT_FILTERS: { value: ProductFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "available", label: "Disponible" },
  { value: "unavailable", label: "Indisponible" },
  { value: "promo", label: "Promo" },
  { value: "low", label: "Stock faible" },
  { value: "popular", label: "Populaires" },
];

export function isLowStock(p: Product): boolean {
  return p.stock > 0 && p.stock <= LOW_STOCK;
}

/** Pastille de couleur selon le niveau de stock. */
export function stockTone(stock: number): "success" | "warning" | "error" {
  if (stock === 0) return "error";
  if (stock <= LOW_STOCK) return "warning";
  return "success";
}

export function stockDotClass(stock: number): string {
  const tone = stockTone(stock);
  return tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-error";
}

export function matchesFilter(p: Product, filter: ProductFilter): boolean {
  switch (filter) {
    case "available":
      return p.available;
    case "unavailable":
      return !p.available;
    case "promo":
      return p.oldPrice != null && p.oldPrice > p.price;
    case "low":
      return isLowStock(p);
    case "popular":
      return p.popularity >= 70 || Boolean(p.isBestSeller);
    default:
      return true;
  }
}

/** Compteur d'identifiants déterministe (aucun Date.now / Math.random). */
export function makeIdFactory(prefix: string, start = 1) {
  let n = start;
  return () => `${prefix}_local_${n++}`;
}
