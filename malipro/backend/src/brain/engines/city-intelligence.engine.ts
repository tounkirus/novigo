import { Injectable } from "@nestjs/common";
import { KnowledgeService } from "../knowledge.service";
import { CityPulse } from "../brain.types";
import { clamp } from "../geo";

/// Courbe de demande par défaut d'une ville malienne (indice 1 = normal),
/// utilisée tant que le Brain n'a pas assez observé le quartier.
const DEFAULT_DEMAND_CURVE = [
  0.2, 0.15, 0.1, 0.1, 0.15, 0.3, 0.5, 0.8, 0.9, 0.9, 1.0, 1.3,
  1.7, 1.6, 1.1, 0.9, 1.0, 1.2, 1.6, 1.8, 1.5, 1.0, 0.6, 0.35,
];

/// CITY INTELLIGENCE ENGINE — comprend le fonctionnement de la ville.
/// Heures de pointe, quartiers actifs, zones saturées, zones sans prestataires.
@Injectable()
export class CityIntelligenceEngine {
  static readonly VERSION = "1.0.0";

  constructor(private knowledge: KnowledgeService) {}

  /// Enregistre une demande observée dans un quartier à une heure donnée.
  async recordDemand(zone: string, hour: number): Promise<void> {
    await this.knowledge.increment("ZONE", zone, `demand_h${hour}`, 1);
    await this.knowledge.increment("CITY", "Bamako", `demand_h${hour}`, 1);
  }

  /// Photographie de la tension d'un quartier : demande vs offre disponible.
  async pulse(
    zone: string,
    hour: number,
    observed: { availableProviders?: number; openMissions?: number } = {},
  ): Promise<CityPulse> {
    const reasons: string[] = [];
    const learned = await this.knowledge.detail("ZONE", zone, `demand_h${hour}`, 0);
    const baseline = await this.knowledge.get("ZONE", zone, "demand_baseline", 0);

    let demandIndex = DEFAULT_DEMAND_CURVE[clamp(hour, 0, 23)] ?? 1;
    if (learned.samples >= 5 && baseline > 0) {
      demandIndex = clamp(learned.value / baseline, 0.1, 2);
      reasons.push(
        `Demande apprise à ${hour} h sur ${zone} : ${learned.value.toFixed(0)} missions observées.`,
      );
    } else {
      reasons.push(`Demande estimée à ${hour} h (courbe ville, quartier peu observé).`);
    }

    const expectedSupply = await this.knowledge.get("ZONE", zone, "supply_expected", 5);
    const providers = observed.availableProviders ?? expectedSupply;
    const supplyIndex = clamp(providers / Math.max(1, expectedSupply), 0.1, 2);
    if (observed.availableProviders != null) {
      reasons.push(`${observed.availableProviders} prestataire(s) disponible(s) sur la zone.`);
    }

    let tension = clamp(demandIndex / Math.max(0.2, supplyIndex), 0.3, 3);
    // Le Brain ne majore JAMAIS sur une absence de preuve : tant que la demande
    // du quartier n'est pas réellement observée, la tension reste quasi neutre.
    // Sans ce garde-fou, « aucun livreur en ligne » (nuit, démarrage, démo) suffirait
    // à appliquer la majoration maximale au client — ce qui rompt le Carré d'Équilibre.
    if (learned.samples < 5) {
      tension = clamp(tension, 0.85, 1.15);
      reasons.push("Quartier peu observé : tension plafonnée, pas de majoration significative.");
    }
    if (tension > 1.35) reasons.push("Zone tendue : plus de demandes que de prestataires.");
    else if (tension < 0.7) reasons.push("Zone détendue : prestataires en attente.");

    return {
      zone,
      hour,
      demandIndex,
      supplyIndex,
      tension,
      peakHours: await this.peakHours(zone),
      reasons,
    };
  }

  /// Heures de pointe apprises pour un quartier (repli : courbe ville).
  async peakHours(zone: string): Promise<number[]> {
    const profile = await this.knowledge.profile("ZONE", zone);
    const hours = Object.entries(profile)
      .filter(([metric]) => metric.startsWith("demand_h"))
      .map(([metric, v]) => ({ hour: Number(metric.replace("demand_h", "")), value: v.value }))
      .filter((h) => Number.isFinite(h.hour));
    if (hours.length < 6) {
      return DEFAULT_DEMAND_CURVE.map((v, hour) => ({ hour, value: v }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((h) => h.hour)
        .sort((a, b) => a - b);
    }
    return hours
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((h) => h.hour)
      .sort((a, b) => a - b);
  }

  /// Quartiers les plus actifs (console d'administration).
  async busiestZones(limit = 5) {
    const rows = await this.knowledge.top("ZONE", "missions_total", limit);
    return rows.map((r) => ({ zone: r.key, missions: r.value, samples: r.samples }));
  }

  /// Quartiers où le délai réel dépasse le plus l'engagement : manque de prestataires.
  async underServedZones(limit = 5) {
    const rows = await this.knowledge.top("ZONE", "sla_overrun_minutes", limit);
    return rows
      .filter((r) => r.value > 0)
      .map((r) => ({ zone: r.key, overrunMinutes: Math.round(r.value), samples: r.samples }));
  }

  /// Facteur de trafic appliqué aux temps de trajet (1 = fluide).
  async trafficFactor(zone: string, hour: number): Promise<number> {
    const learned = await this.knowledge.detail("ZONE", zone, `traffic_h${hour}`, 0);
    if (learned.samples >= 5) return clamp(learned.value, 0.8, 2.2);
    const demand = DEFAULT_DEMAND_CURVE[clamp(hour, 0, 23)] ?? 1;
    return clamp(0.9 + demand * 0.35, 0.9, 1.8);
  }
}
