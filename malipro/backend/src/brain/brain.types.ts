// NOVIGO Brain — vocabulaire commun des moteurs.
// Aucun type ne mentionne « livraison » : le Brain raisonne en MISSIONS.

import { ServiceDefinition } from "./service-catalog";

export interface GeoPoint {
  lat: number;
  lng: number;
}

/// Le Carré d'Équilibre NOVIGO : une décision n'est bonne que si les quatre
/// piliers sont servis. Chaque valeur est une note sur 100.
export interface BalanceScore {
  client: number;
  provider: number;
  partner: number;
  novigo: number;
}

/// Contexte observé au moment de la décision (mission « Observer »).
export interface MissionContext {
  serviceKey: string;
  pickup?: GeoPoint;
  dropoff?: GeoPoint;
  zone?: string;
  city?: string;
  /// Heure locale (0–23) prise en compte pour le trafic et la tension.
  hour: number;
  itemsCount?: number;
  subtotal?: number;
  waitingMinutes?: number;
  scheduledAt?: Date | null;
  clientId?: string;
  storeId?: string;
}

/// Résultat du Route Intelligence Engine.
export interface RoutePlan {
  distanceMeters: number;
  etaMinutes: number;
  /// Détail : préparation, approche du prestataire, trajet.
  legs: { label: string; minutes: number; meters?: number }[];
  trafficFactor: number;
  reasons: string[];
}

/// Ligne du détail tarifaire montrée au client (transparence, principe n°3).
export interface PriceLine {
  label: string;
  amount: number;
}

/// Résultat du Smart Pricing Engine.
export interface PriceQuote {
  amount: number;
  currency: string;
  breakdown: PriceLine[];
  surge: number;
  commission: number;
  providerPayout: number;
  reasons: string[];
}

/// Prestataire candidat, tel qu'observé par le Brain.
export interface ProviderCandidate {
  /// Identifiant utilisateur (identité canonique Nest).
  userId: string;
  /// Identifiant métier (Driver.id / Artisan.id) pour l'exécution.
  profileId: string;
  kind: string;
  name?: string;
  location?: GeoPoint;
  rating: number;
  completed: number;
  isAvailable: boolean;
  skills: string[];
  equipment: string[];
  vehicle?: string | null;
  kycApproved: boolean;
  /// Missions déjà attribuées aujourd'hui (équité de répartition).
  activeMissions: number;
  trust: number;
}

/// Candidat noté par le Service Decision Engine.
export interface ScoredCandidate {
  candidate: ProviderCandidate;
  score: number;
  eligible: boolean;
  /// Détail des composantes du score (explicabilité).
  factors: Record<string, number>;
  reasons: string[];
}

export interface AssignmentResult {
  selected?: ScoredCandidate;
  ranked: ScoredCandidate[];
  rejected: { userId: string; reason: string }[];
  reasons: string[];
  confidence: number;
}

/// Enveloppe d'une décision journalisée (principe n°3 : toujours explicable).
export interface DecisionRecord {
  id?: string;
  kind: "ASSIGNMENT" | "PRICING" | "ROUTE" | "BATCH" | "TRUST" | "FRAUD" | "LEARNING";
  engine: string;
  engineVersion?: string;
  serviceKey?: string;
  missionId?: string | null;
  subjectId?: string | null;
  input: unknown;
  output: unknown;
  reasons: string[];
  candidates?: unknown;
  score?: number;
  confidence?: number;
  balance?: BalanceScore;
  latencyMs?: number;
}

/// Signal du Fraud Engine.
export interface FraudAssessment {
  risk: "LOW" | "MEDIUM" | "HIGH";
  severity: number;
  signals: { kind: string; severity: number; details?: unknown }[];
  blocked: boolean;
  reasons: string[];
}

/// Lecture du City Intelligence Engine pour une zone à une heure donnée.
export interface CityPulse {
  zone: string;
  hour: number;
  /// Demande observée, normalisée 0–2 (1 = normal).
  demandIndex: number;
  /// Offre de prestataires disponible, normalisée 0–2.
  supplyIndex: number;
  /// Tension = demande / offre.
  tension: number;
  peakHours: number[];
  reasons: string[];
}

export interface ServiceRuntime extends ServiceDefinition {
  /// Vrai si la définition vient de la base (ServicePolicy) et non du catalogue.
  fromDatabase: boolean;
}
