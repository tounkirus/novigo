import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind en résolvant les conflits. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant en francs CFA (FCFA), entiers uniquement. */
export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
}

/** Formate un nombre court (1,2 k / 3,4 M). */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")} k`;
  return String(n);
}

/** Formate une distance en mètres/kilomètres. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/** Formate une note (4.5 -> "4,5"). */
export function formatRating(r: number): string {
  return r.toFixed(1).replace(".", ",");
}

/** Retourne une date relative en français (il y a 3 min). */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  const w = Math.floor(d / 7);
  if (w < 5) return `il y a ${w} sem`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  return `il y a ${Math.floor(d / 365)} an(s)`;
}

/** Formate une date lisible (8 juil. 2026). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formate une heure (14:30). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Calcule le pourcentage de réduction entre ancien et nouveau prix. */
export function discountPercent(oldPrice: number, price: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/** Slugifie une chaîne (pour URLs et graines d'image). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Regroupe une liste par clé. */
export function groupBy<T, K extends string | number>(list: T[], key: (item: T) => K): Record<K, T[]> {
  return list.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/** Somme d'une liste selon un sélecteur. */
export function sumBy<T>(list: T[], sel: (item: T) => number): number {
  return list.reduce((acc, item) => acc + sel(item), 0);
}

/** Limite une valeur dans un intervalle. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
