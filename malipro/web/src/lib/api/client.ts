"use client";

import type { AuthTokens } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

const STORAGE_KEY = "novigo.tokens";

// --- Stockage des tokens -----------------------------------------------------
// Pragmatique (localStorage). Durcissement recommandé en prod :
// access token en mémoire + refresh token en cookie httpOnly posé par le backend.
export function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthTokens) : null;
}
export function setTokens(tokens: AuthTokens): void {
  if (typeof window !== "undefined")
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}
export function clearTokens(): void {
  if (typeof window !== "undefined")
    window.localStorage.removeItem(STORAGE_KEY);
}

// --- Erreur API typée --------------------------------------------------------
export class ApiError extends Error {
  code: string;
  status: number;
  fields?: { field: string; message: string }[];
  constructor(status: number, code: string, message: string, fields?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// --- Rafraîchissement single-flight -----------------------------------------
let refreshing: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const current = getTokens();
  if (!current?.refreshToken) return null;
  if (!refreshing) {
    refreshing = fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${current.refreshToken}`,
      },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = await res.json();
        const next = body.data as AuthTokens;
        setTokens(next);
        return next;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// --- Requête générique -------------------------------------------------------
export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean; // défaut true
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = opts;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const tokens = getTokens();
    if (auth && tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const next = await refreshTokens();
    if (next) {
      res = await doFetch();
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiError(401, "UNAUTHORIZED", "Session expirée.");
    }
  }

  if (res.status === 204) return undefined as T;

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* corps vide */
  }

  if (!res.ok || (json && json.success === false)) {
    const err = json?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "ERROR",
      err.message ?? "Une erreur est survenue.",
      err.fields
    );
  }

  return json as T;
}
