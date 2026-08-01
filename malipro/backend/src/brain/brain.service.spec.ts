import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { BrainService } from "./brain.service";
import { KnowledgeService } from "./knowledge.service";
import { DecisionLogService } from "./decision-log.service";
import { ServiceRegistryService } from "./service-registry.service";
import { CityIntelligenceEngine } from "./engines/city-intelligence.engine";
import { RouteIntelligenceEngine } from "./engines/route-intelligence.engine";
import { SmartPricingEngine } from "./engines/smart-pricing.engine";
import { ServiceDecisionEngine } from "./engines/service-decision.engine";
import { BatchEngine } from "./engines/batch.engine";
import { TrustEngine } from "./engines/trust.engine";
import { FraudEngine } from "./engines/fraud.engine";
import { LearningEngine } from "./engines/learning.engine";
import { fakePrisma } from "./fake-prisma";

const STORE = { id: "s1", merchantId: "mch1", name: "Chez Fatou", lat: 12.6392, lng: -8.029, deliveryFee: 500 };
const DRIVER_PROCHE = {
  id: "d1", userId: "livreur1", isAvailable: true, rating: 4.8, totalDeliveries: 210,
  kycStatus: "APPROVED", vehicleType: "moto", lastLat: 12.6395, lastLng: -8.0295,
  user: { firstName: "Moussa", lastName: "T." },
};
const DRIVER_LOIN = {
  id: "d2", userId: "livreur2", isAvailable: true, rating: 4.2, totalDeliveries: 30,
  kycStatus: "APPROVED", vehicleType: "moto", lastLat: 12.674, lastLng: -8.001,
  user: { firstName: "Awa", lastName: "K." },
};

function build(seed: Record<string, any[]> = {}) {
  const prisma = fakePrisma(seed);
  const knowledge = new KnowledgeService(prisma);
  const decisions = new DecisionLogService(prisma);
  const registry = new ServiceRegistryService(prisma);
  const city = new CityIntelligenceEngine(knowledge);
  const trust = new TrustEngine(prisma);
  const bus = { publish: jest.fn(), subscribe: jest.fn() } as any;
  const realtime = { emitToUsers: jest.fn(), emitTracking: jest.fn() } as any;
  const brain = new BrainService(
    prisma,
    bus,
    realtime,
    registry,
    knowledge,
    decisions,
    city,
    new RouteIntelligenceEngine(knowledge, city),
    new SmartPricingEngine(),
    new ServiceDecisionEngine(),
    new BatchEngine(),
    trust,
    new FraudEngine(prisma),
    new LearningEngine(knowledge, trust, decisions),
    // Voix stubbée : l'annonce est testée dans src/voice-dispatch.
    { announce: jest.fn().mockResolvedValue({ id: "ann-1", skipped: false }) } as any,
  );
  return { brain, prisma, bus, realtime, registry };
}

