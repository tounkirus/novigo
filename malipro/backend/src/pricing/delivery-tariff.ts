/**
 * Barème de livraison NOVIGO — cahier des charges v0.75, §2.
 *
 * Ce module ne tarife QUE la course : la distance parcourue, le poids et
 * l'encombrement du colis. Le prix des marchandises ne passe jamais par ici.
 *
 * Toutes les valeurs sont regroupées dans `DEFAULT_DELIVERY_TARIFF` et
 * remplaçables à chaud : le Back Office administre cet objet, le moteur ne
 * connaît aucune constante. Ajouter une tranche kilométrique ou déplacer un
 * seuil de poids se fait donc sans toucher au code.
 */

/** Une tranche kilométrique : « au-delà de `fromKm`, le kilomètre coûte `perKm` ». */
export interface DistanceBracket {
  /** Borne basse INCLUSE de la tranche, en kilomètres. */
  fromKm: number;
  /** Prix du kilomètre dans cette tranche, en FCFA. */
  perKm: number;
}

/** Un palier de supplément lié au poids du colis. */
export interface WeightSurcharge {
  /** Borne basse INCLUSE, en kilogrammes. */
  fromKg: number;
  /** Borne haute INCLUSE, en kilogrammes. */
  toKg: number;
  /** Supplément appliqué, en FCFA. */
  amount: number;
}

export interface DeliveryTariff {
  /** Prix plancher, couvrant la première tranche. */
  minimumFare: number;
  /** Distance couverte par le prix plancher, en kilomètres. */
  includedKm: number;
  /** Tranches au-delà de `includedKm`, triées par `fromKm` croissant. */
  brackets: DistanceBracket[];
  /** Paliers de supplément de poids. */
  weightSurcharges: WeightSurcharge[];
  /** Au-delà de ce poids, la course est refusée. */
  maxWeightKg: number;
  /** Supplément pour un colis volumineux resté dans la limite autorisée. */
  bulkySurcharge: number;
}

/**
 * Valeurs validées par le fondateur (v0.75 §2).
 *
 * Lecture du barème : 500 FCFA couvrent les trois premiers kilomètres ; au-delà,
 * seuls les kilomètres excédentaires sont facturés, au prix de leur tranche.
 */
export const DEFAULT_DELIVERY_TARIFF: DeliveryTariff = {
  minimumFare: 500,
  includedKm: 3,
  brackets: [
    { fromKm: 3, perKm: 190 }, // 3 → 5 km
    { fromKm: 5, perKm: 180 }, // 5 → 15 km
    { fromKm: 15, perKm: 170 }, // au-delà de 15 km
  ],
  weightSurcharges: [
    { fromKg: 25, toKg: 50, amount: 500 },
    { fromKg: 50, toKg: 70, amount: 1000 },
  ],
  maxWeightKg: 70,
  bulkySurcharge: 500,
};

/** Ce que l'appelant sait de la course à tarifer. */
export interface DeliveryQuoteInput {
  distanceKm: number;
  /** Poids total du colis, en kilogrammes. Absent = non pesé, aucun supplément. */
  weightKg?: number;
  /** Colis encombrant restant dans la limite autorisée. */
  bulky?: boolean;
}

/** Une ligne du détail présenté au client. */
export interface QuoteLine {
  label: string;
  amount: number;
}

export interface DeliveryQuote {
  /** Montant total de la course, en FCFA. */
  total: number;
  /** Détail ligne à ligne — c'est ce qui rend le prix explicable. */
  breakdown: QuoteLine[];
}

/** Levée lorsque la course ne peut pas être acceptée en l'état. */
export class DeliveryRefusedError extends Error {
  constructor(
    readonly reason: "WEIGHT_EXCEEDED",
    message: string,
  ) {
    super(message);
    this.name = "DeliveryRefusedError";
  }
}

/**
 * Calcule le prix d'une course.
 *
 * @throws DeliveryRefusedError si le poids dépasse la limite (§2 : « >70 kg refusé »).
 */
export function quoteDelivery(
  input: DeliveryQuoteInput,
  tariff: DeliveryTariff = DEFAULT_DELIVERY_TARIFF,
): DeliveryQuote {
  const weight = input.weightKg ?? 0;
  if (weight > tariff.maxWeightKg) {
    throw new DeliveryRefusedError(
      "WEIGHT_EXCEEDED",
      `Colis de ${weight} kg refusé : la limite est de ${tariff.maxWeightKg} kg.`,
    );
  }

  // Une distance négative n'a pas de sens ; on la traite comme nulle plutôt que
  // de laisser un appelant fautif produire un prix inférieur au plancher.
  const distance = Math.max(0, input.distanceKm || 0);

  const breakdown: QuoteLine[] = [
    { label: `Prise en charge (jusqu'à ${tariff.includedKm} km)`, amount: tariff.minimumFare },
  ];
  let total = tariff.minimumFare;

  // Distance : seuls les kilomètres au-delà de la prise en charge sont facturés,
  // chacun au prix de SA tranche — et non au prix de la tranche finale.
  const sorted = [...tariff.brackets].sort((a, b) => a.fromKm - b.fromKm);
  for (let i = 0; i < sorted.length; i++) {
    const bracket = sorted[i];
    const from = Math.max(bracket.fromKm, tariff.includedKm);
    const to = i + 1 < sorted.length ? sorted[i + 1].fromKm : Number.POSITIVE_INFINITY;
    const km = Math.min(distance, to) - from;
    if (km <= 0) continue;
    const amount = Math.round(km * bracket.perKm);
    breakdown.push({
      label: `${trim(km)} km à ${bracket.perKm} FCFA`,
      amount,
    });
    total += amount;
  }

  // Poids : un seul palier s'applique, celui qui contient le poids réel.
  const surcharge = tariff.weightSurcharges.find((w) => weight >= w.fromKg && weight <= w.toKg);
  if (surcharge) {
    breakdown.push({ label: `Supplément poids (${trim(weight)} kg)`, amount: surcharge.amount });
    total += surcharge.amount;
  }

  if (input.bulky) {
    breakdown.push({ label: "Supplément colis volumineux", amount: tariff.bulkySurcharge });
    total += tariff.bulkySurcharge;
  }

  return { total, breakdown };
}

/** Affiche 4 plutôt que 4.0, et 4.5 plutôt que 4.50. */
function trim(value: number): string {
  return Number(value.toFixed(1)).toString();
}
