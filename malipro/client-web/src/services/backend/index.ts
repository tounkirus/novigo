/**
 * Adaptateur backend NOVIGO (SP9) — point d'entrée.
 *
 * `withBackendAdapter(mock)` renvoie :
 *  - en mode **mock** (défaut) : l'objet mock **inchangé** (zéro surcoût, comportement identique) ;
 *  - en mode **live** : le même objet dont un sous-ensemble de méthodes est redirigé vers
 *    le backend Spring, avec **repli automatique sur le mock** en cas d'erreur réseau,
 *    de backend indisponible ou de réponse invalide.
 *
 * Aucune page ni composant n'a besoin de changer : seul `@/mock/api` consomme ce wrapper.
 */
import type { Store, Product, Category } from "@/types";
import type { PaymentProvider } from "@/types/backoffice";
import type { StoreQuery } from "@/mock";
import { isLiveMode } from "./config";
import * as live from "./live-api";

export { isLiveMode, API_MODE, API_BASE_URL } from "./config";
export * as backendAuth from "./auth";
export { BackendError } from "./http";

/** Sous-ensemble de méthodes de l'API mock que l'adaptateur sait servir en live. */
interface LiveOverridable {
  stores(query?: StoreQuery): Promise<{ items: Store[]; total: number }>;
  storeBySlug(slug: string): Promise<Store | null>;
  categories(): Promise<Category[]>;
  search(q: string): Promise<{ stores: Store[]; products: Product[] }>;
  popular(n?: number): Promise<Store[]>;
  paymentProviders(): Promise<PaymentProvider[]>;
}

/** Exécute l'appel live ; en cas d'échec, retombe silencieusement sur le mock. */
async function withFallback<T>(liveCall: () => Promise<T>, mockCall: () => Promise<T>, label: string): Promise<T> {
  try {
    return await liveCall();
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn(`[novigo] backend "${label}" indisponible → repli mock`, err);
    }
    return mockCall();
  }
}

/**
 * Enveloppe l'API mock. Le type de retour est identique à l'entrée : les composants
 * continuent de voir exactement la même surface (`Api`).
 */
export function withBackendAdapter<T extends LiveOverridable>(mock: T): T {
  if (!isLiveMode()) return mock;

  const overrides: LiveOverridable = {
    stores: (query) => withFallback(() => live.stores(query), () => mock.stores(query), "stores"),
    storeBySlug: (slug) => withFallback(() => live.storeBySlug(slug), () => mock.storeBySlug(slug), "storeBySlug"),
    categories: () => withFallback(() => live.categories(), () => mock.categories(), "categories"),
    search: (q) => withFallback(() => live.search(q), () => mock.search(q), "search"),
    popular: (n) => withFallback(() => live.popular(n), () => mock.popular(n), "popular"),
    paymentProviders: () =>
      withFallback(() => live.paymentProviders(), () => mock.paymentProviders(), "paymentProviders"),
  };

  return { ...mock, ...overrides } as T;
}
