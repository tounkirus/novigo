import { describe, it, expect } from "vitest";
import {
  generateWalletAccount, generateWalletAccounts, generateDriverWalletSummary,
  generateMerchantWalletSummary, generateAdminFinanceOverview, generatePayoutRequests,
} from "./wallet";
import {
  generateCashRegister, generateCashRegisters, generateRemittances, generateReconciliations,
  generateDiscrepancies, generateCashDashboard,
} from "./cash";
import { api } from "./api";

describe("wallet — comptes & transactions", () => {
  it("génère un compte déterministe avec transactions typées", () => {
    const a = generateWalletAccount("DRIVER", "driver_me", "Ibrahim Coulibaly");
    const b = generateWalletAccount("DRIVER", "driver_me", "Ibrahim Coulibaly");
    expect(a.transactions.length).toBe(30);
    expect(a.balance).toBe(b.balance);
    expect(a.currency).toBe("FCFA");
    expect(a.transactions.every((t) => t.ref.startsWith("TX-"))).toBe(true);
  });

  it("les résumés par rôle sont cohérents", () => {
    const d = generateDriverWalletSummary();
    expect(d.week).toBeGreaterThanOrEqual(d.today);
    expect(d.month).toBeGreaterThanOrEqual(d.week);
    const m = generateMerchantWalletSummary();
    expect(m.commissions).toBeLessThan(m.sales);
    expect(generateAdminFinanceOverview().walletsCount).toBeGreaterThan(0);
  });

  it("comptes admin et demandes de paiement", () => {
    expect(generateWalletAccounts(30)).toHaveLength(30);
    const po = generatePayoutRequests();
    expect(po.length).toBeGreaterThan(0);
    expect(po.some((p) => p.status === "PENDING")).toBe(true);
  });
});

describe("cash management", () => {
  it("caisse : statut dérivé du solde et du plafond", () => {
    const r = generateCashRegister();
    expect(["OK", "OVER_LIMIT", "NEGATIVE", "FROZEN"]).toContain(r.status);
    expect(r.toRemit).toBe(r.balance);
  });

  it("registres, remises, rapprochements, écarts", () => {
    expect(generateCashRegisters(40)).toHaveLength(40);
    expect(generateRemittances().some((x) => x.status === "PENDING")).toBe(true);
    const rec = generateReconciliations();
    expect(rec.every((r) => typeof r.gap === "number")).toBe(true);
    expect(generateDiscrepancies().some((d) => d.severity === "HIGH")).toBe(true);
  });

  it("tableau de bord caisse agrège les registres", () => {
    const d = generateCashDashboard();
    expect(d.collectedToday).toBeGreaterThan(0);
    expect(d.cashRatio).toBeGreaterThan(0);
  });
});

describe("api wallet & cash", () => {
  it("expose les méthodes async", async () => {
    expect((await api.walletAccount("MERCHANT")).role).toBe("MERCHANT");
    expect((await api.driverWalletSummary()).deliveries).toBeGreaterThan(0);
    expect((await api.cashDashboard()).collectedToday).toBeGreaterThan(0);
    expect((await api.cashRemittances()).length).toBeGreaterThan(0);
  });
});
