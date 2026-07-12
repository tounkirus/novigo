import { describe, it, expect } from "vitest";
import {
  generateBanners, generatePages, generateCollections, generateCrmCustomers, generateCrmSegments,
  generateTickets, generateInventory, generateSuppliers, generateInvoices, generateFinanceSummary,
  generateRoles, generateFeatureFlags, generateSystemServices, generateAuditLogs,
} from "./backoffice";
import { api } from "./api";

describe("back-office — CMS", () => {
  it("bannières, pages et collections non vides", () => {
    expect(generateBanners().length).toBeGreaterThan(0);
    expect(generatePages().every((p) => p.slug.length > 0)).toBe(true);
    expect(generateCollections().some((c) => c.featured)).toBe(true);
  });
});

describe("back-office — CRM", () => {
  it("clients déterministes avec segment et LTV", () => {
    const a = generateCrmCustomers(30);
    const b = generateCrmCustomers(30);
    expect(a).toHaveLength(30);
    expect(a[0].id).toBe(b[0].id);
    expect(a.every((c) => c.ltv >= 0)).toBe(true);
  });

  it("segments couvrent tout et somment les clients", () => {
    const segs = generateCrmSegments();
    expect(segs).toHaveLength(5);
    expect(segs.reduce((s, x) => s + x.count, 0)).toBe(600);
  });

  it("tickets triés avec priorités", () => {
    const t = generateTickets();
    expect(t.length).toBeGreaterThan(0);
    expect(t.some((x) => x.priority === "URGENT")).toBe(true);
  });
});

describe("back-office — ERP", () => {
  it("inventaire calcule les statuts de stock", () => {
    const inv = generateInventory(40);
    expect(inv).toHaveLength(40);
    expect(inv.every((i) => ["IN_STOCK", "LOW", "OUT"].includes(i.status))).toBe(true);
    expect(inv.every((i) => i.sellPrice >= i.costPrice)).toBe(true);
  });

  it("fournisseurs, factures et résumé financier", () => {
    expect(generateSuppliers().length).toBeGreaterThan(0);
    expect(generateInvoices().length).toBeGreaterThan(0);
    expect(generateFinanceSummary().revenue).toBeGreaterThan(0);
  });
});

describe("back-office — Super Admin", () => {
  it("rôles, flags, services et audit", () => {
    expect(generateRoles().some((r) => r.name === "Super Admin")).toBe(true);
    expect(generateFeatureFlags().some((f) => f.enabled)).toBe(true);
    expect(generateSystemServices().length).toBe(8);
    expect(generateAuditLogs().every((l) => ["INFO", "WARNING", "CRITICAL"].includes(l.level))).toBe(true);
  });
});

describe("api back-office", () => {
  it("expose les méthodes async back-office", async () => {
    expect((await api.crmSegments()).length).toBe(5);
    expect((await api.inventory()).length).toBeGreaterThan(0);
    expect((await api.systemServices()).length).toBe(8);
  });
});
