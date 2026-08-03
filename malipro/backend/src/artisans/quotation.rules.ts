/**
 * Règles du devis — Module Artisans, chapitre 4.
 *
 * Logique pure : totaux, expiration, verrouillage, acompte. Aucune dépendance
 * à la base ni au framework, pour que chaque règle soit vérifiable seule et
 * rejouable sur un devis passé.
 */

export type SuppliedBy = "ARTISAN" | "CLIENT";
export type QuotationLineKind = "LABOUR" | "MATERIAL";
export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REFUSED" | "EXPIRED";

export interface QuotationLineInput {
  kind: QuotationLineKind;
  label: string;
  quantity?: number;
  unitPrice: number;
  /** Par défaut, le matériau est fourni par l'artisan. */
  suppliedBy?: SuppliedBy;
}

export interface QuotationPolicy {
  /** Durée de validité, en jours (§7). */
  validityDays: number;
}

export const DEFAULT_QUOTATION_POLICY: QuotationPolicy = { validityDays: 15 };

export interface QuotationTotals {
  labourAmount: number;
  materialsAmount: number;
  amount: number;
  /** Lignes calculées, dans l'ordre reçu. */
  lines: (QuotationLineInput & { quantity: number; total: number; position: number })[];
}

/**
 * Calcule les totaux d'un devis.
 *
 * Un matériau fourni par le client figure au devis — le client doit voir ce qui
 * sera posé chez lui — mais son montant est nul : il l'a déjà payé de son côté
 * (§5). Le facturer reviendrait à le lui faire payer deux fois.
 */
export function computeTotals(lines: QuotationLineInput[]): QuotationTotals {
  let labourAmount = 0;
  let materialsAmount = 0;

  const computed = lines.map((line, position) => {
    const quantity = line.quantity ?? 1;
    const billable = line.kind === "MATERIAL" && line.suppliedBy === "CLIENT" ? 0 : 1;
    const total = Math.round(quantity * Math.max(0, line.unitPrice) * billable);

    if (line.kind === "LABOUR") labourAmount += total;
    else materialsAmount += total;

    return { ...line, quantity, total, position };
  });

  return {
    labourAmount,
    materialsAmount,
    amount: labourAmount + materialsAmount,
    lines: computed,
  };
}

/** Date d'expiration d'un devis créé à `createdAt` (§7). */
export function expiryOf(
  createdAt: Date,
  policy: QuotationPolicy = DEFAULT_QUOTATION_POLICY,
): Date {
  return new Date(createdAt.getTime() + policy.validityDays * 24 * 60 * 60_000);
}

/** Vrai si le devis a dépassé sa date de validité. */
export function isExpired(quotation: { expiresAt: Date; status: QuotationStatus }, now: Date): boolean {
  // Un devis déjà tranché ne « expire » pas : son sort est scellé.
  if (quotation.status === "ACCEPTED" || quotation.status === "REFUSED") return false;
  return now.getTime() >= quotation.expiresAt.getTime();
}

export interface QuotationState {
  status: QuotationStatus;
  expiresAt: Date;
  lockedAt: Date | null;
}

/** Motif du refus d'une action, ou `null` si l'action est permise. */
export type Refusal = string | null;

/**
 * Un devis est modifiable tant qu'il n'a pas été accepté (§6).
 *
 * Le verrouillage est vérifié en plus du statut : c'est lui qui fait foi si un
 * statut a été mal remis à jour, car il porte un horodatage.
 */
export function refusalToRevise(state: QuotationState, now: Date): Refusal {
  if (state.lockedAt) return "Ce devis est accepté et verrouillé : créez-en un nouveau.";
  if (state.status === "ACCEPTED") return "Ce devis a été accepté et ne peut plus être modifié.";
  if (state.status === "REFUSED") return "Ce devis a été refusé : créez-en un nouveau.";
  if (isExpired(state, now)) return "Ce devis a expiré : créez-en un nouveau.";
  return null;
}

/** Un devis expiré ne peut plus être accepté (§7). */
export function refusalToAccept(state: QuotationState, now: Date): Refusal {
  if (state.status === "ACCEPTED") return "Ce devis est déjà accepté.";
  if (state.status === "REFUSED") return "Ce devis a été refusé.";
  if (isExpired(state, now)) return "Ce devis a expiré et ne peut plus être accepté.";
  if (state.status === "DRAFT") return "Ce devis n'a pas encore été envoyé au client.";
  return null;
}

export interface DepositInput {
  /** Montant fixe demandé, en FCFA. */
  depositAmount?: number | null;
  /** Pourcentage du total demandé. */
  depositPercent?: number | null;
}

/**
 * Acompte réellement dû (§9).
 *
 * Le cahier des charges autorise « un montant fixe OU un pourcentage » : les
 * deux à la fois n'ont pas de sens et sont rejetés, plutôt que d'en choisir un
 * en silence.
 */
export function computeDeposit(total: number, input: DepositInput): number {
  const { depositAmount, depositPercent } = input;
  const hasAmount = depositAmount != null && depositAmount > 0;
  const hasPercent = depositPercent != null && depositPercent > 0;

  if (hasAmount && hasPercent) {
    throw new Error("Acompte : indiquez un montant fixe OU un pourcentage, pas les deux.");
  }
  if (hasAmount) return Math.min(Math.round(depositAmount!), total);
  if (hasPercent) return Math.min(Math.round((total * depositPercent!) / 100), total);
  return 0;
}

/**
 * Le chantier peut-il démarrer ? (§10 et ch.5 §2)
 *
 * Il faut un devis accepté et, si un acompte a été demandé, son règlement.
 */
export function readyToStart(params: {
  status: QuotationStatus;
  depositDue: number;
  depositPaid: number;
}): { ready: boolean; reason: string | null } {
  if (params.status !== "ACCEPTED") {
    return { ready: false, reason: "Le devis n'est pas accepté." };
  }
  if (params.depositDue > 0 && params.depositPaid < params.depositDue) {
    return { ready: false, reason: "L'acompte n'a pas encore été réglé." };
  }
  return { ready: true, reason: null };
}
