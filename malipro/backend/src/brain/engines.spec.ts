import { SmartPricingEngine } from "./engines/smart-pricing.engine";
import { RouteIntelligenceEngine } from "./engines/route-intelligence.engine";
import { CityIntelligenceEngine } from "./engines/city-intelligence.engine";
import { ServiceDecisionEngine } from "./engines/service-decision.engine";
import { BatchEngine } from "./engines/batch.engine";
import { TrustEngine } from "./engines/trust.engine";
import { FraudEngine } from "./engines/fraud.engine";
import { LearningEngine } from "./engines/learning.engine";
import { KnowledgeService } from "./knowledge.service";
import { ProviderCandidate, RoutePlan, ServiceRuntime } from "./brain.types";
import { SERVICE_CATALOG, serviceKeyForOrderType, skillsForProfession } from "./service-catalog";
import { haversineMeters, zoneOf } from "./geo";

/// Base de connaissances vierge : le Brain doit savoir décider SANS historique.
const emptyKnowledge = () =>
  ({
    get: jest.fn(async (_s: string, _k: string, _m: string, fallback: number) => fallback),
    detail: jest.fn(async (_s: string, _k: string, _m: string, fallback: number) => ({
      value: fallback,
      samples: 0,
    })),
    observe: jest.fn(async () => ({ value: 0, samples: 1 })),
    increment: jest.fn(async () => undefined),
    profile: jest.fn(async () => ({})),
    top: jest.fn(async () => []),
    stats: jest.fn(async () => ({ entries: 0, observations: 0 })),
  }) as unknown as KnowledgeService;

const service = (key: string): ServiceRuntime => ({
  ...SERVICE_CATALOG.find((s) => s.key === key)!,
  fromDatabase: false,
});

const candidate = (over: Partial<ProviderCandidate> = {}): ProviderCandidate => ({
  userId: "u1",
  profileId: "d1",
  kind: "DRIVER",
  name: "Moussa",
  location: { lat: 12.64, lng: -8.02 },
  rating: 4.6,
  completed: 120,
  isAvailable: true,
  skills: ["delivery", "ride", "moto"],
  equipment: [],
  vehicle: "moto",
  kycApproved: true,
  activeMissions: 0,
  trust: 70,
  ...over,
});

describe("Catalogue de services (principe n°6)", () => {
  it("associe chaque type de commande ops à un métier du Brain", () => {
    expect(serviceKeyForOrderType("FOOD")).toBe("food_delivery");
    expect(serviceKeyForOrderType("PHARMACY")).toBe("pharmacy_delivery");
    expect(serviceKeyForOrderType("inconnu")).toBe("food_delivery");
  });

  it("traduit une profession déclarée en compétences", () => {
    expect(skillsForProfession("Plombier")).toEqual(["plombier", "plomberie"]);
    expect(skillsForProfession("Électricien")).toContain("electricite");
    expect(skillsForProfession("")).toEqual([]);
  });

  it("découpe la ville en quartiers connus", () => {
    expect(zoneOf({ lat: 12.6392, lng: -8.029 }).zone).toBe("Hamdallaye ACI");
    expect(zoneOf(null).zone).toBe("Bamako");
    expect(haversineMeters({ lat: 12.6, lng: -8 }, { lat: 12.6, lng: -8 })).toBe(0);
  });
});

