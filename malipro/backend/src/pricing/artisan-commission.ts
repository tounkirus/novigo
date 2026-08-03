/**
 * Commission des prestations artisans — Module Artisans, chapitre 7.
 *
 * ⚠️ Ce barème n'est PAS celui des livraisons. Le cahier des charges v0.75 §6
 * fixe pour la livraison une commission de 10 % bornée entre 100 et 300 FCFA ;
 * le module Artisans, lui, applique un barème dégressif par tranches avec un
 * plafond de 50 000 FCFA. Les deux coexistent parce qu'ils couvrent deux
 * métiers différents — d'où deux modules distincts plutôt qu'un seul avec un
 * drapeau, qui finirait par appliquer le mauvais barème.
 *
 * Toutes les valeurs sont administrables (chapitre 2, principe de conception).
 */

/** Une tranche du barème dégressif. */
export interface CommissionBracket {
  /** Borne haute INCLUSE de la tranche, en FCFA. `null` = tranche terminale. */
  upTo: number | null;
  /** Taux appliqué au montant de la prestation, en pourcentage. */
  percent: number;
}

export interface ArtisanCommissionPolicy {
  brackets: CommissionBracket[];
  /** Plafond absolu de la commission, en FCFA. */
  cap: number;
  /** Nombre de commissions impayées à partir duquel l'artisan est bloqué. */
  maxUnpaidCount: number;
  /** Dette cumulée à partir de laquelle l'artisan est bloqué, en FCFA. */
  maxDebt: number;
  /** Délai avant exigibilité d'une commission sur paiement espèces, en minutes. */
  cashDueAfterMinutes: number;
}

/** Valeurs validées (chapitre 7, §7 et §10). */
export const DEFAULT_ARTISAN_COMMISSION: ArtisanCommissionPolicy = {
  brackets: [
    { upTo: 50_000, percent: 10 },
    { upTo: 200_000, percent: 7 },
    { upTo: 1_000_000, percent: 5 },
    { upTo: null, percent: 3 },
  ],
  cap: 50_000,
  maxUnpaidCount: 3,
  maxDebt: 20_000,
  cashDueAfterMinutes: 30,
};

export interface CommissionResult {
  /** Commission retenue, en FCFA. */
  amount: number;
  /** Taux effectivement appliqué, en pourcentage. */
  percent: number;
  /** Montant net revenant à l'artisan, en FCFA. */
  net: number;
  /** Vrai si le plafond a écrêté la commission. */
  capped: boolean;
}

/**
 * Commission due sur une prestation.
 *
 * Le barème s'applique en **taux unique** : c'est la tranche dans laquelle tombe
 * le montant total qui fixe le pourcentage, et non un cumul par tranche comme
 * pour l'impôt. C'est la lecture littérale du tableau du chapitre 7 — une
 * prestation de 60 000 FCFA est commissionnée à 7 % sur la totalité.
 */
export function artisanCommission(
  amount: number,
  policy: ArtisanCommissionPolicy = DEFAULT_ARTISAN_COMMISSION,
): CommissionResult {
  const total = Math.max(0, Math.round(amount || 0));
  const bracket =
    policy.brackets.find((b) => b.upTo === null || total <= b.upTo) ??
    policy.brackets[policy.brackets.length - 1];

  const raw = Math.round((total * bracket.percent) / 100);
  const capped = raw > policy.cap;
  const commission = capped ? policy.cap : raw;

  return {
    amount: commission,
    percent: bracket.percent,
    net: total - commission,
    capped,
  };
}

/** Situation d'un artisan au regard de ses commissions dues. */
export interface DebtSituation {
  /** Nombre de commissions exigibles non réglées. */
  unpaidCount: number;
  /** Dette cumulée, en FCFA. */
  debt: number;
}

export interface BlockingDecision {
  /** Vrai si l'artisan ne doit plus recevoir de nouvelles missions. */
  blocked: boolean;
  /** Motif lisible, destiné à l'artisan et au journal d'audit. */
  reason: string | null;
}

/**
 * Blocage automatique (chapitre 7, §10).
 *
 * Les deux conditions sont alternatives : trois impayées OU une dette
 * dépassant le seuil. Le blocage ne concerne que l'attribution de NOUVELLES
 * missions — celles déjà acceptées se poursuivent, un artisan ne doit pas
 * abandonner un client en cours de chantier à cause d'une dette.
 */
export function assessBlocking(
  situation: DebtSituation,
  policy: ArtisanCommissionPolicy = DEFAULT_ARTISAN_COMMISSION,
): BlockingDecision {
  const { unpaidCount, debt } = situation;

  if (unpaidCount >= policy.maxUnpaidCount) {
    return {
      blocked: true,
      reason: `${unpaidCount} commissions impayées (seuil : ${policy.maxUnpaidCount})`,
    };
  }
  if (debt > policy.maxDebt) {
    return {
      blocked: true,
      reason: `Dette de ${debt} FCFA supérieure au plafond de ${policy.maxDebt} FCFA`,
    };
  }
  return { blocked: false, reason: null };
}

/**
 * Date d'exigibilité d'une commission réglée en espèces (chapitre 7, §5).
 *
 * Le point de départ est la clôture EFFECTIVE de la mission : validation par le
 * client, validation automatique, ou clôture d'un litige.
 */
export function cashCommissionDueAt(
  effectiveClosureAt: Date,
  policy: ArtisanCommissionPolicy = DEFAULT_ARTISAN_COMMISSION,
): Date {
  return new Date(effectiveClosureAt.getTime() + policy.cashDueAfterMinutes * 60_000);
}
