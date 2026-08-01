// NOVIGO Brain — géométrie et découpage de la ville.
// Volontairement sans dépendance externe : le Brain doit rester calculable
// hors ligne (démo zéro-infra) et déterministe pour les tests.

import { GeoPoint } from "./brain.types";

const R_EARTH_M = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/// Distance orthodromique en mètres entre deux points.
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R_EARTH_M * Math.asin(Math.sqrt(s)));
}

/// Facteur de détour urbain : la rue n'est jamais la ligne droite.
export const URBAN_DETOUR = 1.28;

/// Distance réellement parcourue (mètres) entre deux points en ville.
export function roadMeters(a: GeoPoint, b: GeoPoint): number {
  return Math.round(haversineMeters(a, b) * URBAN_DETOUR);
}

/// Quartiers de Bamako connus du Brain (centroïdes approximatifs).
/// Sert au découpage des statistiques du Livre de Connaissances.
export const ZONES: { name: string; city: string; lat: number; lng: number }[] = [
  { name: "Centre-ville", city: "Bamako", lat: 12.6503, lng: -7.9861 },
  { name: "Hamdallaye ACI", city: "Bamako", lat: 12.6392, lng: -8.0290 },
  { name: "Badalabougou", city: "Bamako", lat: 12.6222, lng: -7.9878 },
  { name: "Kalaban Coura", city: "Bamako", lat: 12.5936, lng: -8.0083 },
  { name: "Faladié", city: "Bamako", lat: 12.5872, lng: -7.9500 },
  { name: "Magnambougou", city: "Bamako", lat: 12.6100, lng: -7.9430 },
  { name: "Sotuba", city: "Bamako", lat: 12.6640, lng: -7.9310 },
  { name: "Djélibougou", city: "Bamako", lat: 12.6740, lng: -8.0010 },
  { name: "Lafiabougou", city: "Bamako", lat: 12.6420, lng: -8.0450 },
  { name: "Sébénikoro", city: "Bamako", lat: 12.6180, lng: -8.0640 },
  { name: "Kati", city: "Kati", lat: 12.7440, lng: -8.0730 },
];

/// Zone la plus proche d'un point (repli : « Bamako » si point inconnu).
export function zoneOf(point?: GeoPoint | null): { zone: string; city: string } {
  if (!point || typeof point.lat !== "number" || typeof point.lng !== "number") {
    return { zone: "Bamako", city: "Bamako" };
  }
  let best = ZONES[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const z of ZONES) {
    const d = haversineMeters(point, { lat: z.lat, lng: z.lng });
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return { zone: best.name, city: best.city };
}

/// Coordonnées d'une zone connue (utile quand seule l'adresse texte existe).
export function zoneCenter(name?: string | null): GeoPoint | undefined {
  const z = ZONES.find((x) => x.name.toLowerCase() === (name ?? "").toLowerCase());
  return z ? { lat: z.lat, lng: z.lng } : undefined;
}

/// Arrondi commercial au pas de 25 XOF (le prix affiché reste lisible).
export function roundPrice(amount: number, step = 25): number {
  return Math.max(0, Math.round(amount / step) * step);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
