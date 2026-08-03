/**
 * Cycle de vie d'un chantier — Module Artisans, chapitre 5.
 *
 * Logique pure : transitions autorisées, réception automatique, garantie.
 * Le §11 exige que le backend « empêche tout changement d'état non autorisé » ;
 * c'est ici qu'est écrite cette interdiction, en un seul endroit, plutôt que
 * dispersée dans les contrôleurs.
 */

export type WorksiteStatus =
  | "AWAITING_DEPOSIT"
  | "READY"
  | "IN_PROGRESS"
  | "WORK_DONE"
  | "CLOSED"
  | "DISPUTED";

export type WorksiteAction =
  | "PAY_DEPOSIT"
  | "START"
  | "FINISH"
  | "ACCEPT"
  | "AUTO_ACCEPT"
  | "OPEN_DISPUTE"
  | "RESOLVE_DISPUTE";

export interface WorksitePolicy {
  /** Délai de réception avant acceptation automatique, en minutes (§6). */
  autoAcceptMinutes: number;
}

/** Valeur validée : une heure (ch.5 §6). */
export const DEFAULT_WORKSITE_POLICY: WorksitePolicy = { autoAcceptMinutes: 60 };

/**
 * Transitions autorisées, par état de départ.
 *
 * Tout ce qui n'est pas listé est interdit. Un chantier clôturé est terminal :
 * il n'en sort plus, pas même par un litige — au-delà, c'est un litige
 * après-vente, un dossier distinct.
 */
const TRANSITIONS: Record<WorksiteStatus, Partial<Record<WorksiteAction, WorksiteStatus>>> = {
  AWAITING_DEPOSIT: { PAY_DEPOSIT: "READY" },
  READY: { START: "IN_PROGRESS" },
  IN_PROGRESS: { FINISH: "WORK_DONE" },
  WORK_DONE: {
    ACCEPT: "CLOSED",
    AUTO_ACCEPT: "CLOSED",
    OPEN_DISPUTE: "DISPUTED",
  },
  DISPUTED: { RESOLVE_DISPUTE: "CLOSED" },
  CLOSED: {},
};

export interface TransitionResult {
  /** État atteint, ou `null` si l'action est refusée. */
  next: WorksiteStatus | null;
  /** Motif du refus, destiné à l'utilisateur et au journal. */
  reason: string | null;
}

const LABELS: Record<WorksiteStatus, string> = {
  AWAITING_DEPOSIT: "en attente d'acompte",
  READY: "prêt à démarrer",
  IN_PROGRESS: "en cours",
  WORK_DONE: "travaux terminés",
  CLOSED: "clôturé",
  DISPUTED: "en litige",
};

/** Applique une action à un chantier, ou explique pourquoi elle est refusée. */
export function transition(from: WorksiteStatus, action: WorksiteAction): TransitionResult {
  const next = TRANSITIONS[from][action];
  if (!next) {
    return {
      next: null,
      reason: `Action impossible sur un chantier ${LABELS[from]}.`,
    };
  }
  return { next, reason: null };
}

/**
 * État initial d'un chantier créé à l'acceptation d'un devis (§2).
 *
 * Avec acompte exigé, le chantier attend son règlement ; sans acompte, il est
 * immédiatement prêt.
 */
export function initialStatus(depositDue: number, depositPaid = 0): WorksiteStatus {
  return depositDue > 0 && depositPaid < depositDue ? "AWAITING_DEPOSIT" : "READY";
}

/** Échéance de réception automatique, posée à la fin des travaux (§6). */
export function autoAcceptDeadline(
  finishedAt: Date,
  policy: WorksitePolicy = DEFAULT_WORKSITE_POLICY,
): Date {
  return new Date(finishedAt.getTime() + policy.autoAcceptMinutes * 60_000);
}

export interface ReceptionState {
  status: WorksiteStatus;
  autoAcceptAt: Date | null;
}

/**
 * La réception automatique doit-elle s'appliquer maintenant ? (§6)
 *
 * Seul un chantier en attente de réception est concerné : un litige ouvert
 * avant l'échéance suspend l'acceptation automatique, sans quoi le silence de
 * l'administration vaudrait accord contre le client.
 */
export function shouldAutoAccept(state: ReceptionState, now: Date): boolean {
  if (state.status !== "WORK_DONE" || !state.autoAcceptAt) return false;
  return now.getTime() >= state.autoAcceptAt.getTime();
}

/** Minutes restantes au client pour réceptionner, 0 si le délai est écoulé. */
export function minutesLeftToAccept(state: ReceptionState, now: Date): number {
  if (state.status !== "WORK_DONE" || !state.autoAcceptAt) return 0;
  return Math.max(0, (state.autoAcceptAt.getTime() - now.getTime()) / 60_000);
}

export interface Warranty {
  months: number | null;
  terms: string | null;
}

/**
 * Garantie reprise sur la facture (§8).
 *
 * Elle vient du devis accepté : la facture ne peut pas annoncer une garantie
 * différente de celle qui a été contractée.
 */
export function warrantyFromQuotation(q: {
  warrantyMonths?: number | null;
  warrantyTerms?: string | null;
}): Warranty {
  return { months: q.warrantyMonths ?? null, terms: q.warrantyTerms ?? null };
}
