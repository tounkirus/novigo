import { Injectable } from "@nestjs/common";
import { KnowledgeService } from "../knowledge.service";
import { DecisionLogService } from "../decision-log.service";
import { TrustEngine } from "./trust.engine";
import { clamp } from "../geo";

export interface MissionOutcome {
  missionId: string;
  serviceKey: string;
  zone?: string | null;
  city?: string | null;
  storeId?: string | null;
  clientId?: string | null;
  providerId?: string | null;
  providerKind?: string | null;
  /// Délai annoncé au client au moment de la décision.
  predictedMinutes?: number | null;
  /// Délai réellement constaté.
  actualMinutes?: number | null;
  /// Engagement de délai du métier.
  slaMinutes?: number | null;
  /// Facteur de trafic utilisé lors de l'estimation (pour corriger la ville).
  trafficFactor?: number | null;
  hour?: number | null;
  amount?: number | null;
  status: "COMPLETED" | "CANCELLED" | "FAILED";
}

/// LEARNING ENGINE — « aucune mission n'est perdue » (principe n°4).
///
/// À la clôture de chaque mission, l'écart entre ce que le Brain avait promis et
/// ce qui s'est réellement passé est réinjecté dans le Livre de Connaissances :
/// délais par zone et par service, performance du prestataire, préparation du
/// partenaire, trafic horaire, scores de confiance. La décision suivante part donc
/// d'une meilleure base — c'est tout le mécanisme d'amélioration continue.
@Injectable()
export class LearningEngine {
  static readonly VERSION = "1.0.0";

  constructor(
    private knowledge: KnowledgeService,
    private trust: TrustEngine,
    private decisions: DecisionLogService,
  ) {}

  async learn(outcome: MissionOutcome): Promise<{ reasons: string[]; etaErrorMinutes: number | null }> {
    const started = Date.now();
    const reasons: string[] = [];
    const zone = outcome.zone || "Bamako";
    const actual = outcome.actualMinutes ?? null;
    const predicted = outcome.predictedMinutes ?? null;

    if (outcome.status === "COMPLETED" && actual != null && actual > 0) {
      await this.knowledge.observe("SERVICE", outcome.serviceKey, "avg_minutes", actual);
      await this.knowledge.observe("ZONE", `${zone}|${outcome.serviceKey}`, "avg_minutes", actual);
      await this.knowledge.increment("ZONE", zone, "missions_total", 1);
      await this.knowledge.increment("CITY", outcome.city || "Bamako", "missions_total", 1);
      reasons.push(`Délai réel de ${actual} min mémorisé pour ${zone} / ${outcome.serviceKey}.`);

      if (outcome.providerId) {
        await this.knowledge.observe("PROVIDER", outcome.providerId, "avg_minutes", actual);
        await this.knowledge.increment("PROVIDER", outcome.providerId, "missions_total", 1);
      }
      if (outcome.storeId && predicted != null) {
        // Un partenaire lent décale toute la chaîne : on apprend son temps propre.
        const prep = clamp(actual - Math.max(0, predicted - 12), 3, 60);
        await this.knowledge.observe("MERCHANT", outcome.storeId, "prep_minutes", prep);
      }
      if (outcome.slaMinutes != null) {
        await this.knowledge.observe(
          "ZONE", zone, "sla_overrun_minutes", Math.max(0, actual - outcome.slaMinutes),
        );
        if (actual > outcome.slaMinutes) {
          reasons.push(`Engagement dépassé de ${actual - outcome.slaMinutes} min sur cette zone.`);
        }
      }
      if (predicted && predicted > 0 && outcome.hour != null && outcome.trafficFactor) {
        const corrected = clamp(outcome.trafficFactor * (actual / predicted), 0.8, 2.2);
        await this.knowledge.observe("ZONE", zone, `traffic_h${outcome.hour}`, corrected);
      }
      if (outcome.amount != null && outcome.amount > 0) {
        await this.knowledge.observe("SERVICE", outcome.serviceKey, "avg_amount", outcome.amount);
      }
    }

    // Confiance : l'issue de la mission engage client ET prestataire.
    const trustOutcome =
      outcome.status === "COMPLETED" ? "SUCCESS" : outcome.status === "CANCELLED" ? "CANCELLED" : "INCIDENT";
    if (outcome.clientId) await this.trust.record(outcome.clientId, "CUSTOMER", trustOutcome);
    if (outcome.providerId) {
      await this.trust.record(
        outcome.providerId,
        outcome.providerKind === "ARTISAN" ? "PROVIDER" : "DRIVER",
        trustOutcome,
      );
    }
    if (outcome.storeId && outcome.status === "COMPLETED") {
      await this.trust.record(outcome.storeId, "MERCHANT", "SUCCESS");
    }

    const etaErrorMinutes = predicted != null && actual != null ? actual - predicted : null;
    if (etaErrorMinutes != null) {
      reasons.push(
        etaErrorMinutes === 0
          ? "Estimation exacte."
          : `Écart d'estimation : ${etaErrorMinutes > 0 ? "+" : ""}${etaErrorMinutes} min.`,
      );
      await this.knowledge.observe(
        "SERVICE", outcome.serviceKey, "eta_error_minutes", Math.abs(etaErrorMinutes),
      );
    }

    await this.decisions.record({
      kind: "LEARNING",
      engine: "LearningEngine",
      engineVersion: LearningEngine.VERSION,
      serviceKey: outcome.serviceKey,
      missionId: outcome.missionId,
      subjectId: outcome.providerId ?? outcome.clientId ?? null,
      input: outcome,
      output: { etaErrorMinutes, zone },
      reasons,
      latencyMs: Date.now() - started,
    });

    return { reasons, etaErrorMinutes };
  }
}
