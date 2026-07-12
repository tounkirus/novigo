/**
 * Implémentation « live » du sous-ensemble d'API branché sur le backend Spring (SP9).
 * Chaque méthode renvoie exactement les types du front (via les mappers) afin d'être
 * substituable 1:1 aux méthodes mock. Les erreurs remontent : le wrapper d'adaptation
 * (index.ts) se charge du repli automatique sur le mock.
 */
import type { Store, Product, Category } from "@/types";
import type { PaymentProvider } from "@/types/backoffice";
import type { StoreQuery } from "@/mock";
import { httpGet } from "./http";
import type { PageResponse, StoreDto, ProductDto, CategoryDto, ProviderDto } from "./dto";
import { mapStore, mapProduct, mapCategory, mapProvider } from "./mappers";

/** Traduit le tri front vers un tri Spring (`champ,direction`). */
function sortParam(sort?: StoreQuery["sort"]): string | undefined {
  switch (sort) {
    case "rating": return "rating,desc";
    case "delivery": return "deliveryTimeMin,asc";
    default: return undefined; // défaut backend : name,asc
  }
}

export async function stores(query: StoreQuery = {}): Promise<{ items: Store[]; total: number }> {
  const page = await httpGet<PageResponse<StoreDto>>("/stores", {
    q: query.q,
    category: query.category,
    open: query.openNow,
    page: query.page ?? 0,
    size: query.pageSize ?? 24,
    sort: sortParam(query.sort),
  });
  return { items: page.content.map(mapStore), total: page.totalElements };
}

export async function storeBySlug(slug: string): Promise<Store | null> {
  const dto = await httpGet<StoreDto>(`/stores/slug/${encodeURIComponent(slug)}`);
  return dto ? mapStore(dto) : null;
}

export async function popular(n = 10): Promise<Store[]> {
  const page = await httpGet<PageResponse<StoreDto>>("/stores", { page: 0, size: n, sort: "rating,desc" });
  return page.content.map(mapStore);
}

export async function categories(): Promise<Category[]> {
  const page = await httpGet<PageResponse<CategoryDto>>("/categories", { size: 50 });
  return page.content.map((c) => mapCategory(c));
}

export async function search(q: string): Promise<{ stores: Store[]; products: Product[] }> {
  if (!q.trim()) return { stores: [], products: [] };
  const [s, p] = await Promise.all([
    httpGet<PageResponse<StoreDto>>("/stores", { q, size: 12 }),
    httpGet<PageResponse<ProductDto>>("/products", { q, size: 12 }),
  ]);
  return { stores: s.content.map(mapStore), products: p.content.map(mapProduct) };
}

export async function paymentProviders(): Promise<PaymentProvider[]> {
  const list = await httpGet<ProviderDto[]>("/payments/providers");
  return list.map(mapProvider);
}

/** Sonde de disponibilité : renvoie true si le backend répond. */
export async function health(): Promise<boolean> {
  try {
    await httpGet<unknown>("/categories", { size: 1 });
    return true;
  } catch {
    return false;
  }
}
