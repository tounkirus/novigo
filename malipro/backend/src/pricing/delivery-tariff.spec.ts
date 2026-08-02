import {
  DEFAULT_DELIVERY_TARIFF,
  DeliveryRefusedError,
  quoteDelivery,
} from "./delivery-tariff";

/**
 * Chaque seuil du §2 est verrouillé par un test : ce sont des règles métier
 * validées, pas des choix d'implémentation. Si l'un d'eux change un jour, il
 * faudra le décider explicitement, pas le découvrir en production.
 */
describe("Barème de livraison (cahier des charges §2)", () => {
  describe("tarif minimum", () => {
    it.each([0, 1, 2.5, 3])("facture 500 FCFA à %s km", (km) => {
      expect(quoteDelivery({ distanceKm: km }).total).toBe(500);
    });

    it("ne descend jamais sous le plancher, même pour une distance aberrante", () => {
      expect(quoteDelivery({ distanceKm: -10 }).total).toBe(500);
    });
  });

  describe("tarification progressive", () => {
    it("facture 190 FCFA par km entre 3 et 5 km", () => {
      // 500 + 2 km × 190 = 880
      expect(quoteDelivery({ distanceKm: 5 }).total).toBe(880);
    });

    it("n'applique 180 FCFA qu'aux kilomètres au-delà de 5 km", () => {
      // 500 + (2 × 190) + (5 × 180) = 1 780 — et non 10 km × 180.
      expect(quoteDelivery({ distanceKm: 10 }).total).toBe(1780);
    });

    it("cumule les trois tranches au-delà de 15 km", () => {
      // 500 + (2 × 190) + (10 × 180) + (5 × 170) = 3 530
      expect(quoteDelivery({ distanceKm: 20 }).total).toBe(3530);
    });

    it("détaille chaque tranche dans le récapitulatif", () => {
      const { breakdown } = quoteDelivery({ distanceKm: 20 });
      expect(breakdown.map((l) => l.label)).toEqual([
        "Prise en charge (jusqu'à 3 km)",
        "2 km à 190 FCFA",
        "10 km à 180 FCFA",
        "5 km à 170 FCFA",
      ]);
    });

    it("le total est toujours la somme du détail", () => {
      for (const distanceKm of [0, 3, 4.2, 5, 9.9, 15, 42]) {
        const { total, breakdown } = quoteDelivery({ distanceKm });
        expect(breakdown.reduce((s, l) => s + l.amount, 0)).toBe(total);
      }
    });
  });

  describe("supplément de poids", () => {
    it("n'applique aucun supplément sous 25 kg", () => {
      expect(quoteDelivery({ distanceKm: 3, weightKg: 24.9 }).total).toBe(500);
    });

    it("applique 500 FCFA de 25 à 50 kg", () => {
      expect(quoteDelivery({ distanceKm: 3, weightKg: 25 }).total).toBe(1000);
      expect(quoteDelivery({ distanceKm: 3, weightKg: 50 }).total).toBe(1000);
    });

    it("applique 1 000 FCFA au-delà de 50 kg et jusqu'à 70 kg", () => {
      expect(quoteDelivery({ distanceKm: 3, weightKg: 50.1 }).total).toBe(1500);
      expect(quoteDelivery({ distanceKm: 3, weightKg: 70 }).total).toBe(1500);
    });

    it("n'applique qu'un seul palier à la fois", () => {
      const { breakdown } = quoteDelivery({ distanceKm: 3, weightKg: 60 });
      expect(breakdown.filter((l) => l.label.startsWith("Supplément poids"))).toHaveLength(1);
    });

    it("refuse la course au-delà de 70 kg", () => {
      expect(() => quoteDelivery({ distanceKm: 3, weightKg: 70.5 })).toThrow(DeliveryRefusedError);
      try {
        quoteDelivery({ distanceKm: 3, weightKg: 90 });
      } catch (e) {
        expect((e as DeliveryRefusedError).reason).toBe("WEIGHT_EXCEEDED");
      }
    });
  });

  describe("colis volumineux", () => {
    it("ajoute 500 FCFA", () => {
      expect(quoteDelivery({ distanceKm: 3, bulky: true }).total).toBe(1000);
    });

    it("se cumule avec le supplément de poids", () => {
      // 500 plancher + 500 poids + 500 volume
      expect(quoteDelivery({ distanceKm: 3, weightKg: 30, bulky: true }).total).toBe(1500);
    });
  });

  describe("configurabilité (§1 : toute valeur métier est administrable)", () => {
    it("suit un barème remplacé sans modification du moteur", () => {
      const tariff = {
        ...DEFAULT_DELIVERY_TARIFF,
        minimumFare: 700,
        includedKm: 2,
        brackets: [{ fromKm: 2, perKm: 250 }],
      };
      // 700 + 3 km × 250 = 1 450
      expect(quoteDelivery({ distanceKm: 5 }, tariff).total).toBe(1450);
    });

    it("suit une limite de poids abaissée", () => {
      const tariff = { ...DEFAULT_DELIVERY_TARIFF, maxWeightKg: 40 };
      expect(() => quoteDelivery({ distanceKm: 3, weightKg: 45 }, tariff)).toThrow(
        DeliveryRefusedError,
      );
    });
  });
});