describe("SmartPricingEngine", () => {
  const engine = new SmartPricingEngine();
  const route = (over: Partial<RoutePlan> = {}): RoutePlan => ({
    distanceMeters: 4000,
    etaMinutes: 25,
    legs: [],
    trafficFactor: 1.1,
    reasons: [],
    ...over,
  });

  it("construit un tarif détaillé et explique chaque ligne", () => {
    const q = engine.quote({ service: service("food_delivery"), route: route(), tension: 1 });
    expect(q.amount).toBeGreaterThanOrEqual(service("food_delivery").pricing.minimum);
    expect(q.breakdown.map((b) => b.label)).toEqual(
      expect.arrayContaining(["Prise en charge", expect.stringContaining("Distance")]),
    );
    expect(q.reasons.length).toBeGreaterThan(0);
    expect(q.commission + q.providerPayout).toBe(q.amount);
  });

  it("majore en zone tendue sans dépasser le plafond du métier", () => {
    const s = service("food_delivery");
    const calme = engine.quote({ service: s, route: route(), tension: 1 });
    const tendu = engine.quote({ service: s, route: route(), tension: 3 });
    expect(tendu.amount).toBeGreaterThan(calme.amount);
    expect(tendu.surge).toBeLessThanOrEqual(s.pricing.surgeMax);
  });

  it("applique une remise au client fidèle (pilier client)", () => {
    const s = service("parcel_delivery");
    const normal = engine.quote({ service: s, route: route({ distanceMeters: 12000 }), tension: 1 });
    const fidele = engine.quote({
      service: s,
      route: route({ distanceMeters: 12000 }),
      tension: 1,
      clientTrust: 92,
    });
    expect(fidele.amount).toBeLessThan(normal.amount);
    expect(fidele.reasons.join(" ")).toContain("fidèle");
  });

  it("respecte le tarif imposé par le partenaire, y compris la livraison offerte", () => {
    const offert = engine.quote({ service: service("food_delivery"), route: route(), tension: 2, partnerFee: 0 });
    expect(offert.amount).toBe(0);
    expect(offert.surge).toBe(1);
    expect(offert.reasons[0]).toContain("offerte");

    const impose = engine.quote({ service: service("food_delivery"), route: route(), tension: 2, partnerFee: 750 });
    expect(impose.amount).toBe(750);
    expect(impose.commission).toBe(75);
  });

  it("facture l'attente quand le métier le prévoit", () => {
    const q = engine.quote({
      service: service("food_delivery"),
      route: route(),
      tension: 1,
      waitingMinutes: 10,
    });
    expect(q.breakdown.some((b) => b.label.startsWith("Attente"))).toBe(true);
  });

  it("relève au tarif minimum les très courtes missions", () => {
    const q = engine.quote({
      service: service("ride_moto"),
      route: route({ distanceMeters: 200, etaMinutes: 2 }),
      tension: 1,
    });
    expect(q.amount).toBeGreaterThanOrEqual(service("ride_moto").pricing.minimum);
  });
});

describe("RouteIntelligenceEngine + CityIntelligenceEngine", () => {
  it("compose préparation, trajet et trafic dans le délai annoncé", async () => {
    const knowledge = emptyKnowledge();
    const city = new CityIntelligenceEngine(knowledge);
    const route = new RouteIntelligenceEngine(knowledge, city);
    const plan = await route.plan({
      service: service("food_delivery"),
      hour: 12,
      pickup: { lat: 12.6392, lng: -8.029 },
      dropoff: { lat: 12.6222, lng: -7.9878 },
      storeId: "s1",
    });
    expect(plan.distanceMeters).toBeGreaterThan(0);
    expect(plan.etaMinutes).toBeGreaterThan(0);
    expect(plan.legs.map((l) => l.label)).toContain("Préparation");
    expect(plan.trafficFactor).toBeGreaterThan(1);
  });

  it("sait estimer une mission sans coordonnées", async () => {
    const knowledge = emptyKnowledge();
    const city = new CityIntelligenceEngine(knowledge);
    const route = new RouteIntelligenceEngine(knowledge, city);
    const plan = await route.plan({ service: service("parcel_delivery"), hour: 9 });
    expect(plan.etaMinutes).toBeGreaterThan(0);
    expect(plan.reasons.join(" ")).toContain("Position non fournie");
  });

  it("ne majore pas quand le quartier n'a pas encore été observé", async () => {
    // Aucun prestataire en ligne + aucune demande apprise : sans garde-fou, la
    // tension exploserait et le client paierait la majoration maximale.
    const city = new CityIntelligenceEngine(emptyKnowledge());
    const pulse = await city.pulse("Sotuba", 21, { availableProviders: 0 });
    expect(pulse.tension).toBeLessThanOrEqual(1.15);
    expect(pulse.reasons.join(" ")).toContain("tension plafonnée");

    const priced = new SmartPricingEngine().quote({
      service: service("food_delivery"),
      route: { distanceMeters: 4000, etaMinutes: 20, legs: [], trafficFactor: 1, reasons: [] },
      tension: pulse.tension,
    });
    expect(priced.surge).toBeLessThanOrEqual(1.06);
  });

  it("n'annonce une préparation apprise qu'une fois confirmée par 5 commandes", async () => {
    const knowledge = emptyKnowledge();
    (knowledge.detail as jest.Mock).mockImplementation(async (scope: string, _k, metric: string, fb: number) =>
      scope === "MERCHANT" && metric === "prep_minutes" ? { value: 3, samples: 1 } : { value: fb, samples: 0 },
    );
    const city = new CityIntelligenceEngine(knowledge);
    const route = new RouteIntelligenceEngine(knowledge, city);
    const plan = await route.plan({
      service: service("food_delivery"),
      hour: 10,
      pickup: { lat: 12.6392, lng: -8.029 },
      dropoff: { lat: 12.6222, lng: -7.9878 },
      storeId: "s1",
    });
    expect(plan.legs.find((l) => l.label === "Préparation")?.minutes).toBe(12);
    expect(plan.reasons.join(" ")).toContain("pas encore assez de commandes");
  });

  it("mesure la tension d'un quartier selon l'offre disponible", async () => {
    const city = new CityIntelligenceEngine(emptyKnowledge());
    const tendu = await city.pulse("Hamdallaye ACI", 19, { availableProviders: 1 });
    const calme = await city.pulse("Hamdallaye ACI", 19, { availableProviders: 20 });
    expect(tendu.tension).toBeGreaterThan(calme.tension);
    expect((await city.peakHours("Hamdallaye ACI")).length).toBe(3);
  });
});

