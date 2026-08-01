import { NotFoundException } from "@nestjs/common";
import { KnowledgeService } from "./knowledge.service";
import { DecisionLogService } from "./decision-log.service";
import { ServiceRegistryService } from "./service-registry.service";
import { fakePrisma } from "./fake-prisma";

describe("KnowledgeService — Livre de Connaissances", () => {
  it("renvoie la valeur de repli tant que rien n'a été observé", async () => {
    const knowledge = new KnowledgeService(fakePrisma());
    expect(await knowledge.get("ZONE", "Sotuba", "avg_minutes", 30)).toBe(30);
    expect(await knowledge.detail("ZONE", "Sotuba", "avg_minutes", 30)).toEqual({ value: 30, samples: 0 });
  });

  it("apprend par moyenne glissante : vite au début, sans sur-réagir ensuite", async () => {
    const knowledge = new KnowledgeService(fakePrisma());
    const first = await knowledge.observe("SERVICE", "food_delivery", "avg_minutes", 20);
    expect(first).toEqual({ value: 20, samples: 1 });

    const second = await knowledge.observe("SERVICE", "food_delivery", "avg_minutes", 40);
    expect(second.value).toBe(30); // moyenne des deux
    expect(second.samples).toBe(2);

    for (let i = 0; i < 40; i++) await knowledge.observe("SERVICE", "food_delivery", "avg_minutes", 30);
    const stable = await knowledge.observe("SERVICE", "food_delivery", "avg_minutes", 120);
    expect(stable.value).toBeLessThan(35); // une mission isolée ne déforme plus la moyenne
  });

  it("compte les demandes, expose profils, classements et volume appris", async () => {
    const knowledge = new KnowledgeService(fakePrisma());
    await knowledge.increment("ZONE", "Hamdallaye ACI", "demand_h19");
    await knowledge.increment("ZONE", "Hamdallaye ACI", "demand_h19");
    await knowledge.observe("ZONE", "Hamdallaye ACI", "avg_minutes", 28);

    const profile = await knowledge.profile("ZONE", "Hamdallaye ACI");
    expect(profile["demand_h19"].value).toBe(2);
    expect((await knowledge.top("ZONE", "avg_minutes")).length).toBe(1);
    expect((await knowledge.stats()).entries).toBe(2);
  });

  it("continue d'apprendre en mémoire si la base est indisponible", async () => {
    const prisma = {
      knowledgeEntry: {
        findUnique: jest.fn().mockRejectedValue(new Error("db down")),
        upsert: jest.fn().mockRejectedValue(new Error("db down")),
        findMany: jest.fn().mockRejectedValue(new Error("db down")),
        count: jest.fn().mockRejectedValue(new Error("db down")),
        aggregate: jest.fn().mockRejectedValue(new Error("db down")),
      },
    } as any;
    const knowledge = new KnowledgeService(prisma);
    expect(await knowledge.get("ZONE", "x", "m", 12)).toBe(12);
    expect((await knowledge.observe("ZONE", "x", "m", 20)).value).toBe(20);
    expect((await knowledge.observe("ZONE", "x", "m", 30)).value).toBe(25);
    await knowledge.increment("ZONE", "x", "m");
    expect(await knowledge.top("ZONE", "m")).toEqual([]);
    expect(await knowledge.profile("ZONE", "x")).toEqual({});
    expect(await knowledge.stats()).toEqual({ entries: 0, observations: 0 });
  });
});

describe("DecisionLogService — journal explicable", () => {
  it("enregistre puis restitue une décision complète", async () => {
    const prisma = fakePrisma();
    const log = new DecisionLogService(prisma);
    const id = await log.record({
      kind: "ASSIGNMENT",
      engine: "ServiceDecisionEngine",
      missionId: "m1",
      input: { candidates: 3 },
      output: { providerId: "u1" },
      reasons: ["Le plus proche et le mieux noté."],
      score: 82,
      balance: { client: 90, provider: 80, partner: 85, novigo: 50 },
    });
    expect(id).toBeTruthy();
    const explained = await log.explain(id!);
    expect(explained.reasons[0]).toContain("mieux noté");
    expect((await log.forMission("m1")).length).toBe(1);
    expect((await log.list({ kind: "ASSIGNMENT" })).length).toBe(1);
    await expect(log.explain("nope")).rejects.toThrow(NotFoundException);
  });

  it("n'interrompt jamais une mission si le journal est indisponible", async () => {
    const prisma = { brainDecision: { create: jest.fn().mockRejectedValue(new Error("db")) } } as any;
    const log = new DecisionLogService(prisma);
    expect(
      await log.record({ kind: "PRICING", engine: "SmartPricingEngine", input: {}, output: {}, reasons: [] }),
    ).toBeNull();
  });
});

describe("ServiceRegistryService — configuration des métiers", () => {
  it("retombe sur le catalogue compilé si la table est illisible", async () => {
    const prisma = { servicePolicy: { findMany: jest.fn().mockRejectedValue(new Error("db")) } } as any;
    const registry = new ServiceRegistryService(prisma);
    const food = await registry.get("food_delivery");
    expect(food.fromDatabase).toBe(false);
    await expect(registry.get("metier_inexistant")).rejects.toThrow(NotFoundException);
  });

  it("la configuration en base prime sur les valeurs par défaut", async () => {
    const prisma = fakePrisma();
    const registry = new ServiceRegistryService(prisma);
    await registry.upsert({
      key: "food_delivery",
      label: "Livraison de repas (Bamako)",
      family: "DELIVERY",
      pricing: { base: 900 },
      constraints: { slaMinutes: 35 },
    });
    const food = await registry.get("food_delivery");
    expect(food.label).toBe("Livraison de repas (Bamako)");
    expect(food.pricing.base).toBe(900);
    expect(food.pricing.perKm).toBe(150); // valeur du catalogue conservée
    expect(food.constraints.slaMinutes).toBe(35);
    expect(food.fromDatabase).toBe(true);
  });

  it("met en cache puis se laisse invalider", async () => {
    const prisma = fakePrisma();
    const registry = new ServiceRegistryService(prisma);
    await registry.all();
    await registry.all();
    expect(prisma.servicePolicy.findMany).toHaveBeenCalledTimes(1);
    registry.invalidate();
    await registry.all();
    expect(prisma.servicePolicy.findMany).toHaveBeenCalledTimes(2);
  });
});
