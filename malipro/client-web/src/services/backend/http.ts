/**
 * Client HTTP minimal pour l'API Spring (SP9).
 * - Préfixe automatique par `API_BASE_URL`
 * - Jeton Bearer injecté depuis le token-store
 * - Timeout via AbortController → bascule mock si le backend ne répond pas
 * - Erreurs HTTP normalisées en `BackendError`
 */
import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { getAccessToken } from "./token-store";

export class BackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(method: string, path: string, opts?: { params?: QueryParams; body?: unknown }): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts?.body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(buildUrl(path, opts?.params), {
      method,
      headers,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      const message = (data as { message?: string })?.message ?? `HTTP ${res.status}`;
      throw new BackendError(res.status, message, data);
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function httpGet<T>(path: string, params?: QueryParams): Promise<T> {
  return request<T>("GET", path, { params });
}

export function httpPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, { body });
}

export function httpPatch<T>(path: string, params?: QueryParams): Promise<T> {
  return request<T>("PATCH", path, { params });
}
