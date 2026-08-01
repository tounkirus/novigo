import { Injectable } from "@nestjs/common";
import {
  AssignmentResult, GeoPoint, ProviderCandidate, ScoredCandidate, ServiceRuntime,
} from "../brain.types";
import { clamp, roadMeters } from "../geo";

/// Poids du score de compatibilité (total = 100). Ils encodent la doctrine NOVIGO :
/// proximité d'abord (le client attend), puis confiance et qualité (le partenaire
/// engage sa réputation), puis équité de répartition (le prestataire doit vivre).
const WEIGHTS = {
  proximity: 34,
  trust: 20,
  rating: 15,
  experience: 9,
  fairness: 14,
  readiness: 8,
};

/// SERVICE DECISION ENGINE — le moteur principal.
///
/// Il ne « cherche pas le plus proche » : il note chaque candidat compatible et
/// retient celui qui sert le mieux les quatre piliers. Tout candidat écarté l'est
/// avec un motif lisible — aucune exclusion silencieuse.
@Injectable()
export class ServiceDecisionEngine {
  static readonly VERSION = "1.0.0";

  select(input: {
    service: ServiceRuntime;
    candidates: ProviderCandidate[];
    pickup?: GeoPoint;
  }): AssignmentResult {
    const { service, candidates, pickup } = input;
    const maxRadiusM = (service.constraints.maxRadiusKm ?? 10) * 1000;
    const rejected: { userId: string; reason: string }[] = [];
    const scored: ScoredCandidate[] = [];

    for (const c of candidates) {
      const factors: Record<string, number> = {};
      const reasons: string[] = [];

      if (!c.isAvailable) {
        rejected.push({ userId: c.userId, reason: "Prestataire hors ligne." });
        continue;
      }
      if (service.constraints.requiresKyc && !c.kycApproved) {
        rejected.push({ userId: c.userId, reason: "Dossier KYC non validé pour ce métier." });
        continue;
      }
      const missingSkill = service.skills.find((s) => !c.skills.includes(s));
      if (missingSkill) {
        rejected.push({ userId: c.userId, reason: `Compétence requise absente : ${missingSkill}.` });
        continue;
      }
      const missingEquipment = service.equipment.find((e) => c.equipment.length > 0 && !c.equipment.includes(e));
      if (missingEquipment) {
        rejected.push({ userId: c.userId, reason: `Équipement requis absent : ${missingEquipment}.` });
        continue;
      }
      if (service.requiresVehicle && !c.vehicle) {
        rejected.push({ userId: c.userId, reason: "Véhicule requis pour ce service." });
        continue;
      }
      if (service.constraints.minTrust != null && c.trust < service.constraints.minTrust) {
        rejected.push({
          userId: c.userId,
          reason: `Score de confiance ${Math.round(c.trust)} < ${service.constraints.minTrust} exigé.`,
        });
        continue;
      }

      // Proximité — le seul critère éliminatoire géographique.
      let distanceM: number | null = null;
      if (pickup && c.location) {
        distanceM = roadMeters(c.location, pickup);
        if (distanceM > maxRadiusM) {
          rejected.push({
            userId: c.userId,
            reason: `Trop loin (${(distanceM / 1000).toFixed(1)} km > ${service.constraints.maxRadiusKm} km).`,
          });
          continue;
        }
        factors.proximity = WEIGHTS.proximity * (1 - clamp(distanceM / maxRadiusM, 0, 1));
        reasons.push(`À ${(distanceM / 1000).toFixed(1)} km du point de départ.`);
      } else {
        // Position inconnue : ni prime ni exclusion (la moitié des points).
        factors.proximity = WEIGHTS.proximity * 0.5;
        reasons.push("Position non communiquée : proximité neutre.");
      }

      factors.trust = WEIGHTS.trust * clamp(c.trust / 100, 0, 1);
      factors.rating = WEIGHTS.rating * clamp(c.rating / 5, 0, 1);
      factors.experience = WEIGHTS.experience * clamp(c.completed / 100, 0, 1);
      // Équité : à qualité égale, le Brain donne la mission à celui qui en a le moins.
      factors.fairness = WEIGHTS.fairness * clamp(1 - c.activeMissions / 5, 0, 1);
      factors.readiness = WEIGHTS.readiness * (c.activeMissions === 0 ? 1 : 0.35);

      if (c.rating >= 4.5) reasons.push(`Excellente note client (${c.rating.toFixed(1)}/5).`);
      if (c.trust >= 75) reasons.push(`Confiance élevée (${Math.round(c.trust)}/100).`);
      if (c.activeMissions === 0) reasons.push("Disponible immédiatement, aucune mission en cours.");
      else reasons.push(`${c.activeMissions} mission(s) en cours.`);

      const score = Number(
        Object.values(factors).reduce((s, v) => s + v, 0).toFixed(2),
      );
      scored.push({ candidate: c, score, eligible: true, factors, reasons });
    }

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0];
    const runnerUp = scored[1];
    const confidence = selected
      ? Number(clamp(runnerUp ? (selected.score - runnerUp.score) / 25 + 0.55 : 0.9, 0.4, 0.99).toFixed(2))
      : 0;

    const reasons: string[] = [];
    if (selected) {
      reasons.push(
        `${selected.candidate.name ?? "Prestataire"} retenu avec un score de compatibilité de ${selected.score.toFixed(0)}/100.`,
      );
      reasons.push(...selected.reasons);
      if (runnerUp) {
        reasons.push(
          `Meilleur que le suivant de ${(selected.score - runnerUp.score).toFixed(0)} points.`,
        );
      }
    } else {
      reasons.push(
        candidates.length === 0
          ? "Aucun prestataire déclaré sur ce service."
          : "Aucun prestataire compatible : mission mise en attente d'un candidat éligible.",
      );
    }

    return { selected, ranked: scored, rejected, reasons, confidence };
  }

  /// Score d'une mission **du point de vue d'un prestataire** (app livreur :
  /// « pourquoi cette course m'est proposée »). Même barème, lecture inversée.
  scoreForProvider(input: {
    service: ServiceRuntime;
    candidate: ProviderCandidate;
    pickup?: GeoPoint;
  }): ScoredCandidate {
    const result = this.select({
      service: input.service,
      candidates: [input.candidate],
      pickup: input.pickup,
    });
    return (
      result.ranked[0] ?? {
        candidate: input.candidate,
        score: 0,
        eligible: false,
        factors: {},
        reasons: [result.rejected[0]?.reason ?? "Non éligible à cette mission."],
      }
    );
  }
}