describe("BrainService — observer, comprendre, décider", () => {
  it("expose le catalogue des métiers pilotés par le Brain", async () => {
    const { brain } = build();
    const services = await brain.services();
    expect(services.map((s) => s.key)).toEqual(
      expect.arrayContaining(["food_delivery", "plumber", "ride_moto", "home_health"]),
    );
    expect(services.every((s) => s.slaMinutes > 0)).toBe(true);
  });

  it("déclare un nouveau métier par configuration, sans toucher au code (principe n°6)", async () => {
    const { brain, registry } = build();
    await registry.upsert({
      key: "painter",
      label: "Peintre en bâtiment",
      family: "HOME_SERVICE",
      providerKind: "ARTISAN",
      skills: ["peinture"],
      pricing: { base: 3000, perKm: 100, perMinute: 50, minimum: 5000, surgeMax: 1.2, commissionPercent: 12 },
      constraints: { maxRadiusKm: 20, slaMinutes: 180, maxBatch: 1 },
    });
    const services = await brain.services();
    const painter = services.find((s) => s.key === "painter");
    expect(painter).toBeDefined();
    expect(painter?.fromDatabase).toBe(true);
  });

  it("produit un devis explicable et le journalise", async () => {
    const { brain, prisma } = build({ store: [STORE] });
    const quote = await brain.quote({
      orderType: "FOOD",
      storeId: "s1",
      subtotal: 6000,
      clientId: "client1",
      dropoff: { lat: 12.6222, lng: -7.9878 },
      partnerFee: null,
    });
    expect(quote.serviceKey).toBe("food_delivery");
    expect(quote.price.amount).toBeGreaterThan(0);
    expect(quote.etaMinutes).toBeGreaterThan(0);
    expect(quote.reasons.length).toBeGreaterThan(2);
    expect(Object.keys(quote.balance)).toEqual(["client", "provider", "partner", "novigo"]);
    expect(prisma.brainDecision.rows).toHaveLength(1);
    expect(prisma.brainDecision.rows[0].kind).toBe("PRICING");
    expect(quote.decisionId).toBe(prisma.brainDecision.rows[0].id);
  });

  it("respecte le tarif du partenaire quand la boutique en impose un", async () => {
    const { brain } = build({ store: [STORE] });
    const quote = await brain.quote({ orderType: "FOOD", storeId: "s1", partnerFee: 500, clientId: "c1" });
    expect(quote.price.amount).toBe(500);
    expect(quote.commission).toBe(50);
  });

  it("applique d'office le tarif de la boutique, même sans le lui passer", async () => {
    // Le devis affiché au client doit être CELUI qui sera facturé.
    const { brain } = build({ store: [STORE] });
    const quote = await brain.quote({ orderType: "FOOD", storeId: "s1", clientId: "c1" });
    expect(quote.price.amount).toBe(STORE.deliveryFee);
    expect(quote.breakdown).toEqual([{ label: "Livraison partenaire", amount: 500 }]);
  });

  it("explique une décision a posteriori (principe n°3)", async () => {
    const { brain } = build({ store: [STORE] });
    const quote = await brain.quote({ orderType: "FOOD", storeId: "s1", clientId: "c1" });
    const explained = await brain.explain(quote.decisionId!);
    expect(explained.engine).toBe("SmartPricingEngine");
    expect(explained.reasons.length).toBeGreaterThan(0);
    await expect(brain.explain("inconnu")).rejects.toThrow(NotFoundException);
  });
});

