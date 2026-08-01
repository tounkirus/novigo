/**
 * Client NOVIGO Brain (web).
 *
 * Le Brain est le seul décideur de la plateforme (principe n°1) : le web, comme
 * les applications mobiles, consomme ses décisions et les affiche avec leurs
 * raisons. Toutes les routes vivent côté NestJS et passent par le Gateway.
 *
 * En mode mock (défaut, démo zéro-infra), les fonctions `…OrDemo` renvoient un
 * jeu déterministe explicitement marqué comme démonstration — jamais présenté
 * comme une décision réelle du Brain.
 */
import { httpGet, httpPost } from "./http";
import { isLiveMode } from "./config";

export interface BrainBalance {
  client: number;
  provider: number;
  partner: number;
  novigo: number;
}

export interface BrainPriceLine {
  label: string;
  amount: number;
}

export interface BrainQuote {
  serviceKey: string;
  serviceLabel: string;
  price: { amount: number; currency: string };
  breakdown: BrainPriceLine[];
  etaMinutes: number;
  distanceMeters: number;
  surge: number;
  commission: number;
  providerPayout: number;
  zone: string;
  reasons: string[];
  balance: BrainBalance;
  decisionId: string | null;
}

export interface BrainDecision {
  id: string;
  kind: "ASSIGNMENT" | "PRICING" | "ROUTE" | "BATCH" | "TRUST" | "FRAUD" | "LEARNING";
  engine: string;
  engineVersion: string;
  serviceKey: string | null;
  missionId: string | null;
  reasons: string[];
  score: number | null;
  confidence: number | null;
  balance: BrainBalance | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface BrainService {
  key: string;
  label: string;
  family: string;
  providerKind: string;
  slaMinutes: number;
  maxBatch: number;
  fromDatabase: boolean;
}

export interface BrainDashboard {
  missions: number;
  byStatus: { status: string; count: number }[];
  decisions: number;
  knowledge: { entries: number; observations: number };
  engines: { name: string; version: string }[];
  fraudSignals: { kind: string; severity: number; createdAt: string }[];
  /** Faux quand les valeurs proviennent du jeu de démonstration. */
  live: boolean;
}

export interface BrainCityInsights {
  hour: number;
  pulse: {
    zone: string;
    demandIndex: number;
    supplyIndex: number;
    tension: number;
    peakHours: number[];
    reasons: string[];
  };
  busiest: { zone: string; missions: number }[];
  underServed: { zone: string; overrunMinutes: number }[];
  knowledge: { entries: number; observations: number };
  live: boolean;
}

/** Les huit moteurs du Brain, dans l'ordre du chapitre 15. */
export const BRAIN_ENGINES: { name: string; role: string }[] = [
  { name: "Service Decision Engine", role: "Choisit le prestataire le plus adapté à chaque mission." },
  { name: "Smart Pricing Engine", role: "Calcule le tarif juste (zone, distance, service, attente)." },
  { name: "Route Intelligence Engine", role: "Détermine le parcours le plus efficace, pas le plus court." },
  { name: "Batch Engine", role: "Regroupe les missions quand tout le monde y gagne." },
  { name: "Trust Engine", role: "Score de confiance des clients, prestataires et commerçants." },
  { name: "Fraud Engine", role: "Détecte fraudes, faux comptes et comportements anormaux." },
  { name: "City Intelligence Engine", role: "Apprend la ville : pointe, quartiers actifs, zones saturées." },
  { name: "Learning Engine", role: "Réinjecte chaque mission terminée dans le Livre de Connaissances." },
];

// ── Appels live ─────────────────────────────────────────────────────────────

export const brainServices = () => httpGet<BrainService[]>("/brain/services");
export const brainDashboardLive = () => httpGet<Omit<BrainDashboard, "live">>("/brain/dashboard");
export const brainDecisionsLive = (limit = 20) =>
  httpGet<BrainDecision[]>("/brain/decisions", { limit });
export const brainCityLive = (zone?: string) =>
  httpGet<Omit<BrainCityInsights, "live">>("/brain/insights/city", zone ? { zone } : undefined);
export const brainExplain = (id: string) => httpGet<BrainDecision>(`/brain/decisions/${id}`);
export const brainQuote = (body: {
  serviceKey?: string;
  orderType?: string;
  storeId?: string;
  zone?: string;
  subtotal?: number;
  itemsCount?: number;
}) => httpPost<BrainQuote>("/brain/quote", body);

// ── Jeu de démonstration (mode mock) ────────────────────────────────────────

const DEMO_DASHBOARD: BrainDashboard = {
  missions: 1284,
  byStatus: [
    { status: "COMPLETED", count: 1105 },
    { status: "IN_PROGRESS", count: 46 },
    { status: "ASSIGNED", count: 61 },
    { status: "PENDING", count: 42 },
    { status: "CANCELLED", count: 30 },
  ],
  decisions: 5136,
  knowledge: { entries: 412, observations: 8940 },
  engines: [
    { name: "ServiceDecisionEngine", version: "1.0.0" },
    { name: "SmartPricingEngine", version: "1.0.0" },
    { name: "RouteIntelligenceEngine", version: "1.0.0" },
    { name: "BatchEngine", version: "1.0.0" },
    { name: "TrustEngine", version: "1.0.0" },
    { name: "FraudEngine", version: "1.0.0" },
    { name: "CityIntelligenceEngine", version: "1.0.0" },
    { name: "LearningEngine", version: "1.0.0" },
  ],
  fraudSignals: [],
  live: false,
};

const DEMO_DECISIONS: BrainDecision[] = [
  {
    id: "demo-assignment-1",
    kind: "ASSIGNMENT",
    engine: "ServiceDecisionEngine",
    engineVersion: "1.0.0",
    serviceKey: "food_delivery",
    missionId: "demo-mission-1",
    reasons: [
      "Moussa T. retenu avec un score de compatibilité de 87/100.",
      "À 0,8 km du point de départ.",
      "Excellente note client (4.8/5).",
      "Disponible immédiatement, aucune mission en cours.",
    ],
    score: 87,
    confidence: 0.82,
    balance: { client: 88, provider: 90, partner: 86, novigo: 50 },
    latencyMs: 14,
    createdAt: "2026-07-30T12:04:00.000Z",
  },
  {
    id: "demo-pricing-1",
    kind: "PRICING",
    engine: "SmartPricingEngine",
    engineVersion: "1.0.0",
    serviceKey: "food_delivery",
    missionId: "demo-mission-1",
    reasons: [
      "Distance réelle estimée : 3,4 km.",
      "Zone très demandée : majoration ×1.12 (plafond métier ×1.6).",
      "Trafic dense à 12 h sur Hamdallaye ACI (×1.50).",
    ],
    score: 1075,
    confidence: 0.9,
    balance: { client: 82, provider: 90, partner: 84, novigo: 50 },
    latencyMs: 9,
    createdAt: "2026-07-30T12:03:58.000Z",
  },
  {
    id: "demo-batch-1",
    kind: "BATCH",
    engine: "BatchEngine",
    engineVersion: "1.0.0",
    serviceKey: "food_delivery",
    missionId: "demo-mission-2",
    reasons: [
      "2 missions au départ du même secteur.",
      "3,1 km et 8 min économisés sur la tournée.",
      "Retard client acceptable (2 min ≤ 8 min).",
    ],
    score: null,
    confidence: null,
    balance: null,
    latencyMs: 4,
    createdAt: "2026-07-30T11:58:12.000Z",
  },
  {
    id: "demo-learning-1",
    kind: "LEARNING",
    engine: "LearningEngine",
    engineVersion: "1.0.0",
    serviceKey: "pharmacy_delivery",
    missionId: "demo-mission-3",
    reasons: [
      "Délai réel de 26 min mémorisé pour Badalabougou / pharmacy_delivery.",
      "Écart d'estimation : +3 min.",
    ],
    score: null,
    confidence: null,
    balance: null,
    latencyMs: 22,
    createdAt: "2026-07-30T11:41:03.000Z",
  },
  {
    id: "demo-fraud-1",
    kind: "FRAUD",
    engine: "FraudEngine",
    engineVersion: "1.0.0",
    serviceKey: "parcel_delivery",
    missionId: null,
    reasons: ["Aucun comportement anormal détecté."],
    score: null,
    confidence: 0.8,
    balance: null,
    latencyMs: 6,
    createdAt: "2026-07-30T11:37:45.000Z",
  },
];

const DEMO_CITY: BrainCityInsights = {
  hour: 12,
  pulse: {
    zone: "Hamdallaye ACI",
    demandIndex: 1.7,
    supplyIndex: 1.1,
    tension: 1.55,
    peakHours: [12, 13, 19],
    reasons: [
      "Demande apprise à 12 h sur Hamdallaye ACI : 68 missions observées.",
      "9 prestataire(s) disponible(s) sur la zone.",
      "Zone tendue : plus de demandes que de prestataires.",
    ],
  },
  busiest: [
    { zone: "Hamdallaye ACI", missions: 412 },
    { zone: "Badalabougou", missions: 268 },
    { zone: "Centre-ville", missions: 231 },
    { zone: "Magnambougou", missions: 164 },
    { zone: "Kalaban Coura", missions: 138 },
  ],
  underServed: [
    { zone: "Kati", overrunMinutes: 14 },
    { zone: "Sébénikoro", overrunMinutes: 9 },
    { zone: "Sotuba", overrunMinutes: 6 },
  ],
  knowledge: { entries: 412, observations: 8940 },
  live: false,
};

// ── Lectures avec repli démo ────────────────────────────────────────────────

async function orDemo<T extends { live: boolean }>(
  live: () => Promise<Omit<T, "live">>,
  demo: T,
  label: string,
): Promise<T> {
  if (!isLiveMode()) return demo;
  try {
    return { ...(await live()), live: true } as T;
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn(`[novigo] Brain "${label}" indisponible → jeu de démonstration`, err);
    }
    return demo;
  }
}

export const brainDashboard = (): Promise<BrainDashboard> =>
  orDemo<BrainDashboard>(brainDashboardLive, DEMO_DASHBOARD, "dashboard");
export const brainCityInsights = (zone?: string): Promise<BrainCityInsights> =>
  orDemo<BrainCityInsights>(() => brainCityLive(zone), DEMO_CITY, "insights/city");

export async function brainDecisions(limit = 20): Promise<{ items: BrainDecision[]; live: boolean }> {
  if (!isLiveMode()) return { items: DEMO_DECISIONS.slice(0, limit), live: false };
  try {
    return { items: await brainDecisionsLive(limit), live: true };
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("[novigo] Brain \"decisions\" indisponible → jeu de démonstration", err);
    }
    return { items: DEMO_DECISIONS.slice(0, limit), live: false };
  }
}
