/**
 * Temps d'attente — cahier des charges v0.75, §3.
 *
 * Trois règles, et une seule d'entre elles a une conséquence financière :
 *
 *  1. Le compteur ne démarre QUE lorsque le livreur appuie sur « Je suis
 *     arrivé ». Ni l'acceptation, ni l'arrivée chez le commerçant ne le
 *     déclenchent : sans cet appui, il n'y a pas d'attente facturable.
 *  2. L'attente chez le commerçant est mesurée mais jamais facturée — elle ne
 *     sert qu'aux statistiques.
 *  3. Passé le délai d'absence du client, la course peut être annulée et le
 *     livreur reçoit une compensation.
 *
 * Toutes les valeurs sont dans `DEFAULT_WAITING_POLICY`, administrable depuis le
 * Back Office (§1).
 */

export interface WaitingPolicy {
  /** Minutes d'attente au point de livraison avant que l'annulation soit permise. */
  customerAbsenceMinutes: number;
  /** Somme versée au livreur lorsqu'il annule pour absence du client, en FCFA. */
  absenceCompensation: number;
}

/** Valeurs validées par le fondateur (v0.75 §3). */
export const DEFAULT_WAITING_POLICY: WaitingPolicy = {
  customerAbsenceMinutes: 20,
  absenceCompensation: 500,
};

/** Où le livreur attend. Seul `CUSTOMER` ouvre des droits. */
export type WaitingLocation = "MERCHANT" | "CUSTOMER";

export interface WaitingState {
  location: WaitingLocation;
  /** Instant de l'appui sur « Je suis arrivé ». `null` tant qu'il n'a pas eu lieu. */
  arrivedAt: Date | null;
}

export interface WaitingAssessment {
  /** Minutes écoulées depuis l'appui sur « Je suis arrivé ». 0 s'il n'a pas eu lieu. */
  waitedMinutes: number;
  /** Vrai si le livreur peut annuler pour absence du client. */
  mayCancelForAbsence: boolean;
  /** Compensation due au livreur s'il annule maintenant, en FCFA. */
  compensation: number;
  /** Vrai lorsque l'attente n'est comptée que pour les statistiques (§3). */
  statisticsOnly: boolean;
}

/**
 * Évalue une attente à un instant donné.
 *
 * @param now instant d'évaluation — injecté plutôt que lu de l'horloge, pour que
 *            la règle soit testable et rejouable sur un incident passé.
 */
export function assessWaiting(
  state: WaitingState,
  now: Date,
  policy: WaitingPolicy = DEFAULT_WAITING_POLICY,
): WaitingAssessment {
  const statisticsOnly = state.location === "MERCHANT";

  // Pas d'appui sur « Je suis arrivé » = pas de compteur. C'est la règle qui
  // empêche un livreur de facturer une attente commencée avant d'être sur place.
  if (!state.arrivedAt) {
    return { waitedMinutes: 0, mayCancelForAbsence: false, compensation: 0, statisticsOnly };
  }

  const elapsedMs = Math.max(0, now.getTime() - state.arrivedAt.getTime());
  const waitedMinutes = elapsedMs / 60_000;

  // Chez le commerçant, on mesure sans jamais ouvrir de droit à compensation.
  if (statisticsOnly) {
    return { waitedMinutes, mayCancelForAbsence: false, compensation: 0, statisticsOnly };
  }

  const mayCancelForAbsence = waitedMinutes >= policy.customerAbsenceMinutes;
  return {
    waitedMinutes,
    mayCancelForAbsence,
    compensation: mayCancelForAbsence ? policy.absenceCompensation : 0,
    statisticsOnly,
  };
}