describe("ServiceDecisionEngine", () => {
  const engine = new ServiceDecisionEngine();

  it("retient le candidat le mieux noté et justifie le choix", () => {
    const proche = candidate({ userId: "proche", location: { lat: 12.6392, lng: -8.029 } });
    const loin = candidate({ userId: "loin", profileId: "d2", location: { lat: 12.674, lng: -8.001 } });
    const res = engine.select({
      service: service("food_delivery"),
      candidates: [loin, proche],
      pickup: { lat: 12.6392, lng: -8.029 },
    });
    expect(res.selected?.candidate.userId).toBe("proche");
    expect(res.reasons.join(" ")).toContain("score de compatibilité");
    expect(res.confidence).toBeGreaterThan(0.4);
  });

  it("écarte chaque candidat avec un motif lisible", () => {
    const res = engine.select({
      service: service("home_health"),
      candidates: [
        candidate({ userId: "horsligne", isAvailable: false }),
        candidate({ userId: "sanskyc", kycApproved: false, skills: ["sante", "infirmier"] }),
        candidate({ userId: "sanscompetence", kycApproved: true, trust: 80 }),
      ],
    });
    expect(res.selected).toBeUndefined();
    expect(res.rejected.map((r) => r.reason)).toEqual([
      "Prestataire hors ligne.",
      "Dossier KYC non validé pour ce métier.",
      "Compétence requise absente : sante.",
    ]);
    expect(res.reasons[0]).toContain("Aucun prestataire compatible");
  });

  it("exclut les prestataires hors rayon du métier", () => {
    const res = engine.select({
      service: service("food_delivery"),
      candidates: [candidate({ location: { lat: 12.744, lng: -8.073 } })],
      pickup: { lat: 12.5872, lng: -7.95 },
    });
    expect(res.selected).toBeUndefined();
    expect(res.rejected[0].reason).toContain("Trop loin");
  });

  it("favorise, à qualité égale, le prestataire le moins chargé (équité)", () => {
    const libre = candidate({ userId: "libre", activeMissions: 0 });
    const charge = candidate({ userId: "charge", activeMissions: 4 });
    const res = engine.select({ service: service("food_delivery"), candidates: [charge, libre] });
    expect(res.selected?.candidate.userId).toBe("libre");
  });

  it("note une mission du point de vue du prestataire", () => {
    const scored = engine.scoreForProvider({
      service: service("food_delivery"),
      candidate: candidate(),
      pickup: { lat: 12.6392, lng: -8.029 },
    });
    expect(scored.eligible).toBe(true);
    expect(scored.score).toBeGreaterThan(0);

    const refuse = engine.scoreForProvider({
      service: service("food_delivery"),
      candidate: candidate({ isAvailable: false }),
    });
    expect(refuse.eligible).toBe(false);
    expect(refuse.reasons[0]).toContain("hors ligne");
  });
});

