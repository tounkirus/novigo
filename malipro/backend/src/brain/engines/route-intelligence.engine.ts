import { Injectable } from "@nestjs/common";
import { KnowledgeService } from "../knowledge.service";
import { CityIntelligenceEngine } from "./city-intelligence.engine";
import { GeoPoint, RoutePlan, ServiceRuntime } from "../brain.types";
import { clamp, roadMeters, zoneOf } from "../geo";

/// ROUTE INTELLIGENCE ENGINE — le meilleur parcours, pas le plus court.
///
/// Le temps annoncé au client est un temps de bout en bout : préparation chez le
/// partenaire + approche du prestataire + trajet, corrigé par le trafic appris de
/// l'heure et du quartier, puis par le délai réellement constaté sur ce couple
/// (zone, service). C'est cette dernière correction qui rend le Brain meilleur
/// chaque jour sans changer une ligne de code.
@Injectable()
export class RouteIntelligenceEngine {
  static readonly VERSION = "1.0.0";

  constructor(
    private knowledge: KnowledgeService,
    private city: CityIntelligenceEngine,
  ) {}

  async plan(input: {
    service: ServiceRuntime;
    hour: number;
    pickup?: GeoPoint;
    dropoff?: GeoPoint;
    providerLocation?: GeoPoint;
    storeId?: string;
  }): Promise<RoutePlan> {
    const { service, hour } = input;
    const reasons: string[] = [];
    const legs: RoutePlan["legs"] = [];

    const zone = zoneOf(input.dropoff ?? input.pickup).zone;
    const traffic = await this.city.trafficFactor(zone, hour);
    const speed = clamp((service.constraints.baseSpeedKmh ?? 22) / traffic, 6, 45);

    // 1. Préparation côté partenaire (appris par commerçant, sinon par service).
    if (input.storeId) {
      // Même exigence de preuve que pour les délais de zone : une seule commande
      // observée ne suffit pas à décréter le temps de préparation d'un commerce.
      const learnedPrep = await this.knowledge.detail("MERCHANT", input.storeId, "prep_minutes", 12);
      const confirmed = learnedPrep.samples >= 5;
      const prep = confirmed ? learnedPrep.value : 12;
      legs.push({ label: "Préparation", minutes: Math.round(prep) });
      reasons.push(
        confirmed
          ? `Préparation moyenne observée chez ce partenaire : ${Math.round(prep)} min (${learnedPrep.samples} commandes).`
          : "Préparation estimée : pas encore assez de commandes observées chez ce partenaire.",
      );
    } else if (service.family === "HOME_SERVICE" || service.family === "HEALTH") {
      legs.push({ label: "Mobilisation du prestataire", minutes: 10 });
    }

    // 2. Approche : le prestataire rejoint le point de départ.
    if (input.providerLocation && input.pickup) {
      const meters = roadMeters(input.providerLocation, input.pickup);
      legs.push({
        label: "Approche prestataire",
        minutes: Math.round((meters / 1000 / speed) * 60),
        meters,
      });
    }

    // 3. Trajet principal.
    let mainMeters = 0;
    if (input.pickup && input.dropoff) {
      mainMeters = roadMeters(input.pickup, input.dropoff);
      legs.push({
        label: "Trajet",
        minutes: Math.round((mainMeters / 1000 / speed) * 60),
        meters: mainMeters,
      });
    }

    let etaMinutes = legs.reduce((s, l) => s + l.minutes, 0);
    if (etaMinutes === 0) {
      // Mission sans géolocalisation : on retient le délai appris pour ce service.
      etaMinutes = Math.round(
        await this.knowledge.get("SERVICE", service.key, "avg_minutes", service.constraints.slaMinutes),
      );
      legs.push({ label: "Durée estimée", minutes: etaMinutes });
      reasons.push("Position non fournie : délai moyen appris pour ce service.");
    }

    // 4. Correction par l'expérience réelle du couple (zone, service).
    const learned = await this.knowledge.detail("ZONE", `${zone}|${service.key}`, "avg_minutes", 0);
    if (learned.samples >= 5 && learned.value > 0) {
      const corrected = Math.round((etaMinutes + learned.value) / 2);
      reasons.push(
        `Ajusté par ${learned.samples} missions réelles sur ${zone} (${Math.round(learned.value)} min observées).`,
      );
      etaMinutes = corrected;
    }

    reasons.push(
      traffic > 1.3
        ? `Trafic dense à ${hour} h sur ${zone} (×${traffic.toFixed(2)}).`
        : `Circulation fluide à ${hour} h sur ${zone}.`,
    );

    return {
      distanceMeters: mainMeters,
      etaMinutes: Math.max(5, etaMinutes),
      legs,
      trafficFactor: traffic,
      reasons,
    };
  }
}
