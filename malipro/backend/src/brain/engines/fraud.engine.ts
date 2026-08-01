import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { FraudAssessment, ServiceRuntime } from "../brain.types";

/// FRAUD ENGINE — détecte fraudes, faux comptes, comportements anormaux et abus.
///
/// Le moteur ne « devine » pas : il compte des faits (cadence de commandes, taux
/// d'annulation, encours en espèces, ancienneté du compte) et pose des signaux
/// gradués. Seul un cumul critique bloque une mission ; tout le reste sert à
/// pondérer la décision et à alerter l'administration.
@Injectable()
export class FraudEngine {
  static readonly VERSION = "1.0.0";
  private readonly logger = new Logger("Brain/Fraud");

  /// Nombre de missions créées en 10 min au-delà duquel la cadence est anormale.
  private static readonly VELOCITY_LIMIT = 5;
  /// Encours maximum en espèces admis pour un client peu fiable.
  private static readonly CASH_RISK_AMOUNT = 100_000;

  constructor(private prisma: PrismaService) {}

  async assess(input: {
    clientId: string;
    service: ServiceRuntime;
    amount?: number;
    paymentMethod?: string | null;
    clientTrust: number;
    missionId?: string | null;
  }): Promise<FraudAssessment> {
    const signals: FraudAssessment["signals"] = [];
    const reasons: string[] = [];

    try {
      const since = new Date(Date.now() - 10 * 60_000);
      const [recent, cancelled, total, accountAgeDays] = await Promise.all([
        this.prisma.mission.count({ where: { clientId: input.clientId, createdAt: { gte: since } } }),
        this.prisma.mission.count({ where: { clientId: input.clientId, status: "CANCELLED" } }),
        this.prisma.mission.count({ where: { clientId: input.clientId } }),
        this.accountAgeDays(input.clientId),
      ]);

      if (recent >= FraudEngine.VELOCITY_LIMIT) {
        signals.push({ kind: "VELOCITY", severity: recent >= 10 ? 4 : 2, details: { recent } });
        reasons.push(`${recent} missions créées en 10 minutes.`);
      }
      if (total >= 5 && cancelled / total > 0.5) {
        signals.push({
          kind: "CANCEL_ABUSE",
          severity: 3,
          details: { cancelled, total },
        });
        reasons.push(`${cancelled} annulations sur ${total} missions.`);
      }
      if (
        (input.paymentMethod ?? "").toUpperCase() === "CASH" &&
        (input.amount ?? 0) >= FraudEngine.CASH_RISK_AMOUNT &&
        input.clientTrust < 60
      ) {
        signals.push({ kind: "PAYMENT_RISK", severity: 3, details: { amount: input.amount } });
        reasons.push("Montant élevé en espèces sur un compte encore peu fiable.");
      }
      if (accountAgeDays != null && accountAgeDays < 1 && (input.amount ?? 0) > 50_000) {
        signals.push({ kind: "DUPLICATE_ACCOUNT", severity: 2, details: { accountAgeDays } });
        reasons.push("Compte créé aujourd'hui pour un montant inhabituel.");
      }
    } catch (e: any) {
      this.logger.debug(`analyse de fraude dégradée: ${e.message}`);
    }

    const severity = signals.reduce((s, x) => Math.max(s, x.severity), 0);
    const cumulative = signals.reduce((s, x) => s + x.severity, 0);
    const risk = cumulative >= 6 ? "HIGH" : cumulative >= 3 ? "MEDIUM" : "LOW";
    const blocked = cumulative >= 8;
    if (!signals.length) reasons.push("Aucun comportement anormal détecté.");
    if (blocked) reasons.push("Mission bloquée : vérification manuelle requise.");

    // Persistance des signaux pour l'administration (best-effort).
    for (const s of signals) {
      try {
        await this.prisma.fraudSignal.create({
          data: {
            subjectId: input.clientId,
            subjectType: "CUSTOMER",
            kind: s.kind,
            severity: s.severity,
            missionId: input.missionId ?? null,
            details: (s.details ?? undefined) as any,
          },
        });
      } catch {
        /* journalisation best-effort */
      }
    }

    return { risk, severity, signals, blocked, reasons };
  }

  private async accountAgeDays(userId: string): Promise<number | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      });
      if (!user) return null;
      return (Date.now() - user.createdAt.getTime()) / 86_400_000;
    } catch {
      return null;
    }
  }

  /// Signaux récents (console d'administration).
  async recent(limit = 50) {
    try {
      return await this.prisma.fraudSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 200),
      });
    } catch {
      return [];
    }
  }
}
