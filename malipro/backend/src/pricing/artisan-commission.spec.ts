import {
  DEFAULT_ARTISAN_COMMISSION,
  artisanCommission,
  assessBlocking,
  cashCommissionDueAt,
} from "./artisan-commission";

describe("Commission artisans (Module Artisans, chapitre 7)", () => {
  describe("barème dégressif", () => {
    it.each([
      [10_000, 10, 1_000],
      [50_000, 10, 5_000],
      [50_001, 7, 3_500],
      [200_000, 7, 14_000],
      [200_001, 5, 10_000],
      [1_000_000, 5, 50_000],
    ])("sur %s FCFA applique %s %% soit %s FCFA", (amount, percent, expected) => {
      const r = artisanCommission(amount);
      expect(r.percent).toBe(percent);
      expect(r.amount).toBe(expected);
    });

    it("applique 3 % au-delà d'un million", () => {
      expect(artisanCommission(1_200_000).percent).toBe(3);
    });

    it("le net revenant à l'artisan complète toujours le total", () => {
      for (const amount of [0, 7_500, 50_000, 123_456, 2_000_000]) {
        const r = artisanCommission(amount);
        expect(r.amount + r.net).toBe(amount);
      }
    });
  });

  describe("plafond de 50 000 FCFA", () => {
    it("n'écrête pas tant que le calcul reste sous le plafond", () => {
      const r = artisanCommission(1_000_000);
      expect(r.amount).toBe(50_000);
      expect(r.capped).toBe(false);
    });

    it("écrête au-delà", () => {
      // 3 % de 3 000 000 = 90 000 → ramené à 50 000.
      const r = artisanCommission(3_000_000);
      expect(r.amount).toBe(50_000);
      expect(r.capped).toBe(true);
      expect(r.net).toBe(2_950_000);
    });
  });

  describe("blocage automatique (§10)", () => {
    it("laisse passer un artisan à jour", () => {
      expect(assessBlocking({ unpaidCount: 2, debt: 15_000 }).blocked).toBe(false);
    });

    it("bloque à la troisième commission impayée", () => {
      const d = assessBlocking({ unpaidCount: 3, debt: 0 });
      expect(d.blocked).toBe(true);
      expect(d.reason).toMatch(/impayées/);
    });

    it("bloque au-delà de 20 000 FCFA de dette, même avec peu d'impayés", () => {
      const d = assessBlocking({ unpaidCount: 1, debt: 20_001 });
      expect(d.blocked).toBe(true);
      expect(d.reason).toMatch(/Dette/);
    });

    it("ne bloque pas exactement à 20 000 FCFA — le seuil est un dépassement", () => {
      expect(assessBlocking({ unpaidCount: 1, debt: 20_000 }).blocked).toBe(false);
    });

    it("suit des seuils reconfigurés", () => {
      const policy = { ...DEFAULT_ARTISAN_COMMISSION, maxUnpaidCount: 2, maxDebt: 5_000 };
      expect(assessBlocking({ unpaidCount: 2, debt: 0 }, policy).blocked).toBe(true);
    });
  });

  describe("exigibilité des commissions en espèces (§5)", () => {
    it("court 30 minutes après la clôture effective", () => {
      const closure = new Date("2026-08-03T09:00:00Z");
      expect(cashCommissionDueAt(closure).toISOString()).toBe("2026-08-03T09:30:00.000Z");
    });
  });

  describe("cloisonnement avec le barème des livraisons", () => {
    it("ne borne pas la commission entre 100 et 300 FCFA", () => {
      // Le plancher/plafond du CDC v0.75 §6 ne concerne QUE la livraison :
      // une prestation artisan de 10 000 FCFA doit bien rendre 1 000, pas 300.
      expect(artisanCommission(10_000).amount).toBe(1_000);
      // Et une petite prestation n'est pas remontée à 100 FCFA.
      expect(artisanCommission(500).amount).toBe(50);
    });
  });
});
