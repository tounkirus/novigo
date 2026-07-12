/**
 * Stockage des jetons de session backend (SP9).
 * Persiste en `localStorage` côté navigateur ; retombe sur un cache mémoire en SSR.
 * Additif : rien n'est utilisé tant que l'app reste en mode mock.
 */

const ACCESS_KEY = "novigo.accessToken";
const REFRESH_KEY = "novigo.refreshToken";

let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (hasWindow()) return window.localStorage.getItem(ACCESS_KEY);
  return memoryAccess;
}

export function getRefreshToken(): string | null {
  if (hasWindow()) return window.localStorage.getItem(REFRESH_KEY);
  return memoryRefresh;
}

export function setTokens(accessToken: string | null, refreshToken?: string | null): void {
  memoryAccess = accessToken;
  if (refreshToken !== undefined) memoryRefresh = refreshToken;
  if (!hasWindow()) return;
  if (accessToken) window.localStorage.setItem(ACCESS_KEY, accessToken);
  else window.localStorage.removeItem(ACCESS_KEY);
  if (refreshToken !== undefined) {
    if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
    else window.localStorage.removeItem(REFRESH_KEY);
  }
}

export function clearTokens(): void {
  setTokens(null, null);
}
