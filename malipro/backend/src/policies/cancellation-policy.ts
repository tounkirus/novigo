/**
 * Annulations — cahier des charges v0.75, §4.
 *
 * Le montant dû dépend de l'ÉTAPE atteinte par la course, et non du seul temps
 * écoulé :
 *
 *   avant acceptation ................................. gratuit
 *   acceptée, dans les 3 premières minutes ............ gratuit
 *   acceptée, au-delà de 3 minutes .................... 300 FCFA
 *   livreur arrivé .................................... 500 FCFA
 *   colis récupéré, livraison en cours ................ montant total
 *
 * S'y ajoute un quota de 5 annulations gratuites par mois : tant qu'il n'est pas
 * épuisé, des frais qui seraient dus sont effacés.
 *
 * Valeurs administrables depuis le Back Office (§1).
 */

export interface CancellationPolicy {
  /** Minutes de grâce après acceptation pendant lesquelles annuler reste gratuit. */
  graceMinutes: number;
  /** Frais après la grâce, tant que le livreur n'est pas arrivé, en FCFA. */
  afterGraceFee: number;
  /** Frais une fois le livreur arrivé, en FCFA. */
  afterArrivalFee: number;
  /** Nombre d'annulations sans frais offertes par mois calendaire. */
  freeCancellationsPerMonth: number;
}

/** Valeurs validées par le fondateur (v0.75 §4). */
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  graceMinutes: 3,
  afterGraceFee: 300,
  afterArrivalFee: 500,
  freeCancellationsPerMonth: 5,
};

/**
 * Étape de la course au moment de l'annulation.
 *
 * L'ordre de cette énumération est celui du déroulement réel : il porte la règle
 * « l'étape la plus avancée l'emporte ».
 */
export type CourseStage =
  /** Course publiée, aucun livreur ne l'a prise. */
  | "PENDING"
  /** Un livreur a accepté et se met en route. */
  | "ACCEPTED"
  /** Le livreur a appuyé sur « Je suis arrivé ». */
  | "ARRIVED"
  /** Le colis est récupéré, la livraison est en cours. */
  | "IN_DELIVERY";

export interface CancellationContext {
  stage: CourseStage;
  /** Instant de l'acceptation. `null` tant que la course n'est pas prise. */
  acceptedAt: Date | null;
  /** Instant de l'annulation. */
  cancelledAt: Date;
  /** Montant total de la course, en FCFA — dû si l'annulation survient en cours de livraison. */
  orderTotal: number;
  /** Annulations déjà facturées au client depuis le début du mois. */
  billedCancellationsThisMonth: number;
}

export interface CancellationOutcome {
  /** Montant réellement facturé, en FCFA. */
  fee: number;
  /** Montant qui aurait été dû sans le quota mensuel. */
  feeBeforeAllowance: number;
  /** Vrai si le quota d'annulations gratuites a absorbé les frais. */
  waivedByAllowance: boolean;
  /** Annulations gratuites restantes après celle-ci. */
  remainingFreeCancellations: number;
  /** Raison lisible, destinée à l'utilisateur et au journal. */
  reason: string;
}

/**
 * Calcule ce que coûte une annulation.
 *
 * Le quota mensuel ne s'applique qu'aux annulations qui auraient été facturées :
 * annuler gratuitement avant acceptation ne consomme pas une des cinq gratuités,
 * sans quoi le quota s'épuiserait sans que le client en tire le moindre bénéfice.
 */
export function assessCancellation(
  ctx: CancellationContext,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY,
): CancellationOutcome {
  const { fee: feeBeforeAllowance, reason } = rawFee(ctx, policy);

  const used = Math.max(0, ctx.billedCancellationsThisMonth);
  const allowanceLeft = Math.max(0, policy.freeCancellationsPerMonth - used);

  if (feeBeforeAllowance === 0) {
    return {
      fee: 0,
      feeBeforeAllowance,
      waivedByAllowance: false,
      remainingFreeCancellations: allowanceLeft,
      reason,
    };
  }

  if (allowanceLeft > 0) {
    return {
      fee: 0,
      feeBeforeAllowance,
      waivedByAllowance: true,
      remainingFreeCancellations: allowanceLeft - 1,
      reason: `${reason} — offerte (${allowanceLeft - 1} gratuité${
        allowanceLeft - 1 > 1 ? "s" : ""
      } restante${allowanceLeft - 1 > 1 ? "s" : ""} ce mois-ci)`,
    };
  }

  return {
    fee: feeBeforeAllowance,
    feeBeforeAllowance,
    waivedByAllowance: false,
    remainingFreeCancellations: 0,
    reason: `${reason} — quota mensuel de gratuités épuisé`,
  };
}

/** Frais dus avant application du quota mensuel. */
function rawFee(
  ctx: CancellationContext,
  policy: CancellationPolicy,
): { fee: number; reason: string } {
  switch (ctx.stage) {
    case "PENDING":
      return { fee: 0, reason: "Annulation avant qu'un livreur accepte" };

    case "IN_DELIVERY":
      return { fee: ctx.orderTotal, reason: "Annulation pendant la livraison" };

    case "ARRIVED":
      return { fee: policy.afterArrivalFee, reason: "Annulation après l'arrivée du livreur" };

    case "ACCEPTED": {
      // Sans horodatage d'acceptation, on ne peut pas prouver que la grâce est
      // dépassée : le doute profite au client.
      if (!ctx.acceptedAt) {
        return { fee: 0, reason: "Annulation dans le délai de grâce" };
      }
      const minutes = Math.max(0, ctx.cancelledAt.getTime() - ctx.acceptedAt.getTime()) / 60_000;
      return minutes < policy.graceMinutes
        ? { fee: 0, reason: `Annulation dans les ${policy.graceMinutes} premières minutes` }
        : {
            fee: policy.afterGraceFee,
            reason: `Annulation plus de ${policy.graceMinutes} minutes après acceptation`,
          };
    }
  }
}
