import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapStore, mapCategory, mapProvider, normalizeStoreCategory } from "./mappers";
import { withBackendAdapter } from "./index";
import type { StoreDto, CategoryDto, ProviderDto } from "./dto";

/* ---------- Mappers (déterministes, purs) ---------- */

describe("mappers backend → front", () => {
  const storeDto: StoreDto = {
    id: "s-1", slug: "chez-fatou", name: "Chez Fatou", category: "restaurant",
    ownerId: null, cityId: null, district: "Hamdallaye", address: "Rue 12", phone: "+22300",
    lat: 12.6, lng: -8.0, rating: 4.6, reviewCount: 210, open: true, deliveryFee: 0,
    deliveryTimeMin: 22, coverUrl: null, logoUrl: null, status: "VERIFIED",
  };

  it("mappe une boutique et complète les champs manquants de façon stable", () => {
    const a = mapStore(storeDto);
    const b = mapStore(storeDto);
    expect(a.name).toBe("Chez Fatou");
    expect(a.category).toBe("RESTAURANT");
    expect(a.deliveryFee).toBe(0);
    expect(a.badges).toContain("FREE_DELIVERY");
    expect(a.badges).toContain("FAST");
    expect(a.badges).toContain("VERIFIED");
    // Déterminisme : deux mappings du même DTO donnent le même résultat.
    expect(a.distanceKm).toBe(b.distanceKm);
    expect(a.orderCount).toBe(b.orderCount);
    expect(a.cover).toContain("s-1");
  });

  it("normalise les codes catégorie libres vers l'enum front", () => {
    expect(normalizeStoreCategory("PHARMACIE")).toBe("PHARMACY");
    expect(normalizeStoreCategory("resto-food")).toBe("RESTAURANT");
    expect(normalizeStoreCategory("inconnu")).toBe("SHOP");
  });

  it("mappe une catégorie avec icône/couleur/vertical", () => {
    const dto: CategoryDto = { id: "c1", code: "RESTAURANT", label: "Restaurants", icon: null, vertical: null };
    const c = mapCategory(dto, 42);
    expect(c.label).toBe("Restaurants");
    expect(c.vertical).toBe("FOOD");
    expect(c.icon).toBe("UtensilsCrossed");
    expect(c.count).toBe(42);
  });

  it("mappe un fournisseur de paiement", () => {
    const dto: ProviderDto = { code: "WAVE", label: "Wave", enabled: true, sortOrder: 2, feeBps: 100 };
    const p = mapProvider(dto);
    expect(p.id).toBe("pp_wave");
    expect(p.name).toBe("Wave");
    expect(p.fee).toBe(1);
    expect(p.enabled).toBe(true);
    expect(p.status).toBe("OPERATIONAL");
  });
});

/* ---------- Wrapper d'adaptation ---------- */

describe("withBackendAdapter", () => {
  const mock = {
    stores: vi.fn(async () => ({ items: [{ id: "mock" } as never], total: 1 })),
    storeBySlug: vi.fn(async () => null),
    categories: vi.fn(async () => []),
    search: vi.fn(async () => ({ stores: [], products: [] })),
    popular: vi.fn(async () => []),
    paymentProviders: vi.fn(async () => []),
    other: vi.fn(async () => "inchangé"),
  };

  beforeEach(() => vi.clearAllMocks());

  it("en mode mock (défaut), renvoie l'objet mock inchangé", async () => {
    // NEXT_PUBLIC_API_MODE non défini → isLiveMode() = false.
    const api = withBackendAdapter(mock);
    expect(api).toBe(mock);
    const res = await api.stores();
    expect(res.total).toBe(1);
    expect(mock.stores).toHaveBeenCalledOnce();
  });

  it("préserve les méthodes non surchargées", async () => {
    const api = withBackendAdapter(mock);
    // @ts-expect-error — `other` n'est pas dans LiveOverridable mais reste présent
    expect(await api.other()).toBe("inchangé");
  });
});
