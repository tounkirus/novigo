import { describe, it, expect } from "vitest";
import {
  generatePlatformOverview, generateCommissionRules, generateWalletLimits,
  generatePaymentProviders, generateServiceZones, generateAdminStaff,
} from "./superadmin";
import { api } from "./api";

describe("super admin — command center & config", () => {
  it("fournit une vue d'ensemble plateforme cohérente", () => {
    const o = generatePlatformOverview();
    expect(o.users).toBeGreaterThan(0);
    expect(o.uptime).toBeGreaterThan(90);
  });

  it("expose des commissions et limites par rôle", () => {
    const rules = generateCommissionRules();
    expect(rules.length).toBeGreaterThanOrEqual(6);
    expect(rules.every((r) => r.rate >= 0 && r.rate <= 40)).toBe(true);
    const limits = generateWalletLimits();
    expect(limits.some((l) => l.role === "Prestataire")).toBe(true);
  });

  it("liste les fournisseurs de paiement et zones (déterministe)", () => {
    const p = generatePaymentProviders();
    expect(p.some((x) => x.name === "Orange Money")).toBe(true);
    const z1 = generateServiceZones();
    const z2 = generateServiceZones();
    expect(z1).toEqual(z2);
    expect(z1.length).toBeGreaterThan(0);
  });

  it("génère une équipe admin avec un Super Admin en 2FA", () => {
    const staff = generateAdminStaff(12);
    expect(staff.length).toBe(12);
    expect(staff[0].role).toBe("Super Admin");
    expect(staff[0].twoFactor).toBe(true);
  });

  it("l'API expose les méthodes super admin (async)", async () => {
    const o = await api.platformOverview();
    expect(o.merchants).toBeGreaterThan(0);
    const staff = await api.adminStaff();
    expect(staff.length).toBeGreaterThan(0);
  });
});