describe("BrainService — exécuter", () => {
  it("crée une mission puis l'attribue au prestataire le mieux noté", async () => {
    const { brain, prisma, bus, realtime } = build({
      store: [STORE],
      driver: [DRIVER_LOIN, DRIVER_PROCHE],
    });
    const mission = await brain.createMission({
      clientId: "client1",
      orderType: "FOOD",
      storeId: "s1",
      dropoff: { lat: 12.6222, lng: -7.9878 },
      subtotal: 5000,
      paymentMethod: "CASH",
      partnerFee: 500,
    });

    expect(mission.reference).toMatch(/^NVG-M-\d{4}-\d{6}$/);
    expect(mission.status).toBe("ASSIGNED");
    expect(mission.providerId).toBe("livreur1"); // le plus proche et le mieux noté
    expect(prisma.missionEvent.rows.map((e: any) => e.type)).toEqual(
      expect.arrayContaining(["MissionCreated", "MissionAssigned"]),
    );
    expect(prisma.brainDecision.rows.map((d: any) => d.kind)).toEqual(
      expect.arrayContaining(["PRICING", "FRAUD", "ASSIGNMENT"]),
    );
    expect(realtime.emitToUsers).toHaveBeenCalledWith(
      ["livreur1"], "mission.assigned", expect.objectContaining({ reference: mission.reference }),
    );
    expect(bus.publish).toHaveBeenCalledWith("mission.created", expect.any(Object));
    expect(bus.publish).toHaveBeenCalledWith("mission.assigned", expect.any(Object));
  });

  it("met la mission en attente quand aucun prestataire n'est compatible", async () => {
    const { brain } = build({ store: [STORE], driver: [{ ...DRIVER_PROCHE, isAvailable: false }] });
    const mission = await brain.createMission({ clientId: "c1", orderType: "FOOD", storeId: "s1" });
    expect(mission.status).toBe("DISPATCHING");
    expect(mission.providerId).toBeFalsy();
  });

  it("bloque une mission au comportement frauduleux", async () => {
    const now = new Date();
    const missions = Array.from({ length: 12 }, (_, i) => ({
      id: `m${i}`, clientId: "fraudeur", status: "CANCELLED", createdAt: now, serviceKey: "food_delivery",
    }));
    const { brain } = build({ mission: missions, user: [{ id: "fraudeur", createdAt: now }] });
    await expect(
      brain.createMission({
        clientId: "fraudeur",
        orderType: "PARCEL",
        subtotal: 200_000,
        paymentMethod: "CASH",
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("déroule le cycle accepter → démarrer → terminer et apprend du délai réel", async () => {
    const { brain, prisma, bus } = build({ store: [STORE], driver: [DRIVER_PROCHE] });
    const mission = await brain.createMission({
      clientId: "client1", orderType: "FOOD", storeId: "s1", partnerFee: 500,
      dropoff: { lat: 12.6222, lng: -7.9878 },
    });

    expect((await brain.acceptMission(mission.id, "livreur1")).status).toBe("ACCEPTED");
    expect((await brain.startMission(mission.id, "livreur1")).status).toBe("IN_PROGRESS");
    const done = await brain.completeMission(mission.id, "livreur1");

    expect(done.status).toBe("COMPLETED");
    expect(done.actualMinutes).toBeGreaterThanOrEqual(1);
    expect(done.learning.reasons.join(" ")).toContain("mémorisé");
    // Livre de connaissances alimenté + confiance mise à jour.
    expect(prisma.knowledgeEntry.rows.length).toBeGreaterThan(0);
    expect(prisma.trustScore.rows.map((t: any) => t.subjectType)).toEqual(
      expect.arrayContaining(["CUSTOMER", "DRIVER"]),
    );
    expect(bus.publish).toHaveBeenCalledWith("mission.completed", expect.any(Object));
  });

  it("refuse qu'un prestataire prenne la mission d'un autre", async () => {
    const { brain } = build({ store: [STORE], driver: [DRIVER_PROCHE] });
    const mission = await brain.createMission({ clientId: "c1", orderType: "FOOD", storeId: "s1" });
    await expect(brain.acceptMission(mission.id, "intrus")).rejects.toThrow(ForbiddenException);
    await expect(brain.startMission(mission.id, "intrus")).rejects.toThrow(ForbiddenException);
  });

  it("apprend aussi des annulations", async () => {
    const { brain, prisma } = build({ store: [STORE] });
    const mission = await brain.createMission({ clientId: "c1", orderType: "FOOD", storeId: "s1" });
    const cancelled = await brain.cancelMission(mission.id, "Client injoignable", "c1");
    expect(cancelled.status).toBe("CANCELLED");
    expect(prisma.missionEvent.rows.some((e: any) => e.type === "MissionCancelled")).toBe(true);
    await expect(brain.get("inconnue")).rejects.toThrow(NotFoundException);
  });
});

describe("BrainService — service du domaine ops", () => {
  it("transforme une commande en mission sans la bloquer en cas d'échec", async () => {
    const { brain, prisma } = build({ store: [STORE], driver: [DRIVER_PROCHE] });
    const mission = await brain.onOrderCreated({
      id: "order-1", reference: "MLP-2026-000100", customerId: "client1", storeId: "s1",
      type: "FOOD", subtotal: 4000, deliveryFee: 500, paymentMethod: "WAVE", zone: "Badalabougou",
    });
    expect(mission?.orderId).toBe("order-1");
    // Pas de dispatch immédiat : le livreur est choisi quand la commande est prête.
    expect(mission?.status).toBe("PENDING");

    await brain.onDeliveryAccepted("order-1", "livreur1");
    await brain.onDeliveryStarted("order-1", "livreur1");
    const completed = await brain.onDeliveryCompleted("order-1", "livreur1");
    expect(completed?.status).toBe("COMPLETED");
    expect(prisma.mission.rows[0].actualMinutes).toBeGreaterThanOrEqual(1);

    // Commande sans mission : aucune erreur remontée au domaine ops.
    expect(await brain.onDeliveryCompleted("order-inconnu")).toBeNull();
  });

  it("annule la mission liée quand la commande est annulée", async () => {
    const { brain } = build({ store: [STORE] });
    await brain.onOrderCreated({
      id: "order-2", reference: "MLP-2026-000101", customerId: "c1", storeId: "s1",
      type: "FOOD", subtotal: 1000, deliveryFee: 0,
    });
    const cancelled = await brain.onOrderCancelled("order-2", "Annulation client");
    expect(cancelled?.status).toBe("CANCELLED");
  });
});

describe("BrainService — côté prestataire", () => {
  it("classe les missions ouvertes pour le livreur avec les raisons", async () => {
    const { brain } = build({ store: [STORE], driver: [DRIVER_PROCHE] });
    await brain.createMission({
      clientId: "c1", orderType: "FOOD", storeId: "s1", autoDispatch: false,
    });
    await brain.createMission({
      clientId: "c2", orderType: "PARCEL", pickup: { lat: 12.744, lng: -8.073 }, autoDispatch: false,
    });

    const offers = await brain.openMissionsFor("livreur1");
    expect(offers.length).toBe(2);
    expect(offers[0].score).toBeGreaterThanOrEqual(offers[1].score);
    expect(offers[0].reasons.length).toBeGreaterThan(0);
    await expect(brain.openMissionsFor("inconnu")).rejects.toThrow(ForbiddenException);
  });

  it("montre au prestataire la mission qui vient de lui être attribuée", async () => {
    const { brain } = build({ store: [STORE], driver: [DRIVER_PROCHE] });
    const mission = await brain.createMission({ clientId: "c1", orderType: "FOOD", storeId: "s1" });
    expect(mission.status).toBe("ASSIGNED");
    const offers = await brain.openMissionsFor("livreur1");
    expect(offers.map((o) => o.id)).toContain(mission.id);
  });

  it("regroupe aussi des missions déjà attribuées mais non démarrées", async () => {
    const { brain } = build({ store: [STORE], driver: [DRIVER_PROCHE] });
    const m1 = await brain.createMission({
      clientId: "c1", orderType: "FOOD", storeId: "s1", dropoff: { lat: 12.6222, lng: -7.9878 },
    });
    await brain.createMission({
      clientId: "c2", orderType: "FOOD", storeId: "s1", dropoff: { lat: 12.623, lng: -7.986 },
    });
    // Les deux sont passées en ASSIGNED par l'attribution automatique.
    const proposal = await brain.batchFor(m1.id);
    expect(proposal.beneficial).toBe(true);
    expect(proposal.grouped).toHaveLength(2);
  });

  it("note un lot de courses libres pour un livreur donné", async () => {
    const { brain } = build({ driver: [DRIVER_PROCHE] });
    const scores = await brain.scoreOffersFor("livreur1", [
      { id: "dl1", serviceKey: "food_delivery", pickup: { lat: 12.6392, lng: -8.029 } },
      { id: "dl2", serviceKey: "food_delivery", pickup: { lat: 12.744, lng: -8.073 } },
    ]);
    expect(scores.get("dl1")!.score).toBeGreaterThan(0);
    expect(scores.get("dl2")!.eligible).toBe(false); // hors rayon du métier
    expect(await brain.scoreOffersFor("inconnu", [{ id: "x", serviceKey: "food_delivery" }])).toEqual(new Map());
    expect(await brain.scoreOffersFor("livreur1", [])).toEqual(new Map());
  });

  it("propose un regroupement quand tout le monde y gagne", async () => {
    const { brain, prisma } = build({ store: [STORE] });
    const m1 = await brain.createMission({
      clientId: "c1", orderType: "FOOD", storeId: "s1",
      dropoff: { lat: 12.6222, lng: -7.9878 }, autoDispatch: false,
    });
    await brain.createMission({
      clientId: "c2", orderType: "FOOD", storeId: "s1",
      dropoff: { lat: 12.623, lng: -7.986 }, autoDispatch: false,
    });
    const proposal = await brain.batchFor(m1.id);
    expect(proposal.beneficial).toBe(true);
    expect(proposal.batchId).toContain("BATCH-");
    expect(prisma.brainDecision.rows.some((d: any) => d.kind === "BATCH")).toBe(true);
    expect((await brain.missionDecisions(m1.id)).length).toBeGreaterThan(0);
  });
});

describe("BrainService — intelligence de la ville et tableaux de bord", () => {
  it("conseille le commerçant à partir de ce qui a été appris de lui", async () => {
    const { brain } = build({
      merchant: [{ id: "mch1", userId: "marchand1", businessName: "Chez Fatou", stores: [STORE] }],
      store: [STORE],
    });
    const insights = await brain.merchantInsights("marchand1");
    expect(insights.storeId).toBe("s1");
    expect(insights.zone).toBe("Hamdallaye ACI");
    expect(insights.peakHours.length).toBe(3);
    expect(insights.advice.length).toBeGreaterThan(0);
  });

  it("restitue la pulsation de la ville et le tableau de bord du Brain", async () => {
    const { brain } = build({ store: [STORE], driver: [DRIVER_PROCHE] });
    await brain.createMission({ clientId: "c1", orderType: "FOOD", storeId: "s1" });

    const city = await brain.cityInsights("Hamdallaye ACI");
    expect(city.pulse.zone).toBe("Hamdallaye ACI");
    expect(city.knowledge.entries).toBeGreaterThan(0);

    const dashboard = await brain.dashboard();
    expect(dashboard.missions).toBe(1);
    expect(dashboard.engines).toHaveLength(8);
    expect(dashboard.byStatus[0]).toHaveProperty("status");

    const trust = await brain.trustOf("c1", "CUSTOMER");
    expect(trust.score).toBe(50);
    expect((await brain.listMine("c1")).length).toBe(1);
  });
});
