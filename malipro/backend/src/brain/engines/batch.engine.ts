import { Injectable } from "@nestjs/common";
import { GeoPoint, ServiceRuntime } from "../brain.types";
import { haversineMeters, roadMeters } from "../geo";

export interface BatchableMission {
  id: string;
  reference?: string;
  storeId?: string | null;
  pickup?: GeoPoint;
  dropoff?: GeoPoint;
  createdAt: Date;
  etaMinutes?: number | null;
}

export interface BatchProposal {
  grouped: BatchableMission[];
  savedMeters: number;
  savedMinutes: number;
  /// Retard accepté pour le client de la première mission (minutes).
  clientDelayMinutes: number;
  beneficial: boolean;
  reasons: string[];
}

/// BATCH ENGINE — regrouper seulement quand tout le monde y gagne.
///
/// Deux missions ne sont regroupées que si elles partent du même point (ou de deux
/// points très proches), arrivent dans le même secteur, et que le détour imposé au
/// premier client reste inférieur au gain de temps global. Le prestataire gagne une
/// course de plus sans rouler deux fois : c'est le seul regroupement admis.
@Injectable()
export class BatchEngine {
  static readonly VERSION = "1.0.0";

  /// Distance maximale entre deux points de retrait pour envisager un regroupement.
  private static readonly PICKUP_RADIUS_M = 900;
  /// Distance maximale entre deux points de livraison.
  private static readonly DROPOFF_RADIUS_M = 2500;
  /// Fenêtre temporelle : au-delà, le premier client attendrait trop.
  private static readonly WINDOW_MINUTES = 12;
  /// Retard maximum toléré pour le client déjà servi.
  private static readonly MAX_CLIENT_DELAY_MIN = 8;

  evaluate(input: {
    service: ServiceRuntime;
    mission: BatchableMission;
    open: BatchableMission[];
    now?: Date;
  }): BatchProposal {
    const { service, mission } = input;
    const now = input.now ?? new Date();
    const maxBatch = service.constraints.maxBatch ?? 1;
    const reasons: string[] = [];

    if (maxBatch <= 1) {
      return {
        grouped: [], savedMeters: 0, savedMinutes: 0, clientDelayMinutes: 0, beneficial: false,
        reasons: [`Le service « ${service.label} » interdit le regroupement.`],
      };
    }

    const compatible = input.open
      .filter((m) => m.id !== mission.id)
      .filter((m) => {
        const ageMin = Math.abs(now.getTime() - new Date(m.createdAt).getTime()) / 60000;
        if (ageMin > BatchEngine.WINDOW_MINUTES) return false;
        if (mission.storeId && m.storeId && mission.storeId === m.storeId) return true;
        if (!mission.pickup || !m.pickup) return false;
        return haversineMeters(mission.pickup, m.pickup) <= BatchEngine.PICKUP_RADIUS_M;
      })
      .filter((m) => {
        if (!mission.dropoff || !m.dropoff) return true;
        return haversineMeters(mission.dropoff, m.dropoff) <= BatchEngine.DROPOFF_RADIUS_M;
      })
      .slice(0, maxBatch - 1);

    if (!compatible.length) {
      return {
        grouped: [], savedMeters: 0, savedMinutes: 0, clientDelayMinutes: 0, beneficial: false,
        reasons: ["Aucune mission voisine dans la fenêtre de regroupement."],
      };
    }

    // Kilomètres évités : chaque mission groupée économise son trajet d'approche.
    let separateMeters = 0;
    let chainedMeters = 0;
    let previous = mission.dropoff;
    if (mission.pickup && mission.dropoff) {
      separateMeters += roadMeters(mission.pickup, mission.dropoff);
      chainedMeters += roadMeters(mission.pickup, mission.dropoff);
    }
    for (const m of compatible) {
      if (m.pickup && m.dropoff) separateMeters += roadMeters(m.pickup, m.dropoff);
      if (previous && m.dropoff) chainedMeters += roadMeters(previous, m.dropoff);
      previous = m.dropoff ?? previous;
    }

    const savedMeters = Math.max(0, separateMeters - chainedMeters);
    const speedKmh = service.constraints.baseSpeedKmh ?? 22;
    const savedMinutes = Math.round((savedMeters / 1000 / speedKmh) * 60);
    // Le client déjà servi accepte le détour du second arrêt, pas davantage.
    const clientDelayMinutes = Math.round(
      ((chainedMeters - (mission.pickup && mission.dropoff ? roadMeters(mission.pickup, mission.dropoff) : 0)) /
        1000 /
        speedKmh) *
        60,
    );

    const beneficial =
      savedMeters > 500 && clientDelayMinutes <= BatchEngine.MAX_CLIENT_DELAY_MIN;

    reasons.push(
      `${compatible.length + 1} missions au départ du même secteur.`,
      `${(savedMeters / 1000).toFixed(1)} km et ${savedMinutes} min économisés sur la tournée.`,
      beneficial
        ? `Retard client acceptable (${clientDelayMinutes} min ≤ ${BatchEngine.MAX_CLIENT_DELAY_MIN} min).`
        : `Regroupement refusé : ${clientDelayMinutes} min de retard pour le premier client.`,
    );

    return {
      grouped: beneficial ? [mission, ...compatible] : [],
      savedMeters,
      savedMinutes,
      clientDelayMinutes,
      beneficial,
      reasons,
    };
  }
}
