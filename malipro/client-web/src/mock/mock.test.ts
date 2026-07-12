import { describe, it, expect } from "vitest";
import { stores, storeBySlug, menuOf, productsOf, queryStores, categories } from "./index";
import { generateWallet, generateRideQuote, generateLoyalty, LOYALTY_TIERS, generateBundles } from "./modules";
import { api } from "./api";
import { DATASET_TARGETS } from "@/constants";

describe("catalogue mock", () => {
  it("génère la volumétrie cible de commerces", () => {
    const total =
      DATASET_TARGETS.restaurants + DATASET_TARGETS.supermarkets + DATASET_TARGETS.pharmacies +
      DATASET_TARGETS.bakeries + DATASET_TARGETS.butchers + DATASET_TARGETS.markets + DATASET_TARGETS.shops;
    expect(stores()).toHaveLength(total);
  });

  it("est déterministe (mêmes ids à chaque accès)", () => {
    expect(stores()[0].id).toBe(stores()[0].id);
    expect(stores()[10].slug).toBe(stores()[10].slug);
  });

  it("résout un commerce par slug et charge son menu", () => {
    const s = stores()[0];
    expect(storeBySlug(s.slug)?.id).toBe(s.id);
    expect(menuOf(s).length).toBeGreaterThan(0);
    expect(productsOf(s).length).toBeGreaterThan(0);
  });

  it("queryStores filtre et pagine", () => {
    const res = queryStores({ category: "RESTAURANT", pageSize: 12 });
    expect(res.items.length).toBeLessThanOrEqual(12);
    expect(res.items.every((s) => s.category === "RESTAURANT")).toBe(true);
    expect(res.total).toBe(DATASET_TARGETS.restaurants);
  });

  it("catégories comptent les commerces", () => {
    const cats = categories();
    expect(cats.find((c) => c.id === "RESTAURANT")?.count).toBe(DATASET_TARGETS.restaurants);
  });
});

describe("modules mock", () => {
  it("wallet : soldes cohérents", () => {
    const w = generateWallet();
    expect(w.balance).toBe(24500);
    expect(w.transactions.length).toBeGreaterThan(0);
    expect(w.monthlyIn).toBeGreaterThan(0);
  });

  it("ride quote : déterministe et 3 options triées", () => {
    const q1 = generateRideQuote("Hamdallaye", "Hippodrome");
    const q2 = generateRideQuote("Hamdallaye", "Hippodrome");
    expect(q1.options).toHaveLength(3);
    expect(q1.distanceKm).toBe(q2.distanceKm);
    expect(q1.options.map((o) => o.mode)).toEqual(["MOTO", "TAXI", "EXPRESS"]);
  });

  it("loyalty : palier et paliers globaux", () => {
    const l = generateLoyalty();
    expect(l.points).toBeGreaterThan(0);
    expect(LOYALTY_TIERS).toHaveLength(4);
    expect(l.rewards.length).toBeGreaterThan(0);
  });

  it("bundles : contiennent crédit, data et combo", () => {
    const b = generateBundles("orange");
    expect(b.some((x) => x.type === "AIRTIME")).toBe(true);
    expect(b.some((x) => x.type === "DATA")).toBe(true);
    expect(b.some((x) => x.type === "COMBO")).toBe(true);
  });
});

describe("api mock asynchrone", () => {
  it("wallet() renvoie une Promesse résolue", async () => {
    const w = await api.wallet();
    expect(w.currency).toBe("FCFA");
  });

  it("rideQuote() renvoie des options", async () => {
    const q = await api.rideQuote("A", "B");
    expect(q.options.length).toBe(3);
  });

  it("recommendations() attache un store à chaque item", async () => {
    const recs = await api.recommendations();
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].store).toBeDefined();
  });
});
