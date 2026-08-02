import {
  DEFAULT_CANCELLATION_POLICY,
  assessCancellation,
  type CancellationContext,
  type CourseStage,
} from "./cancellation-policy";
import { DEFAULT_WAITING_POLICY, assessWaiting } from "./waiting-policy";

const T0 = new Date("2026-08-02T10:00:00Z");
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

describe("Temps d'attente (cahier des charges §3)", () => {
  it("ne compte rien tant que « Je suis arrivé » n'a pas été pressé", () => {
    const a = assessWaiting({ location: "CUSTOMER", arrivedAt: null }, at(60));
    expect(a.waitedMinutes).toBe(0);
    expect(a.mayCancelForAbsence).toBe(false);
    expect(a.compensation).toBe(0);
  });

  it("compte à partir de l'appui, pas de l'acceptation", () => {
    const a = assessWaiting({ location: "CUSTOMER", arrivedAt: at(10) }, at(25));
    expect(a.waitedMinutes).toBe(15);
  });

  it("n'ouvre aucun droit avant 20 minutes", () => {
    const a = assessWaiting({ location: "CUSTOMER", arrivedAt: T0 }, at(19.9));
    expect(a.mayCancelForAbsence).toBe(false);
    expect(a.compensation).toBe(0);
  });

  it("autorise l'annulation et verse 500 FCFA au livreur à 20 minutes", () => {
    const a = assessWaiting({ location: "CUSTOMER", arrivedAt: T0 }, at(20));
    expect(a.mayCancelForAbsence).toBe(true);
    expect(a.compensation).toBe(500);
  });

  it("chez le commerçant, mesure l'attente sans jamais la facturer", () => {
    const a = assessWaiting({ location: "MERCHANT", arrivedAt: T0 }, at(45));
    expect(a.waitedMinutes).toBe(45);
    expect(a.statisticsOnly).toBe(true);
    expect(a.mayCancelForAbsence).toBe(false);
    expect(a.compensation).toBe(0);
  });

  it("suit un délai d'absence reconfiguré", () => {
    const policy = { ...DEFAULT_WAITING_POLICY, customerAbsenceMinutes: 10 };
    expect(assessWaiting({ location: "CUSTOMER", arrivedAt: T0 }, at(10), policy).mayCancelForAbsence)
      .toBe(true);
  });
});

describe("Annulations (cahier des charges §4)", () => {
  const ctx = (over: Partial<CancellationContext> = {}): CancellationContext => ({
    stage: "ACCEPTED",
    acceptedAt: T0,
    cancelledAt: at(1),
    orderTotal: 4500,
    // Quota épuisé par défaut : chaque test mesure le tarif nu, sauf ceux qui
    // portent explicitement sur les gratuités.
    billedCancellationsThisMonth: DEFAULT_CANCELLATION_POLICY.freeCancellationsPerMonth,
    ...over,
  });

  describe("barème par étape", () => {
    it("est gratuite avant acceptation", () => {
      expect(assessCancellation(ctx({ stage: "PENDING" })).fee).toBe(0);
    });

    it("est gratuite dans les 3 premières minutes", () => {
      expect(assessCancellation(ctx({ cancelledAt: at(2.9) })).fee).toBe(0);
    });

    it("coûte 300 FCFA au-delà de 3 minutes", () => {
      expect(assessCancellation(ctx({ cancelledAt: at(3) })).fee).toBe(300);
      expect(assessCancellation(ctx({ cancelledAt: at(12) })).fee).toBe(300);
    });

    it("coûte 500 FCFA une fois le livreur arrivé", () => {
      expect(assessCancellation(ctx({ stage: "ARRIVED" })).fee).toBe(500);
    });

    it("coûte le montant total pendant la livraison", () => {
      expect(assessCancellation(ctx({ stage: "IN_DELIVERY", orderTotal: 4500 })).fee).toBe(4500);
    });

    it("fait primer l'étape atteinte sur le temps écoulé", () => {
      // Livreur arrivé en 90 secondes : c'est bien 500, pas la gratuité des 3 min.
      const a = assessCancellation(ctx({ stage: "ARRIVED", cancelledAt: at(1.5) }));
      expect(a.fee).toBe(500);
    });

    it("ne facture rien si l'acceptation n'est pas horodatée", () => {
      expect(assessCancellation(ctx({ acceptedAt: null })).fee).toBe(0);
    });
  });

  describe("quota de 5 gratuités par mois", () => {
    it("efface les frais tant que le quota n'est pas épuisé", () => {
      const a = assessCancellation(ctx({ cancelledAt: at(10), billedCancellationsThisMonth: 0 }));
      expect(a.fee).toBe(0);
      expect(a.feeBeforeAllowance).toBe(300);
      expect(a.waivedByAllowance).toBe(true);
      expect(a.remainingFreeCancellations).toBe(4);
    });

    it("facture à partir de la sixième annulation payante du mois", () => {
      const a = assessCancellation(ctx({ cancelledAt: at(10), billedCancellationsThisMonth: 5 }));
      expect(a.fee).toBe(300);
      expect(a.waivedByAllowance).toBe(false);
      expect(a.remainingFreeCancellations).toBe(0);
    });

    it("couvre aussi une annulation pendant la livraison", () => {
      const a = assessCancellation(
        ctx({ stage: "IN_DELIVERY", orderTotal: 4500, billedCancellationsThisMonth: 0 }),
      );
      expect(a.fee).toBe(0);
      expect(a.feeBeforeAllowance).toBe(4500);
    });

    it("ne consomme pas une gratuité pour une annulation déjà gratuite", () => {
      const a = assessCancellation(ctx({ stage: "PENDING", billedCancellationsThisMonth: 0 }));
      expect(a.waivedByAllowance).toBe(false);
      expect(a.remainingFreeCancellations).toBe(5);
    });
  });

  describe("configurabilité (§1)", () => {
    it("suit un barème reconfiguré", () => {
      const policy = {
        ...DEFAULT_CANCELLATION_POLICY,
        graceMinutes: 5,
        afterGraceFee: 450,
        freeCancellationsPerMonth: 0,
      };
      expect(assessCancellation(ctx({ cancelledAt: at(4) }), policy).fee).toBe(0);
      expect(assessCancellation(ctx({ cancelledAt: at(6) }), policy).fee).toBe(450);
    });
  });

  it("couvre toutes les étapes déclarées", () => {
    const stages: CourseStage[] = ["PENDING", "ACCEPTED", "ARRIVED", "IN_DELIVERY"];
    for (const stage of stages) {
      expect(() => assessCancellation(ctx({ stage }))).not.toThrow();
    }
  });
});