describe("BatchEngine", () => {
  const engine = new BatchEngine();
  const base = {
    id: "m1",
    storeId: "s1",
    pickup: { lat: 12.6392, lng: -8.029 },   // Hamdallaye ACI
    dropoff: { lat: 12.6222, lng: -7.9878 }, // Badalabougou
    createdAt: new Date(),
  };

  it("refuse le regroupement quand le métier l'interdit", () => {
    const res = engine.evaluate({ service: service("ride_moto"), mission: base, open: [] });
    expect(res.beneficial).toBe(false);
    expect(res.reasons[0]).toContain("interdit le regroupement");
  });

  it("ne regroupe pas sans mission voisine", () => {
    const res = engine.evaluate({ service: service("food_delivery"), mission: base, open: [] });
    expect(res.grouped).toEqual([]);
    expect(res.reasons[0]).toContain("Aucune mission voisine");
  });

  it("regroupe deux missions du même commerce vers le même secteur", () => {
    const voisine = {
      id: "m2",
      storeId: "s1",
      pickup: { lat: 12.6392, lng: -8.029 },
      dropoff: { lat: 12.623, lng: -7.986 }, // à ~200 m de la première livraison
      createdAt: new Date(),
    };
    const res = engine.evaluate({ service: service("food_delivery"), mission: base, open: [voisine] });
    expect(res.beneficial).toBe(true);
    expect(res.grouped.map((g) => g.id)).toEqual(["m1", "m2"]);
    expect(res.savedMeters).toBeGreaterThan(0);
  });

  it("ignore une mission trop ancienne (le premier client attendrait)", () => {
    const vieille = { ...base, id: "m3", createdAt: new Date(Date.now() - 60 * 60_000) };
    const res = engine.evaluate({ service: service("food_delivery"), mission: base, open: [vieille] });
    expect(res.beneficial).toBe(false);
  });
});

describe("TrustEngine", () => {
  it("part d'un score neutre et récompense les missions réussies", () => {
    expect(TrustEngine.compute({ missions: 0, successes: 0, cancellations: 0, incidents: 0 })).toBe(50);
    const bon = TrustEngine.compute({ missions: 40, successes: 40, cancellations: 0, incidents: 0 });
    const mauvais = TrustEngine.compute({ missions: 40, successes: 20, cancellations: 18, incidents: 2 });
    expect(bon).toBeGreaterThan(mauvais);
    expect(bon).toBeLessThanOrEqual(100);
    expect(mauvais).toBeGreaterThanOrEqual(0);
  });

  it("qualifie le niveau de confiance", () => {
    expect(TrustEngine.levelOf(50, 1)).toBe("NOUVEAU");
    expect(TrustEngine.levelOf(20, 10)).toBe("À SURVEILLER");
    expect(TrustEngine.levelOf(90, 10)).toBe("EXCELLENT");
    expect(TrustEngine.levelOf(70, 10)).toBe("CONFIRMÉ");
    expect(TrustEngine.levelOf(50, 10)).toBe("FIABLE");
  });

  it("lit et met à jour le score en base", async () => {
    const rows: any = {};
    const prisma = {
      trustScore: {
        findUnique: jest.fn(async ({ where }: any) => rows[where.subjectId_subjectType.subjectId] ?? null),
        upsert: jest.fn(async ({ create, update, where }: any) => {
          const id = where.subjectId_subjectType.subjectId;
          rows[id] = { subjectId: id, subjectType: "DRIVER", ...(rows[id] ? update : create) };
          return rows[id];
        }),
      },
    } as any;
    const engine = new TrustEngine(prisma);
    expect((await engine.profile("u1", "DRIVER")).score).toBe(50);
    const after = await engine.record("u1", "DRIVER", "SUCCESS");
    expect(after.missions).toBe(1);
    expect(await engine.scoreOf("u1", "DRIVER")).toBeGreaterThan(50);
  });

  it("reste silencieux si la base est indisponible", async () => {
    const prisma = { trustScore: { findUnique: jest.fn().mockRejectedValue(new Error("db")) } } as any;
    const engine = new TrustEngine(prisma);
    expect((await engine.profile("u1", "CUSTOMER")).score).toBe(50);
  });
});

