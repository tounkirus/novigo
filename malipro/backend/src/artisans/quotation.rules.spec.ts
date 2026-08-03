import {
  computeDeposit,
  computeTotals,
  expiryOf,
  isExpired,
  readyToStart,
  refusalToAccept,
  refusalToRevise,
  type QuotationState,
} from "./quotation.rules";

const T0 = new Date("2026-08-03T09:00:00Z");
const days = (n: number) => new Date(T0.getTime() + n * 24 * 60 * 60_000);

describe("Devis (Module Artisans, chapitre 4)", () => {
  describe("totaux", () => {
    it("additionne main-d'œuvre et matériaux", () => {
      const t = computeTotals([
        { kind: "LABOUR", label: "Pose", unitPrice: 15_000 },
        { kind: "MATERIAL", label: "Robinet", quantity: 2, unitPrice: 8_000 },
      ]);
      expect(t.labourAmount).toBe(15_000);
      expect(t.materialsAmount).toBe(16_000);
      expect(t.amount).toBe(31_000);
    });

    it("ne facture pas un matériau fourni par le client (§5)", () => {
      const t = computeTotals([
        { kind: "LABOUR", label: "Pose", unitPrice: 15_000 },
        { kind: "MATERIAL", label: "Carrelage", quantity: 20, unitPrice: 3_000, suppliedBy: "CLIENT" },
      ]);
      expect(t.materialsAmount).toBe(0);
      expect(t.amount).toBe(15_000);
    });

    it("garde la ligne du client au devis, à montant nul", () => {
      const t = computeTotals([
        { kind: "MATERIAL", label: "Carrelage", quantity: 20, unitPrice: 3_000, suppliedBy: "CLIENT" },
      ]);
      // Le client doit voir ce qui sera posé chez lui, sans le payer deux fois.
      expect(t.lines).toHaveLength(1);
      expect(t.lines[0].total).toBe(0);
      expect(t.lines[0].quantity).toBe(20);
    });

    it("suppose une quantité de 1 quand elle n'est pas précisée", () => {
      expect(computeTotals([{ kind: "LABOUR", label: "Diagnostic", unitPrice: 5_000 }]).amount)
        .toBe(5_000);
    });
  });

  describe("validité de 15 jours (§7)", () => {
    it("fixe l'expiration à 15 jours", () => {
      expect(expiryOf(T0).toISOString()).toBe(days(15).toISOString());
    });

    it("n'est pas expiré la veille", () => {
      const q = { expiresAt: days(15), status: "SENT" as const };
      expect(isExpired(q, days(14))).toBe(false);
    });

    it("est expiré à l'échéance", () => {
      const q = { expiresAt: days(15), status: "SENT" as const };
      expect(isExpired(q, days(15))).toBe(true);
    });

    it("un devis déjà accepté n'expire pas", () => {
      const q = { expiresAt: days(15), status: "ACCEPTED" as const };
      expect(isExpired(q, days(40))).toBe(false);
    });
  });

  describe("versionnement et verrouillage (§6)", () => {
    const state = (over: Partial<QuotationState> = {}): QuotationState => ({
      status: "SENT",
      expiresAt: days(15),
      lockedAt: null,
      ...over,
    });

    it("autorise la modification d'un devis envoyé", () => {
      expect(refusalToRevise(state(), days(1))).toBeNull();
    });

    it("refuse la modification d'un devis accepté", () => {
      expect(refusalToRevise(state({ status: "ACCEPTED" }), days(1))).toMatch(/accepté/);
    });

    it("refuse la modification d'un devis verrouillé même si le statut est incohérent", () => {
      // Le verrou porte un horodatage : il fait foi sur un statut mal remis à jour.
      expect(refusalToRevise(state({ lockedAt: T0 }), days(1))).toMatch(/verrouillé/);
    });

    it("refuse la modification d'un devis expiré", () => {
      expect(refusalToRevise(state(), days(20))).toMatch(/expiré/);
    });
  });

  describe("acceptation", () => {
    const state = (over: Partial<QuotationState> = {}): QuotationState => ({
      status: "SENT",
      expiresAt: days(15),
      lockedAt: null,
      ...over,
    });

    it("est possible sur un devis envoyé et valide", () => {
      expect(refusalToAccept(state(), days(2))).toBeNull();
    });

    it("est impossible après expiration (§7)", () => {
      expect(refusalToAccept(state(), days(16))).toMatch(/expiré/);
    });

    it("est impossible sur un brouillon jamais envoyé", () => {
      expect(refusalToAccept(state({ status: "DRAFT" }), days(1))).toMatch(/pas encore été envoyé/);
    });

    it("est impossible deux fois", () => {
      expect(refusalToAccept(state({ status: "ACCEPTED" }), days(1))).toMatch(/déjà accepté/);
    });
  });

  describe("acompte (§9)", () => {
    it("accepte un montant fixe", () => {
      expect(computeDeposit(100_000, { depositAmount: 30_000 })).toBe(30_000);
    });

    it("accepte un pourcentage", () => {
      expect(computeDeposit(100_000, { depositPercent: 30 })).toBe(30_000);
    });

    it("vaut zéro quand aucun acompte n'est demandé", () => {
      expect(computeDeposit(100_000, {})).toBe(0);
    });

    it("ne dépasse jamais le total", () => {
      expect(computeDeposit(50_000, { depositAmount: 90_000 })).toBe(50_000);
      expect(computeDeposit(50_000, { depositPercent: 150 })).toBe(50_000);
    });

    it("rejette montant et pourcentage à la fois", () => {
      // Le cahier des charges dit « OU » : choisir en silence serait arbitraire.
      expect(() => computeDeposit(100_000, { depositAmount: 10_000, depositPercent: 20 }))
        .toThrow(/OU/);
    });
  });

  describe("passage au chantier (§10)", () => {
    it("est bloqué tant que le devis n'est pas accepté", () => {
      expect(readyToStart({ status: "SENT", depositDue: 0, depositPaid: 0 }).ready).toBe(false);
    });

    it("est immédiat sans acompte", () => {
      expect(readyToStart({ status: "ACCEPTED", depositDue: 0, depositPaid: 0 }).ready).toBe(true);
    });

    it("attend le règlement de l'acompte", () => {
      const r = readyToStart({ status: "ACCEPTED", depositDue: 30_000, depositPaid: 10_000 });
      expect(r.ready).toBe(false);
      expect(r.reason).toMatch(/acompte/i);
    });

    it("démarre une fois l'acompte réglé", () => {
      expect(readyToStart({ status: "ACCEPTED", depositDue: 30_000, depositPaid: 30_000 }).ready)
        .toBe(true);
    });
  });
});
