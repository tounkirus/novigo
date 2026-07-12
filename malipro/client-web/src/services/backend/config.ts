/**
 * Configuration de l'adaptateur backend (SP9).
 *
 * Le client-web fonctionne par défaut en mode **mock** (données déterministes, zéro infra).
 * Pour brancher le vrai backend Spring (:8081), définir au build/runtime :
 *   NEXT_PUBLIC_API_MODE=live
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api/v1   (optionnel, valeur par défaut)
 *
 * Tout est additif : sans ces variables, le comportement est strictement identique à avant.
 */

export type ApiMode = "mock" | "live";

/** Mode courant, lu une seule fois. `mock` par défaut. */
export const API_MODE: ApiMode =
  (process.env.NEXT_PUBLIC_API_MODE ?? "").toLowerCase() === "live" ? "live" : "mock";

/** URL de base de l'API Spring (préfixe `/api/v1` inclus). */
export const API_BASE_URL: string = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api/v1"
).replace(/\/+$/, "");

/** Délai maximal (ms) d'un appel réseau avant bascule sur le mock. */
export const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 6000);

export function isLiveMode(): boolean {
  return API_MODE === "live";
}
