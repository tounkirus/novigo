// NOVIGO Brain — catalogue des métiers PAR CONFIGURATION (principe n°6).
//
// Le Brain ne connaît pas « la livraison » : il connaît des missions (principe n°5).
// Un nouveau métier s'ajoute ICI (ou en base, table ServicePolicy) — jamais en
// modifiant les moteurs. Les valeurs de ce fichier sont les valeurs par défaut ;
// une ligne ServicePolicy portant la même clé les remplace à chaud.

export type ServiceFamily = "DELIVERY" | "TRANSPORT" | "HOME_SERVICE" | "HEALTH" | "PAYMENT";
export type ProviderKind = "DRIVER" | "ARTISAN" | "MERCHANT";

/// Politique tarifaire d'un métier (montants en XOF).
export interface PricingPolicy {
  base: number;
  perKm: number;
  perMinute: number;
  minimum: number;
  /// Plafond du coefficient de tension (1 = jamais de majoration).
  surgeMax: number;
  /// Part NOVIGO prélevée sur la mission (%).
  commissionPercent: number;
  /// Minute d'attente facturée (0 = non facturée).
  waitingPerMinute?: number;
  /// Forfait déplacement d'un artisan, indépendant de la prestation.
  calloutFee?: number;
}

/// Contraintes d'exécution du métier.
export interface ServiceConstraints {
  /// Rayon de recherche d'un prestataire.
  maxRadiusKm: number;
  /// Engagement de délai (minutes) utilisé pour la priorité et l'apprentissage.
  slaMinutes: number;
  /// Nombre maximum de missions regroupables (1 = regroupement interdit).
  maxBatch: number;
  requiresKyc?: boolean;
  /// Score de confiance minimum exigé du prestataire.
  minTrust?: number;
  /// Vitesse moyenne retenue à défaut d'apprentissage (km/h).
  baseSpeedKmh?: number;
}

export interface ServiceDefinition {
  key: string;
  label: string;
  family: ServiceFamily;
  providerKind: ProviderKind;
  requiresVehicle: boolean;
  /// Compétences exigées du prestataire (matching Service Decision Engine).
  skills: string[];
  equipment: string[];
  pricing: PricingPolicy;
  constraints: ServiceConstraints;
  /// Type de commande ops correspondant, quand le métier passe par le catalogue.
  orderType?: string;
}

const delivery = (
  key: string,
  label: string,
  orderType: string,
  over: Partial<PricingPolicy> = {},
  cons: Partial<ServiceConstraints> = {},
): ServiceDefinition => ({
  key,
  label,
  family: "DELIVERY",
  providerKind: "DRIVER",
  requiresVehicle: true,
  skills: ["delivery"],
  equipment: ["sac_isotherme"],
  pricing: {
    base: 500, perKm: 150, perMinute: 0, minimum: 750,
    surgeMax: 1.6, commissionPercent: 10, waitingPerMinute: 25, ...over,
  },
  constraints: { maxRadiusKm: 8, slaMinutes: 45, maxBatch: 3, baseSpeedKmh: 22, ...cons },
  orderType,
});

const homeService = (
  key: string,
  label: string,
  skills: string[],
  equipment: string[],
  over: Partial<PricingPolicy> = {},
  cons: Partial<ServiceConstraints> = {},
): ServiceDefinition => ({
  key,
  label,
  family: "HOME_SERVICE",
  providerKind: "ARTISAN",
  requiresVehicle: false,
  skills,
  equipment,
  pricing: {
    base: 2500, perKm: 100, perMinute: 60, minimum: 3000,
    surgeMax: 1.3, commissionPercent: 12, calloutFee: 1500, ...over,
  },
  constraints: {
    maxRadiusKm: 15, slaMinutes: 120, maxBatch: 1, requiresKyc: true, minTrust: 40,
    baseSpeedKmh: 20, ...cons,
  },
  orderType: "ARTISAN_SERVICE",
});

