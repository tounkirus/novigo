import { describe, it, expect } from "vitest";
import {
  SERVICE_CATEGORIES, generateProviders, providerBySlug, queryProviders, serviceCategories,
  featuredProviders, generateProviderReviews, clientInterventions, generateProviderDashboard,
  generateProviderKyc, generateServiceStats, generateAdminProviderRows, generatePendingKycRows,
} from "./services";
import { DEMO_VOLUMES } from "./volumes";
import { api } from "./api";

describe("services à domicile — données", () => {
  it("expose 50 catégories de métiers avec des ids uniques", () => {
    expect(SERVICE_CATEGORIES.length).toBe(50);
    const ids = new Set(SERVICE_CATEGORIES.map((c) => c.id));
    expect(ids.size).toBe(50);
  });

  it("génère des prestataires déterministes couvrant chaque catégorie", () => {
    const a = generateProviders();
    const b = generateProviders();
    expect(a).toBe(b); // cache
    for (const cat of SERVICE_CATEGORIES) {
      expect(a.some((p) => p.categoryId === cat.id)).toBe(true);
    }
    // slugs uniques
    expect(new Set(a.map((p) => p.slug)).size).toBe(a.length);
  });

  it("retrouve un prestataire par slug avec un portfolio et une image médiathèque", () => {
    const first = generateProviders()[0];
    const found = providerBySlug(first.slug);
    expect(found?.id).toBe(first.id);
    expect(found!.portfolio.length).toBeGreaterThanOrEqual(3);
    // Image médiathèque HD : Unsplash curé (services) ou repli loremflickr.
    expect(found!.coverImage).toMatch(/^https:\/\/(images\.unsplash\.com|loremflickr\.com)\//);
  });

  it("filtre et trie les prestataires", () => {
    const cat = SERVICE_CATEGORIES[0].id;
    const byCat = queryProviders({ category: cat });
    expect(byCat.items.every((p) => p.categoryId === cat)).toBe(true);
    const byPrice = queryProviders({ sort: "price", pageSize: 5 }).items;
    for (let i = 1; i < byPrice.length; i++) {
      expect(byPrice[i].startingPrice).toBeGreaterThanOrEqual(byPrice[i - 1].startingPrice);
    }
  });

  it("compte les prestataires par catégorie et met en avant des vérifiés", () => {
    const cats = serviceCategories();
    expect(cats.every((c) => c.count >= 3)).toBe(true);
    expect(featuredProviders(6).every((p) => p.verified)).toBe(true);
  });

  it("produit avis, interventions, dashboard et KYC cohérents", () => {
    const reviews = generateProviderReviews("prov_0");
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every((r) => r.rating >= 3 && r.rating <= 5)).toBe(true);

    const intvs = clientInterventions();
    expect(intvs.length).toBeGreaterThan(0);
    expect(intvs.every((i) => i.timeline.length > 0)).toBe(true);

    const dash = generateProviderDashboard();
    expect(dash.earningsSeries.length).toBe(14);

    const kyc = generateProviderKyc();
    expect(kyc.docs.length).toBeGreaterThanOrEqual(4);

    const stats = generateServiceStats();
    expect(stats.providers).toBeGreaterThan(50);
  });

  it("atteint la volumétrie cible et pagine les tables admin", () => {
    expect(generateProviders().length).toBe(DEMO_VOLUMES.services.providers);
    const stats = generateServiceStats();
    expect(stats.providers).toBe(2000);
    expect(stats.interventions).toBe(10_000);
    expect(stats.reviews).toBe(25_000);

    const p0 = generateAdminProviderRows(0, 15);
    expect(p0.items.length).toBe(15);
    expect(p0.total).toBe(2000);
    const p1 = generateAdminProviderRows(1, 15);
    expect(p1.items[0].id).not.toBe(p0.items[0].id); // pages distinctes

    const pending = generatePendingKycRows(24);
    expect(pending.every((r) => r.kycStatus === "PENDING")).toBe(true);
  });

  it("l'API expose les méthodes services (async)", async () => {
    const cats = await api.serviceCategories();
    expect(cats.length).toBe(50);
    const providers = await api.serviceProviders({ pageSize: 8 });
    expect(providers.items.length).toBeLessThanOrEqual(8);
    expect(providers.total).toBeGreaterThan(0);
    const booking = await api.bookIntervention("prov_0", 15000);
    expect(booking.ok).toBe(true);
    expect(booking.ref).toContain("SRV-");
  });
});
