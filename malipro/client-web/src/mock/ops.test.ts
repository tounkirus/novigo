import { describe, it, expect } from "vitest";
import { generateKitchenTickets, generateFraudAlerts } from "./ops";
import { api } from "./api";

describe("opérations commerçant — cuisine", () => {
  it("tickets déterministes répartis par statut", () => {
    const a = generateKitchenTickets(18);
    const b = generateKitchenTickets(18);
    expect(a).toHaveLength(18);
    expect(a[0].id).toBe(b[0].id);
    expect(a.every((t) => t.items.length > 0)).toBe(true);
    expect(a.some((t) => t.status === "WAITING")).toBe(true);
    expect(a.some((t) => t.status === "PREPARING")).toBe(true);
  });
});

describe("sécurité financière — fraude", () => {
  it("alertes avec risque et statut valides", () => {
    const f = generateFraudAlerts(16);
    expect(f).toHaveLength(16);
    expect(f.some((x) => x.risk === "HIGH")).toBe(true);
    expect(f.every((x) => ["OPEN", "REVIEWING", "CLEARED", "CONFIRMED"].includes(x.status))).toBe(true);
    expect(f.every((x) => x.amount > 0 && x.reason.length > 0)).toBe(true);
  });

  it("api expose kitchenTickets et fraudAlerts", async () => {
    expect((await api.kitchenTickets()).length).toBeGreaterThan(0);
    expect((await api.fraudAlerts()).length).toBeGreaterThan(0);
  });
});
