import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { clamp } from "../geo";

export type TrustSubject = "CUSTOMER" | "DRIVER" | "MERCHANT" | "PROVIDER";

export interface TrustProfile {
  subjectId: string;
  subjectType: TrustSubject;
  score: number;
  missions: number;
  successes: number;
  cancellations: number;
  incidents: number;
  level: "NOUVEAU" | "FIABLE" | "CONFIRMÉ" | "EXCELLENT" | "À SURVEILLER";
  reasons: string[];
}

/// TRUST ENGINE — score de confiance des clients, prestataires et commerçants.
///
/// Score neutre à 50 : personne n'est présumé mauvais, personne n'est présumé
/// parfait. Il monte avec les missions réussies, descend avec les annulations et
/// les incidents. Le Brain s'en sert pour arbitrer (attribution, remise fidélité,
/// vigilance anti-fraude) — jamais pour exclure quelqu'un sans motif enregistré.
@Injectable()
export class TrustEngine {
  static readonly VERSION = "1.0.0";
  private readonly logger = new Logger("Brain/Trust");

  constructor(private prisma: PrismaService) {}

  /// Profil de confiance ; renvoie le score neutre si rien n'est encore connu.
  async profile(subjectId: string, subjectType: TrustSubject): Promise<TrustProfile> {
    try {
      const row = await this.prisma.trustScore.findUnique({
        where: { subjectId_subjectType: { subjectId, subjectType } },
      });
      if (row) return TrustEngine.toProfile(row);
    } catch (e: any) {
      this.logger.debug(`score de confiance illisible: ${e.message}`);
    }
    return {
      subjectId, subjectType, score: 50, missions: 0, successes: 0,
      cancellations: 0, incidents: 0, level: "NOUVEAU",
      reasons: ["Aucun historique : score neutre de 50/100."],
    };
  }

  async scoreOf(subjectId: string, subjectType: TrustSubject): Promise<number> {
    return (await this.profile(subjectId, subjectType)).score;
  }

  /// Enregistre l'issue d'une mission et recalcule le score.
  async record(
    subjectId: string,
    subjectType: TrustSubject,
    outcome: "SUCCESS" | "CANCELLED" | "INCIDENT",
    weight = 1,
  ): Promise<TrustProfile> {
    try {
      const current = await this.prisma.trustScore.findUnique({
        where: { subjectId_subjectType: { subjectId, subjectType } },
      });
      const missions = (current?.missions ?? 0) + 1;
      const successes = (current?.successes ?? 0) + (outcome === "SUCCESS" ? 1 : 0);
      const cancellations = (current?.cancellations ?? 0) + (outcome === "CANCELLED" ? 1 : 0);
      const incidents = (current?.incidents ?? 0) + (outcome === "INCIDENT" ? 1 : 0);
      const score = TrustEngine.compute({ missions, successes, cancellations, incidents }, weight);
      const saved = await this.prisma.trustScore.upsert({
        where: { subjectId_subjectType: { subjectId, subjectType } },
        update: { score, missions, successes, cancellations, incidents },
        create: { subjectId, subjectType, score, missions, successes, cancellations, incidents },
      });
      return TrustEngine.toProfile(saved);
    } catch (e: any) {
      this.logger.debug(`mise à jour du score ignorée: ${e.message}`);
      return this.profile(subjectId, subjectType);
    }
  }

  /// Formule : 50 de base, + taux de réussite, − annulations, −− incidents,
  /// le tout amorti tant que l'historique est court (peu de missions = peu d'écart).
  static compute(
    c: { missions: number; successes: number; cancellations: number; incidents: number },
    weight = 1,
  ): number {
    const missions = Math.max(1, c.missions);
    const successRate = c.successes / missions;
    const cancelRate = c.cancellations / missions;
    const incidentRate = c.incidents / missions;
    const maturity = clamp(missions / 20, 0.2, 1); // confiance dans l'échantillon
    const raw =
      50 + (successRate * 50 - cancelRate * 45 - incidentRate * 70) * maturity * weight;
    return Number(clamp(raw, 0, 100).toFixed(1));
  }

  private static toProfile(row: any): TrustProfile {
    const reasons: string[] = [];
    if (row.missions === 0) reasons.push("Aucun historique : score neutre.");
    else {
      reasons.push(`${row.successes}/${row.missions} missions menées à bien.`);
      if (row.cancellations > 0) reasons.push(`${row.cancellations} annulation(s) enregistrée(s).`);
      if (row.incidents > 0) reasons.push(`${row.incidents} incident(s) signalé(s).`);
    }
    return {
      subjectId: row.subjectId,
      subjectType: row.subjectType,
      score: row.score,
      missions: row.missions,
      successes: row.successes,
      cancellations: row.cancellations,
      incidents: row.incidents,
      level: TrustEngine.levelOf(row.score, row.missions),
      reasons,
    };
  }

  static levelOf(score: number, missions: number): TrustProfile["level"] {
    if (missions < 3) return "NOUVEAU";
    if (score < 35) return "À SURVEILLER";
    if (score >= 85) return "EXCELLENT";
    if (score >= 65) return "CONFIRMÉ";
    return "FIABLE";
  }
}