describe("FraudEngine", () => {
  const prismaWith = (over: any = {}) =>
    ({
      mission: { count: jest.fn().mockResolvedValue(0), ...over.mission },
      user: { findUnique: jest.fn().mockResolvedValue({ createdAt: new Date(2020, 0, 1) }) },
      fraudSignal: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
      ...over,
    }) as any;

  it("ne signale rien sur un comportement normal", async () => {
    const engine = new FraudEngine(prismaWith());
    const res = await engine.assess({
      clientId: "u1", service: service("food_delivery"), clientTrust: 70, amount: 5000,
    });
    expect(res.risk).toBe("LOW");
    expect(res.blocked).toBe(false);
    expect(res.reasons[0]).toContain("Aucun comportement anormal");
  });

  it("détecte une cadence anormale et un abus d'annulation", async () => {
    const prisma = prismaWith({
      mission: { count: jest.fn().mockResolvedValueOnce(12).mockResolvedValueOnce(8).mockResolvedValueOnce(10) },
    });
    const engine = new FraudEngine(prisma);
    const res = await engine.assess({
      clientId: "u1", service: service("food_delivery"), clientTrust: 40, amount: 1000,
    });
    expect(res.signals.map((s) => s.kind)).toEqual(expect.arrayContaining(["VELOCITY", "CANCEL_ABUSE"]));
    expect(res.risk).toBe("HIGH");
    expect(prisma.fraudSignal.create).toHaveBeenCalled();
  });

  it("surveille les gros montants en espèces sur un compte neuf", async () => {
    const prisma = prismaWith({
      user: { findUnique: jest.fn().mockResolvedValue({ createdAt: new Date() }) },
    });
    const engine = new FraudEngine(prisma);
    const res = await engine.assess({
      clientId: "u1", service: service("parcel_delivery"), clientTrust: 30,
      amount: 150_000, paymentMethod: "CASH",
    });
    expect(res.signals.map((s) => s.kind)).toEqual(
      expect.arrayContaining(["PAYMENT_RISK", "DUPLICATE_ACCOUNT"]),
    );
  });
});

describe("LearningEngine", () => {
  it("réinjecte le délai réel dans le livre de connaissances", async () => {
    const knowledge = emptyKnowledge();
    const trust = { record: jest.fn().mockResolvedValue({}) } as any;
    const decisions = { record: jest.fn().mockResolvedValue("dec-1") } as any;
    const engine = new LearningEngine(knowledge, trust, decisions);

    const res = await engine.learn({
      missionId: "m1",
      serviceKey: "food_delivery",
      zone: "Hamdallaye ACI",
      storeId: "s1",
      clientId: "c1",
      providerId: "p1",
      providerKind: "DRIVER",
      predictedMinutes: 25,
      actualMinutes: 31,
      slaMinutes: 45,
      trafficFactor: 1.2,
      hour: 19,
      amount: 1500,
      status: "COMPLETED",
    });

    expect(res.etaErrorMinutes).toBe(6);
    expect(knowledge.observe).toHaveBeenCalledWith("SERVICE", "food_delivery", "avg_minutes", 31);
    expect(trust.record).toHaveBeenCalledWith("p1", "DRIVER", "SUCCESS");
    expect(decisions.record).toHaveBeenCalledWith(expect.objectContaining({ kind: "LEARNING" }));
  });

  it("apprend aussi des annulations", async () => {
    const knowledge = emptyKnowledge();
    const trust = { record: jest.fn().mockResolvedValue({}) } as any;
    const decisions = { record: jest.fn().mockResolvedValue(null) } as any;
    const engine = new LearningEngine(knowledge, trust, decisions);
    const res = await engine.learn({
      missionId: "m2", serviceKey: "food_delivery", clientId: "c1", status: "CANCELLED",
    });
    expect(res.etaErrorMinutes).toBeNull();
    expect(trust.record).toHaveBeenCalledWith("c1", "CUSTOMER", "CANCELLED");
  });
});