/// Catalogue par défaut : tous les services NOVIGO d'aujourd'hui et le gabarit
/// des services de demain. Aucun moteur ne cite ces clés en dur.
export const SERVICE_CATALOG: ServiceDefinition[] = [
  // ── Livraison ─────────────────────────────────────────────────────────────
  delivery("food_delivery", "Livraison de repas", "FOOD"),
  delivery("pharmacy_delivery", "Livraison pharmacie", "PHARMACY",
    { base: 600, minimum: 900 }, { slaMinutes: 30, maxBatch: 2 }),
  delivery("grocery_delivery", "Livraison supermarché", "GROCERY",
    { base: 700, perKm: 175 }, { slaMinutes: 60 }),
  delivery("market_delivery", "Livraison marché", "MARKETPLACE",
    { base: 650, perKm: 165 }, { slaMinutes: 75 }),
  delivery("parcel_delivery", "Livraison de colis", "PARCEL",
    { base: 800, perKm: 200, minimum: 1000 }, { maxRadiusKm: 20, slaMinutes: 90, maxBatch: 5 }),

  // ── Transport ─────────────────────────────────────────────────────────────
  {
    key: "ride_moto",
    label: "Course moto",
    family: "TRANSPORT",
    providerKind: "DRIVER",
    requiresVehicle: true,
    skills: ["ride", "moto"],
    equipment: ["casque"],
    pricing: { base: 400, perKm: 175, perMinute: 25, minimum: 500, surgeMax: 1.8, commissionPercent: 15 },
    constraints: { maxRadiusKm: 25, slaMinutes: 20, maxBatch: 1, baseSpeedKmh: 25 },
  },
  {
    key: "ride_car",
    label: "Course voiture",
    family: "TRANSPORT",
    providerKind: "DRIVER",
    requiresVehicle: true,
    skills: ["ride", "voiture"],
    equipment: [],
    pricing: { base: 800, perKm: 300, perMinute: 40, minimum: 1500, surgeMax: 1.8, commissionPercent: 15 },
    constraints: { maxRadiusKm: 35, slaMinutes: 25, maxBatch: 1, baseSpeedKmh: 20 },
  },

  // ── Artisans & dépannage ──────────────────────────────────────────────────
  homeService("plumber", "Plombier", ["plomberie"], ["cle_a_molette", "deboucheur"]),
  homeService("electrician", "Électricien", ["electricite"], ["multimetre", "outillage_isole"]),
  homeService("carpenter", "Menuisier", ["menuiserie"], ["scie", "visseuse"]),
  homeService("locksmith", "Serrurier", ["serrurerie"], ["kit_ouverture"],
    { base: 3000, minimum: 4000 }, { slaMinutes: 60 }),
  homeService("mechanic", "Mécanicien", ["mecanique"], ["caisse_a_outils"],
    { base: 3500, minimum: 5000 }),
  homeService("roadside_assistance", "Dépannage automobile", ["mecanique", "remorquage"],
    ["cables", "cric"], { base: 5000, perKm: 250, minimum: 7500, surgeMax: 1.5 },
    { slaMinutes: 45, maxRadiusKm: 30 }),

  // ── Beauté & maison ───────────────────────────────────────────────────────
  homeService("hairdresser", "Coiffure à domicile", ["coiffure"], ["mallette_coiffure"],
    { base: 2000, minimum: 2500, calloutFee: 1000 }, { slaMinutes: 180 }),
  homeService("beautician", "Esthétique à domicile", ["esthetique"], ["mallette_soins"],
    { base: 2500, minimum: 3000, calloutFee: 1000 }, { slaMinutes: 180 }),
  homeService("housekeeping", "Femme de ménage", ["menage"], [],
    { base: 1500, perMinute: 45, minimum: 4000, calloutFee: 500 }, { slaMinutes: 240 }),
  homeService("cleaning", "Service de nettoyage", ["nettoyage"], ["materiel_nettoyage"],
    { base: 4000, perMinute: 50, minimum: 6000 }, { slaMinutes: 240 }),

  // ── Santé ─────────────────────────────────────────────────────────────────
  {
    key: "home_health",
    label: "Santé à domicile",
    family: "HEALTH",
    providerKind: "ARTISAN",
    requiresVehicle: false,
    skills: ["sante", "infirmier"],
    equipment: ["trousse_medicale"],
    pricing: { base: 5000, perKm: 100, perMinute: 80, minimum: 6000, surgeMax: 1.2, commissionPercent: 8 },
    constraints: { maxRadiusKm: 20, slaMinutes: 60, maxBatch: 1, requiresKyc: true, minTrust: 60, baseSpeedKmh: 20 },
  },

  // ── Paiements (mission sans déplacement) ──────────────────────────────────
  {
    key: "payment_service",
    label: "Paiement / transfert NOVIGO Pay",
    family: "PAYMENT",
    providerKind: "MERCHANT",
    requiresVehicle: false,
    skills: ["paiement"],
    equipment: [],
    pricing: { base: 0, perKm: 0, perMinute: 0, minimum: 0, surgeMax: 1, commissionPercent: 1.5 },
    constraints: { maxRadiusKm: 0, slaMinutes: 2, maxBatch: 1 },
  },
];

/// Correspondance OrderType (domaine ops existant) → métier du Brain.
const ORDER_TYPE_TO_SERVICE: Record<string, string> = {
  FOOD: "food_delivery",
  PHARMACY: "pharmacy_delivery",
  GROCERY: "grocery_delivery",
  MARKETPLACE: "market_delivery",
  PARCEL: "parcel_delivery",
  ARTISAN_SERVICE: "plumber",
};

/// Clé de service pour un type de commande ops (repli : livraison de repas).
export function serviceKeyForOrderType(type?: string | null): string {
  return ORDER_TYPE_TO_SERVICE[(type ?? "").toUpperCase()] ?? "food_delivery";
}

export function defaultService(key: string): ServiceDefinition | undefined {
  return SERVICE_CATALOG.find((s) => s.key === key);
}

/// Normalise un libellé libre en identifiant de compétence (« Plombier » → « plombier »).
export function normalizeSkill(value: string): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/// Métier déclaré par un prestataire → compétences comprises par le Brain.
/// C'est la table de correspondance qui évite de coder un cas par profession.
const PROFESSION_SKILLS: Record<string, string[]> = {
  plombier: ["plomberie"],
  electricien: ["electricite"],
  menuisier: ["menuiserie"],
  serrurier: ["serrurerie"],
  mecanicien: ["mecanique"],
  depanneur: ["mecanique", "remorquage"],
  remorquage: ["mecanique", "remorquage"],
  coiffeur: ["coiffure"],
  coiffeuse: ["coiffure"],
  estheticienne: ["esthetique"],
  esthetique: ["esthetique"],
  femme_de_menage: ["menage"],
  menage: ["menage"],
  agent_de_nettoyage: ["nettoyage"],
  nettoyage: ["nettoyage"],
  infirmier: ["sante", "infirmier"],
  infirmiere: ["sante", "infirmier"],
  aide_soignant: ["sante"],
  livreur: ["delivery"],
  chauffeur: ["ride"],
};

/// Compétences d'un prestataire à partir de sa profession déclarée.
export function skillsForProfession(profession?: string | null): string[] {
  const key = normalizeSkill(profession ?? "");
  if (!key) return [];
  const mapped = PROFESSION_SKILLS[key] ?? [];
  // Le libellé lui-même reste une compétence : un métier inconnu du tableau
  // fonctionne dès qu'on déclare la même clé dans la configuration du service.
  return [...new Set([key, ...mapped])];
}
