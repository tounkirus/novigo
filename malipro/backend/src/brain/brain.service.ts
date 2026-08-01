import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { EventBusService } from "../common/events/event-bus.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
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
import { VoiceDispatchService } from "../voice-dispatch/voice-dispatch.service";
import { normalizeSkill, serviceKeyForOrderType, skillsForProfession } from "./service-catalog";
import { BalanceScore, GeoPoint, ProviderCandidate, ServiceRuntime } from "./brain.types";
import { clamp, zoneCenter, zoneOf } from "./geo";

/// Résultat d'un devis Brain, tel que les applications l'affichent.
export interface BrainQuote {
  serviceKey: string;
  serviceLabel: string;
  price: { amount: number; currency: string };
  breakdown: { label: string; amount: number }[];
  etaMinutes: number;
  distanceMeters: number;
  surge: number;
  commission: number;
  providerPayout: number;
  zone: string;
  reasons: string[];
  balance: BalanceScore;
  decisionId: string | null;
}

/// NOVIGO BRAIN — orchestrateur des cinq missions fondamentales :
/// observer → comprendre → décider → exécuter → apprendre.
///
/// Le Brain décide, les applications exécutent (principes n°1 et n°2). Aucune
/// application (web, Android, iOS) ne recalcule un prix, un délai ou une
/// attribution : elles affichent ce que ce service a décidé, avec ses raisons.
@Injectable()
export class BrainService implements OnModuleInit {
  private readonly logger = new Logger("Brain");

  constructor(
    private prisma: PrismaService,
    private bus: EventBusService,
    private realtime: RealtimeGateway,
    private registry: ServiceRegistryService,
    private knowledge: KnowledgeService,
    private decisions: DecisionLogService,
    private city: CityIntelligenceEngine,
    private route: RouteIntelligenceEngine,
    private pricing: SmartPricingEngine,
    private decision: ServiceDecisionEngine,
    private batch: BatchEngine,
    private trust: TrustEngine,
    private fraud: FraudEngine,
    private learning: LearningEngine,
    // Annonce vocale : le prestataire est prévenu sans regarder son écran.
    private voice: VoiceDispatchService,
  ) {}

  /// Architecture événementielle (principe n°7) : le Brain écoute le domaine
  /// finance (Spring) et enrichit la mission sans que personne ne l'appelle.
  async onModuleInit(): Promise<void> {
    await this.bus.subscribe(
      "novigo.brain",
      ["payment.confirmed", "payment.failed"],
      async (routingKey, data) => {
        const orderId = data?.orderId ?? data?.reference;
        if (!orderId) return;
        const mission = await this.prisma.mission
          .findFirst({ where: { OR: [{ orderId }, { reference: String(orderId) }] } })
          .catch(() => null);
        if (!mission) return;
        await this.appendEvent(
          mission.id,
          routingKey === "payment.confirmed" ? "PaymentConfirmed" : "PaymentFailed",
          null,
          data,
        );
        this.logger.log(`[${routingKey}] mission ${mission.reference} enrichie.`);
      },
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. OBSERVER + 2. COMPRENDRE + 3. DÉCIDER — le devis
  // ───────────────────────────────────────────────────────────────────────────

  /// Catalogue des métiers pilotés par le Brain (configuration, principe n°6).
  async services() {
    const all = await this.registry.all();
    return all.map((s) => ({
      key: s.key,
      label: s.label,
      family: s.family,
      providerKind: s.providerKind,
      skills: s.skills,
      slaMinutes: s.constraints.slaMinutes,
      maxBatch: s.constraints.maxBatch,
      fromDatabase: s.fromDatabase,
    }));
  }

  /// Tarif juste + délai estimé + explication, pour n'importe quel service.
  async quote(input: {
    serviceKey?: string;
    orderType?: string;
    pickup?: GeoPoint;
    dropoff?: GeoPoint;
    zone?: string;
    storeId?: string;
    subtotal?: number;
    itemsCount?: number;
    waitingMinutes?: number;
    clientId?: string;
    /// Tarif imposé par le partenaire (le Brain l'explique au lieu de l'écraser).
    partnerFee?: number | null;
    at?: Date;
  }): Promise<BrainQuote> {
    const started = Date.now();
    const service = await this.registry.get(input.serviceKey ?? serviceKeyForOrderType(input.orderType));
    const now = input.at ?? new Date();
    const hour = now.getHours();

    // Tarif partenaire : si la mission part d'une boutique, c'est SON tarif de
    // livraison qui prime — exactement comme à la création de commande. Sans cette
    // résolution, un devis affiché au client (750) pouvait différer du montant
    // réellement facturé (1000). Le tarif n'est JAMAIS dicté par l'appelant.
    const partnerFee =
      input.partnerFee !== undefined
        ? input.partnerFee
        : input.storeId
          ? await this.storeDeliveryFee(input.storeId)
          : null;

    // Observer : d'où part la mission, où va-t-elle, dans quelle ville, à quelle heure.
    const pickup = input.pickup ?? (await this.storeLocation(input.storeId));
    const dropoff = input.dropoff ?? zoneCenter(input.zone ?? null);
    const { zone, city } = zoneOf(dropoff ?? pickup);

    // Comprendre : quelle est la tension de ce quartier maintenant.
    const availableProviders = await this.countAvailableProviders(service);
    const pulse = await this.city.pulse(zone, hour, { availableProviders });

    // Décider : itinéraire d'abord (le prix dépend du chemin, pas l'inverse).
    const plan = await this.route.plan({ service, hour, pickup, dropoff, storeId: input.storeId });
    const clientTrust = input.clientId ? await this.trust.scoreOf(input.clientId, "CUSTOMER") : 50;
    const price = this.pricing.quote({
      service,
      route: plan,
      tension: pulse.tension,
      clientTrust,
      waitingMinutes: input.waitingMinutes,
      subtotal: input.subtotal,
      partnerFee,
    });

    const balance = BrainService.balanceOf({
      etaMinutes: plan.etaMinutes,
      slaMinutes: service.constraints.slaMinutes,
      surge: price.surge,
      amount: price.amount,
      providerPayout: price.providerPayout,
      commission: price.commission,
    });

    const reasons = [...plan.reasons, ...price.reasons, ...pulse.reasons];
    const decisionId = await this.decisions.record({
      kind: "PRICING",
      engine: "SmartPricingEngine",
      engineVersion: SmartPricingEngine.VERSION,
      serviceKey: service.key,
      subjectId: input.clientId ?? null,
      input: { ...input, hour, zone, tension: pulse.tension, partnerFee },
      output: { price, eta: plan.etaMinutes, distanceMeters: plan.distanceMeters },
      reasons,
      score: price.amount,
      confidence: 0.9,
      balance,
      latencyMs: Date.now() - started,
    });

    return {
      serviceKey: service.key,
      serviceLabel: service.label,
      price: { amount: price.amount, currency: price.currency },
      breakdown: price.breakdown,
      etaMinutes: plan.etaMinutes,
      distanceMeters: plan.distanceMeters,
      surge: price.surge,
      commission: price.commission,
      providerPayout: price.providerPayout,
      zone: `${zone}, ${city}`,
      reasons,
      balance,
      decisionId,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. EXÉCUTER — cycle de vie d'une mission
  // ───────────────────────────────────────────────────────────────────────────

  /// Crée une mission (livraison, dépannage, course, soin…) et lance l'attribution.
  async createMission(input: {
    clientId: string;
    serviceKey?: string;
    orderType?: string;
    orderId?: string;
    storeId?: string;
    pickup?: GeoPoint;
    dropoff?: GeoPoint;
    zone?: string;
    subtotal?: number;
    itemsCount?: number;
    paymentMethod?: string | null;
    partnerFee?: number | null;
    scheduledAt?: Date | null;
    payload?: Record<string, unknown>;
    /// Dispatch immédiat (faux pour les commandes qui attendent le commerçant).
    autoDispatch?: boolean;
  }) {
    const service = await this.registry.get(input.serviceKey ?? serviceKeyForOrderType(input.orderType));
    const quote = await this.quote({
      serviceKey: service.key,
      pickup: input.pickup,
      dropoff: input.dropoff,
      zone: input.zone,
      storeId: input.storeId,
      subtotal: input.subtotal,
      itemsCount: input.itemsCount,
      clientId: input.clientId,
      partnerFee: input.partnerFee,
    });

    const clientTrust = await this.trust.scoreOf(input.clientId, "CUSTOMER");
    const risk = await this.fraud.assess({
      clientId: input.clientId,
      service,
      amount: (input.subtotal ?? 0) + quote.price.amount,
      paymentMethod: input.paymentMethod,
      clientTrust,
    });
    await this.decisions.record({
      kind: "FRAUD",
      engine: "FraudEngine",
      engineVersion: FraudEngine.VERSION,
      serviceKey: service.key,
      subjectId: input.clientId,
      input: { paymentMethod: input.paymentMethod, amount: input.subtotal },
      output: risk,
      reasons: risk.reasons,
      confidence: 0.8,
    });
    if (risk.blocked) {
      throw new ForbiddenException(
        "Mission suspendue par le contrôle anti-fraude NOVIGO. Contactez le support.",
      );
    }

    const pickup = input.pickup ?? (await this.storeLocation(input.storeId));
    const dropoff = input.dropoff ?? zoneCenter(input.zone ?? null);
    const { zone, city } = zoneOf(dropoff ?? pickup);
    const reference = await this.nextReference();

    const mission = await this.prisma.mission.create({
      data: {
        reference,
        serviceKey: service.key,
        status: "PENDING",
        clientId: input.clientId,
        orderId: input.orderId ?? null,
        storeId: input.storeId ?? null,
        city,
        zone,
        pickupLat: pickup?.lat ?? null,
        pickupLng: pickup?.lng ?? null,
        dropoffLat: dropoff?.lat ?? null,
        dropoffLng: dropoff?.lng ?? null,
        distanceMeters: quote.distanceMeters,
        etaMinutes: quote.etaMinutes,
        priceAmount: quote.price.amount,
        priority: risk.risk === "LOW" ? 0 : -1,
        scheduledAt: input.scheduledAt ?? null,
        payload: {
          ...(input.payload ?? {}),
          quote: { breakdown: quote.breakdown, surge: quote.surge, reasons: quote.reasons },
          providerPayout: quote.providerPayout,
          commission: quote.commission,
          slaMinutes: service.constraints.slaMinutes,
        } as any,
      },
    });

    await this.appendEvent(mission.id, "MissionCreated", input.clientId, {
      serviceKey: service.key,
      price: quote.price,
      etaMinutes: quote.etaMinutes,
    });
    await this.city.recordDemand(zone, new Date().getHours());
    await this.bus.publish("mission.created", {
      missionId: mission.id,
      reference: mission.reference,
      serviceKey: service.key,
      clientId: input.clientId,
      orderId: input.orderId ?? null,
      amount: quote.price.amount,
      zone,
    });

    if (input.autoDispatch !== false) {
      await this.dispatch(mission.id).catch((e) =>
        this.logger.warn(`dispatch ${mission.reference} différé: ${e.message}`),
      );
    }
    return this.get(mission.id);
  }

  /// Attribue la mission au meilleur prestataire disponible (Service Decision Engine).
  async dispatch(missionId: string) {
    const started = Date.now();
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException("Mission introuvable.");
    const service = await this.registry.get(mission.serviceKey);
    const pickup = mission.pickupLat != null && mission.pickupLng != null
      ? { lat: mission.pickupLat, lng: mission.pickupLng }
      : undefined;

    const candidates = await this.candidatesFor(service);
    const result = this.decision.select({ service, candidates, pickup });

    const decisionId = await this.decisions.record({
      kind: "ASSIGNMENT",
      engine: "ServiceDecisionEngine",
      engineVersion: ServiceDecisionEngine.VERSION,
      serviceKey: service.key,
      missionId: mission.id,
      subjectId: result.selected?.candidate.userId ?? null,
      input: { pickup, candidates: candidates.length },
      output: result.selected
        ? { providerId: result.selected.candidate.userId, score: result.selected.score }
        : { providerId: null },
      reasons: result.reasons,
      candidates: result.ranked.slice(0, 10).map((c) => ({
        userId: c.candidate.userId,
        name: c.candidate.name,
        score: c.score,
        factors: c.factors,
        reasons: c.reasons,
      })),
      score: result.selected?.score,
      confidence: result.confidence,
      latencyMs: Date.now() - started,
    });

    if (!result.selected) {
      await this.prisma.mission.update({ where: { id: mission.id }, data: { status: "DISPATCHING" } });
      await this.appendEvent(mission.id, "DispatchPostponed", null, { reasons: result.reasons });
      return { ...(await this.get(mission.id)), decisionId, assigned: false, reasons: result.reasons };
    }

    const provider = result.selected.candidate;
    await this.prisma.mission.update({
      where: { id: mission.id },
      data: {
        status: "ASSIGNED",
        providerId: provider.userId,
        providerKind: provider.kind,
        assignedAt: new Date(),
      },
    });
    await this.appendEvent(mission.id, "MissionAssigned", provider.userId, {
      score: result.selected.score,
      reasons: result.selected.reasons,
    });
    // Exécution : l'application du prestataire reçoit la décision, elle ne la prend pas.
    this.realtime.emitToUsers([provider.userId], "mission.assigned", {
      missionId: mission.id,
      reference: mission.reference,
      serviceKey: mission.serviceKey,
      orderId: mission.orderId,
      etaMinutes: mission.etaMinutes,
      payout: (mission.payload as any)?.providerPayout ?? null,
      score: result.selected.score,
      reasons: result.selected.reasons,
    });
    await this.bus.publish("mission.assigned", {
      missionId: mission.id,
      reference: mission.reference,
      providerUserId: provider.userId,
      serviceKey: mission.serviceKey,
    });

    // Annonce vocale de la mission attribuée (Voice Dispatch). Best-effort :
    // une panne de synthèse vocale ne remet jamais l'attribution en cause.
    await this.voice
      .announce({
        partnerId: provider.userId,
        kind: "MISSION_ASSIGNED",
        family: service.family,
        serviceLabel: service.label,
        // Quartier seulement : aucune donnée sensible n'est prononcée.
        zone: mission.zone ?? undefined,
        distanceMeters: mission.distanceMeters ?? undefined,
        payout: (mission.payload as any)?.providerPayout ?? undefined,
        missionId: mission.id,
        orderId: mission.orderId,
      })
      .catch((e) => this.logger.warn(`annonce vocale ignorée: ${e.message}`));

    return { ...(await this.get(mission.id)), decisionId, assigned: true, reasons: result.reasons };
  }

  /// Le prestataire accepte la mission qui lui a été attribuée.
  async acceptMission(missionId: string, userId: string) {
    const mission = await this.mustFind(missionId);
    if (mission.providerId && mission.providerId !== userId) {
      throw new ForbiddenException("Mission attribuée à un autre prestataire.");
    }
    if (!["PENDING", "DISPATCHING", "ASSIGNED"].includes(mission.status)) {
      throw new BadRequestException("Mission déjà engagée.");
    }
    await this.prisma.mission.update({
      where: { id: missionId },
      data: { status: "ACCEPTED", providerId: userId, assignedAt: mission.assignedAt ?? new Date() },
    });
    await this.appendEvent(missionId, "MissionAccepted", userId);
    await this.bus.publish("mission.accepted", { missionId, providerUserId: userId });
    return this.get(missionId);
  }

  /// Démarrage effectif (arrivée sur place, prise en charge du colis…).
  async startMission(missionId: string, userId: string, type = "MissionStarted") {
    const mission = await this.mustFind(missionId);
    if (mission.providerId !== userId) throw new ForbiddenException("Mission d'un autre prestataire.");
    await this.prisma.mission.update({
      where: { id: missionId },
      data: { status: "IN_PROGRESS", startedAt: mission.startedAt ?? new Date() },
    });
    await this.appendEvent(missionId, type, userId);
    return this.get(missionId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. APPRENDRE — clôture
  // ───────────────────────────────────────────────────────────────────────────

  /// Clôture la mission et déclenche l'apprentissage (principe n°4).
  async completeMission(missionId: string, userId?: string) {
    const mission = await this.mustFind(missionId);
    const completedAt = new Date();
    const reference = mission.startedAt ?? mission.assignedAt ?? mission.createdAt;
    const actualMinutes = Math.max(
      1,
      Math.round((completedAt.getTime() - new Date(reference).getTime()) / 60000),
    );
    await this.prisma.mission.update({
      where: { id: missionId },
      data: { status: "COMPLETED", completedAt, actualMinutes },
    });
    await this.appendEvent(missionId, "MissionCompleted", userId ?? mission.providerId, { actualMinutes });

    const payload = (mission.payload as any) ?? {};
    const learned = await this.learning.learn({
      missionId,
      serviceKey: mission.serviceKey,
      zone: mission.zone,
      city: mission.city,
      storeId: mission.storeId,
      clientId: mission.clientId,
      providerId: mission.providerId,
      providerKind: mission.providerKind,
      predictedMinutes: mission.etaMinutes,
      actualMinutes,
      slaMinutes: payload.slaMinutes ?? null,
      trafficFactor: payload.trafficFactor ?? null,
      hour: new Date(mission.createdAt).getHours(),
      amount: mission.priceAmount,
      status: "COMPLETED",
    });
    await this.bus.publish("mission.completed", {
      missionId,
      reference: mission.reference,
      serviceKey: mission.serviceKey,
      providerUserId: mission.providerId,
      actualMinutes,
    });
    return { ...(await this.get(missionId)), learning: learned };
  }

  /// Annulation : le Brain apprend aussi des échecs.
  async cancelMission(missionId: string, reason?: string, actorId?: string) {
    const mission = await this.mustFind(missionId);
    await this.prisma.mission.update({ where: { id: missionId }, data: { status: "CANCELLED" } });
    await this.appendEvent(missionId, "MissionCancelled", actorId ?? null, { reason });
    await this.learning.learn({
      missionId,
      serviceKey: mission.serviceKey,
      zone: mission.zone,
      city: mission.city,
      storeId: mission.storeId,
      clientId: mission.clientId,
      providerId: mission.providerId,
      providerKind: mission.providerKind,
      status: "CANCELLED",
    });
    await this.bus.publish("mission.cancelled", { missionId, reference: mission.reference, reason });
    return this.get(missionId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Lectures : missions, explications, intelligence de la ville
  // ───────────────────────────────────────────────────────────────────────────

  async get(missionId: string) {
    const m = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
    if (!m) throw new NotFoundException("Mission introuvable.");
    return BrainService.mapMission(m);
  }

  async listMine(clientId: string, limit = 20) {
    const rows = await this.prisma.mission.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });
    return rows.map((r) => BrainService.mapMission(r));
  }

  /// Missions ouvertes classées **pour un prestataire donné** : l'app livreur
  /// affiche le score de compatibilité et les raisons — jamais une liste brute.
  async openMissionsFor(userId: string, limit = 20) {
    const [driver, artisan] = await Promise.all([
      this.prisma.driver.findUnique({ where: { userId }, include: { user: true } }).catch(() => null),
      this.prisma.artisan.findUnique({ where: { userId }, include: { user: true } }).catch(() => null),
    ]);
    if (!driver && !artisan) throw new ForbiddenException("Profil prestataire requis.");

    // Missions encore ouvertes à tous + celles que le Brain m'a DÉJÀ attribuées
    // et que je n'ai pas encore acceptées : sans ce second cas, une mission
    // auto-attribuée n'apparaissait jamais dans l'application du prestataire.
    const rows = await this.prisma.mission.findMany({
      where: {
        OR: [
          { status: { in: ["PENDING", "DISPATCHING"] } },
          { status: "ASSIGNED", providerId: userId },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: Math.min(limit, 50),
    });

    const trust = await this.trust.scoreOf(userId, driver ? "DRIVER" : "PROVIDER");
    const activeMissions = await this.prisma.mission.count({
      where: { providerId: userId, status: { in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"] } },
    });

    const out: Record<string, any>[] = [];
    for (const m of rows) {
      const service = await this.registry.get(m.serviceKey).catch(() => null);
      if (!service) continue;
      const candidate = this.candidateOf({ driver, artisan, trust, activeMissions });
      const scored = this.decision.scoreForProvider({
        service,
        candidate,
        pickup: m.pickupLat != null && m.pickupLng != null
          ? { lat: m.pickupLat, lng: m.pickupLng }
          : undefined,
      });
      out.push({
        ...BrainService.mapMission(m),
        serviceLabel: service.label,
        score: Math.round(scored.score),
        eligible: scored.eligible,
        reasons: scored.reasons,
        payout: (m.payload as any)?.providerPayout ?? null,
      });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  /// Note un lot d'offres (livraisons libres) pour un prestataire donné.
  /// L'application livreur se contente de classer et d'expliquer : elle ne décide pas.
  async scoreOffersFor(
    userId: string,
    offers: { id: string; serviceKey: string; pickup?: GeoPoint }[],
  ): Promise<Map<string, { score: number; eligible: boolean; reasons: string[] }>> {
    const scores = new Map<string, { score: number; eligible: boolean; reasons: string[] }>();
    if (!offers.length) return scores;
    const driver = await this.prisma.driver
      .findUnique({ where: { userId }, include: { user: true } })
      .catch(() => null);
    const artisan = driver
      ? null
      : await this.prisma.artisan
          .findUnique({ where: { userId }, include: { user: true } })
          .catch(() => null);
    if (!driver && !artisan) return scores;

    const trust = await this.trust.scoreOf(userId, driver ? "DRIVER" : "PROVIDER");
    const activeMissions = await this.activeCount(userId);
    const candidate = this.candidateOf({ driver, artisan, trust, activeMissions });

    for (const offer of offers) {
      const service = await this.registry.get(offer.serviceKey).catch(() => null);
      if (!service) continue;
      const scored = this.decision.scoreForProvider({ service, candidate, pickup: offer.pickup });
      scores.set(offer.id, {
        score: Math.round(scored.score),
        eligible: scored.eligible,
        reasons: scored.reasons,
      });
    }
    return scores;
  }

  /// Explication d'une décision (principe n°3).
  explain(decisionId: string) {
    return this.decisions.explain(decisionId);
  }

  missionDecisions(missionId: string) {
    return this.decisions.forMission(missionId);
  }

  /// Proposition de regroupement pour une mission (Batch Engine).
  async batchFor(missionId: string) {
    const mission = await this.mustFind(missionId);
    const service = await this.registry.get(mission.serviceKey);
    // Toute mission NON DÉMARRÉE est regroupable — y compris déjà attribuée :
    // deux commandes du même commerce confiées au même livreur sont précisément
    // le cas d'usage du Batch Engine. Se limiter à PENDING/DISPATCHING rendait le
    // moteur inopérant dès que l'attribution automatique avait eu lieu.
    const open = await this.prisma.mission.findMany({
      where: {
        status: { in: ["PENDING", "DISPATCHING", "ASSIGNED", "ACCEPTED"] },
        serviceKey: mission.serviceKey,
      },
      take: 30,
    });
    const toBatchable = (m: any) => ({
      id: m.id,
      reference: m.reference,
      storeId: m.storeId,
      pickup: m.pickupLat != null ? { lat: m.pickupLat, lng: m.pickupLng } : undefined,
      dropoff: m.dropoffLat != null ? { lat: m.dropoffLat, lng: m.dropoffLng } : undefined,
      createdAt: m.createdAt,
      etaMinutes: m.etaMinutes,
    });
    const proposal = this.batch.evaluate({
      service,
      mission: toBatchable(mission),
      open: open.map(toBatchable),
    });
    const decisionId = await this.decisions.record({
      kind: "BATCH",
      engine: "BatchEngine",
      engineVersion: BatchEngine.VERSION,
      serviceKey: mission.serviceKey,
      missionId: mission.id,
      input: { open: open.length },
      output: {
        beneficial: proposal.beneficial,
        savedMeters: proposal.savedMeters,
        savedMinutes: proposal.savedMinutes,
      },
      reasons: proposal.reasons,
    });
    if (proposal.beneficial) {
      const batchId = `BATCH-${mission.reference}`;
      await this.prisma.mission.updateMany({
        where: { id: { in: proposal.grouped.map((g) => g.id) } },
        data: { batchId },
      });
      return { ...proposal, batchId, decisionId };
    }
    return { ...proposal, batchId: null, decisionId };
  }

  /// Fiche de confiance d'un acteur.
  trustOf(subjectId: string, subjectType: "CUSTOMER" | "DRIVER" | "MERCHANT" | "PROVIDER") {
    return this.trust.profile(subjectId, subjectType);
  }

  /// Intelligence de la ville (console d'administration).
  async cityInsights(zone?: string) {
    const hour = new Date().getHours();
    const target = zone ?? "Hamdallaye ACI";
    const [pulse, busiest, underServed, knowledge] = await Promise.all([
      this.city.pulse(target, hour),
      this.city.busiestZones(),
      this.city.underServedZones(),
      this.knowledge.stats(),
    ]);
    return { hour, pulse, busiest, underServed, knowledge };
  }

  /// Conseils du Brain à un commerçant : ce que la plateforme a appris de LUI.
  async merchantInsights(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
      include: { stores: true },
    });
    const store = (merchant as any)?.stores?.[0] ?? null;
    const storeId = store?.id ?? null;
    const zone = store?.lat != null ? zoneOf({ lat: store.lat, lng: store.lng }).zone : "Bamako";
    const hour = new Date().getHours();

    const [prep, pulse, trust, peaks] = await Promise.all([
      storeId ? this.knowledge.detail("MERCHANT", storeId, "prep_minutes", 12) : Promise.resolve({ value: 12, samples: 0 }),
      this.city.pulse(zone, hour),
      this.trust.profile(storeId ?? userId, "MERCHANT"),
      this.city.peakHours(zone),
    ]);

    const advice: string[] = [];
    // Tant que la préparation n'est pas confirmée par 5 commandes, on annonce
    // l'estimation par défaut plutôt qu'une moyenne tirée d'un cas isolé.
    const prepConfirmed = prep.samples >= 5;
    const prepMinutes = prepConfirmed ? prep.value : 12;
    if (prepConfirmed && prep.value > 15) {
      advice.push(
        `Votre préparation moyenne est de ${Math.round(prep.value)} min : la réduire de 3 min améliorerait votre classement dans l'appli client.`,
      );
    }
    advice.push(
      `Heures de pointe de ${zone} : ${peaks.map((h) => `${h} h`).join(", ")} — prévoyez du personnel.`,
    );
    if (pulse.tension > 1.3) {
      advice.push("Zone tendue en ce moment : les livreurs sont rares, préparez les commandes en avance.");
    }
    if (trust.score >= 80) advice.push("Score de confiance élevé : vos commandes sont priorisées.");

    return {
      storeId,
      zone,
      prepMinutes: Math.round(prepMinutes),
      prepSamples: prep.samples,
      peakHours: peaks,
      tension: Number(pulse.tension.toFixed(2)),
      trust,
      advice,
    };
  }

  /// Tableau de bord du Brain (administration).
  async dashboard() {
    const [missions, byStatus, decisions, knowledge, fraud] = await Promise.all([
      this.prisma.mission.count().catch(() => 0),
      this.prisma.mission.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
      this.prisma.brainDecision.count().catch(() => 0),
      this.knowledge.stats(),
      this.fraud.recent(10),
    ]);
    return {
      missions,
      byStatus: (byStatus as any[]).map((s) => ({ status: s.status, count: s._count._all })),
      decisions,
      knowledge,
      engines: [
        { name: "ServiceDecisionEngine", version: ServiceDecisionEngine.VERSION },
        { name: "SmartPricingEngine", version: SmartPricingEngine.VERSION },
        { name: "RouteIntelligenceEngine", version: RouteIntelligenceEngine.VERSION },
        { name: "BatchEngine", version: BatchEngine.VERSION },
        { name: "TrustEngine", version: TrustEngine.VERSION },
        { name: "FraudEngine", version: FraudEngine.VERSION },
        { name: "CityIntelligenceEngine", version: CityIntelligenceEngine.VERSION },
        { name: "LearningEngine", version: LearningEngine.VERSION },
      ],
      fraudSignals: fraud,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Points d'entrée internes (le domaine ops appelle le Brain, jamais l'inverse)
  // ───────────────────────────────────────────────────────────────────────────

  /// Appelé par OrdersService : une commande = une mission du Brain.
  async onOrderCreated(order: {
    id: string;
    reference: string;
    customerId: string;
    storeId: string | null;
    type: string;
    subtotal: number;
    deliveryFee: number;
    paymentMethod?: string | null;
    zone?: string | null;
  }) {
    try {
      return await this.createMission({
        clientId: order.customerId,
        orderType: order.type,
        orderId: order.id,
        storeId: order.storeId ?? undefined,
        zone: order.zone ?? undefined,
        subtotal: order.subtotal,
        paymentMethod: order.paymentMethod ?? null,
        // Le commerçant a fixé ses frais de livraison : le Brain les respecte.
        partnerFee: order.deliveryFee,
        payload: { orderReference: order.reference },
        autoDispatch: false, // le livreur est choisi quand la commande est prête
      });
    } catch (e: any) {
      this.logger.warn(`mission non créée pour ${order.reference}: ${e.message}`);
      return null;
    }
  }

  /// Appelé par DeliveriesService : le livreur a pris la course.
  async onDeliveryAccepted(orderId: string, driverUserId: string) {
    const mission = await this.missionForOrder(orderId);
    if (!mission) return null;
    return this.acceptMission(mission.id, driverUserId).catch((e) => {
      this.logger.debug(`acceptMission ignoré: ${e.message}`);
      return null;
    });
  }

  async onDeliveryStarted(orderId: string, driverUserId: string) {
    const mission = await this.missionForOrder(orderId);
    if (!mission) return null;
    return this.startMission(mission.id, driverUserId, "ProviderEnRoute").catch(() => null);
  }

  /// Appelé par DeliveriesService : la course est terminée → apprentissage.
  async onDeliveryCompleted(orderId: string, driverUserId?: string) {
    const mission = await this.missionForOrder(orderId);
    if (!mission) return null;
    return this.completeMission(mission.id, driverUserId).catch((e) => {
      this.logger.warn(`apprentissage ignoré pour ${orderId}: ${e.message}`);
      return null;
    });
  }

  async onOrderCancelled(orderId: string, reason?: string) {
    const mission = await this.missionForOrder(orderId);
    if (!mission) return null;
    return this.cancelMission(mission.id, reason).catch(() => null);
  }

  private async missionForOrder(orderId: string) {
    return this.prisma.mission.findUnique({ where: { orderId } }).catch(() => null);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Observation du terrain
  // ───────────────────────────────────────────────────────────────────────────

  /// Prestataires observables pour un métier (livreurs OU artisans, selon la config).
  private async candidatesFor(service: ServiceRuntime): Promise<ProviderCandidate[]> {
    if (service.providerKind === "ARTISAN") {
      const artisans = await this.prisma.artisan.findMany({
        where: { isAvailable: true },
        include: { user: true },
        take: 100,
      });
      return Promise.all(
        artisans.map(async (a: any) => ({
          userId: a.userId,
          profileId: a.id,
          kind: "ARTISAN",
          name: [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ") || a.profession,
          location: zoneCenter(a.serviceArea),
          rating: a.rating ?? 0,
          completed: await this.completedCount(a.userId),
          isAvailable: a.isAvailable,
          // La profession déclarée vaut compétence (config du métier, principe n°6).
          skills: skillsForProfession(a.profession),
          equipment: service.equipment,
          vehicle: null,
          kycApproved: true,
          activeMissions: await this.activeCount(a.userId),
          trust: await this.trust.scoreOf(a.userId, "PROVIDER"),
        })),
      );
    }

    const drivers = await this.prisma.driver.findMany({
      where: { isAvailable: true },
      include: { user: true },
      take: 100,
    });
    return Promise.all(
      drivers.map(async (d: any) => ({
        userId: d.userId,
        profileId: d.id,
        kind: "DRIVER",
        name: [d.user?.firstName, d.user?.lastName].filter(Boolean).join(" ") || "Livreur",
        location: d.lastLat != null && d.lastLng != null ? { lat: d.lastLat, lng: d.lastLng } : undefined,
        rating: d.rating ?? 0,
        completed: d.totalDeliveries ?? 0,
        isAvailable: d.isAvailable,
        skills: ["delivery", "ride", normalizeSkill(d.vehicleType ?? "moto")],
        equipment: service.equipment,
        vehicle: d.vehicleType ?? "moto",
        kycApproved: d.kycStatus === "APPROVED",
        activeMissions: await this.activeCount(d.userId),
        trust: await this.trust.scoreOf(d.userId, "DRIVER"),
      })),
    );
  }

  private candidateOf(input: {
    driver: any;
    artisan: any;
    trust: number;
    activeMissions: number;
  }): ProviderCandidate {
    const { driver, artisan } = input;
    if (driver) {
      return {
        userId: driver.userId,
        profileId: driver.id,
        kind: "DRIVER",
        name: [driver.user?.firstName, driver.user?.lastName].filter(Boolean).join(" ") || "Livreur",
        location: driver.lastLat != null && driver.lastLng != null
          ? { lat: driver.lastLat, lng: driver.lastLng }
          : undefined,
        rating: driver.rating ?? 0,
        completed: driver.totalDeliveries ?? 0,
        isAvailable: driver.isAvailable,
        skills: ["delivery", "ride", normalizeSkill(driver.vehicleType ?? "moto")],
        equipment: [],
        vehicle: driver.vehicleType ?? "moto",
        kycApproved: driver.kycStatus === "APPROVED",
        activeMissions: input.activeMissions,
        trust: input.trust,
      };
    }
    return {
      userId: artisan.userId,
      profileId: artisan.id,
      kind: "ARTISAN",
      name: [artisan.user?.firstName, artisan.user?.lastName].filter(Boolean).join(" ") || artisan.profession,
      location: zoneCenter(artisan.serviceArea),
      rating: artisan.rating ?? 0,
      completed: 0,
      isAvailable: artisan.isAvailable,
      skills: skillsForProfession(artisan.profession),
      equipment: [],
      vehicle: null,
      kycApproved: true,
      activeMissions: input.activeMissions,
      trust: input.trust,
    };
  }

  private async activeCount(userId: string): Promise<number> {
    return this.prisma.mission
      .count({ where: { providerId: userId, status: { in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"] } } })
      .catch(() => 0);
  }

  private async completedCount(userId: string): Promise<number> {
    return this.prisma.mission
      .count({ where: { providerId: userId, status: "COMPLETED" } })
      .catch(() => 0);
  }

  private async countAvailableProviders(service: ServiceRuntime): Promise<number | undefined> {
    try {
      if (service.providerKind === "ARTISAN") {
        return await this.prisma.artisan.count({ where: { isAvailable: true } });
      }
      if (service.providerKind === "DRIVER") {
        return await this.prisma.driver.count({ where: { isAvailable: true } });
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /// Frais de livraison imposés par la boutique (null si inconnue).
  private async storeDeliveryFee(storeId: string): Promise<number | null> {
    try {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { deliveryFee: true },
      });
      return store?.deliveryFee ?? null;
    } catch {
      return null;
    }
  }

  private async storeLocation(storeId?: string | null): Promise<GeoPoint | undefined> {
    if (!storeId) return undefined;
    try {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { lat: true, lng: true },
      });
      if (store?.lat != null && store?.lng != null) return { lat: store.lat, lng: store.lng };
    } catch {
      /* observation best-effort */
    }
    return undefined;
  }

  private async appendEvent(missionId: string, type: string, actorId?: string | null, data?: unknown) {
    try {
      await this.prisma.missionEvent.create({
        data: { missionId, type, actorId: actorId ?? null, data: (data ?? undefined) as any },
      });
    } catch (e: any) {
      this.logger.debug(`événement ${type} non journalisé: ${e.message}`);
    }
  }

  private async mustFind(missionId: string) {
    const m = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!m) throw new NotFoundException("Mission introuvable.");
    return m;
  }

  private async nextReference(): Promise<string> {
    const count = await this.prisma.mission.count().catch(() => 0);
    const year = new Date().getFullYear();
    return `NVG-M-${year}-${String(count + 1).padStart(6, "0")}`;
  }


  /// LE CARRÉ D'ÉQUILIBRE : une décision n'est validée que si les quatre piliers
  /// restent servis. Chaque note est bornée 0–100 et publiée avec la décision.
  static balanceOf(input: {
    etaMinutes: number;
    slaMinutes: number;
    surge: number;
    amount: number;
    providerPayout: number;
    commission: number;
  }): BalanceScore {
    const punctuality = clamp(100 - ((input.etaMinutes - input.slaMinutes) / Math.max(1, input.slaMinutes)) * 100, 0, 100);
    const priceFairness = clamp(100 - (input.surge - 1) * 120, 40, 100);
    const client = Math.round((punctuality + priceFairness) / 2);
    const provider = Math.round(
      clamp((input.providerPayout / Math.max(1, input.amount)) * 100, 0, 100),
    );
    const partner = Math.round(punctuality);
    const novigo = Math.round(clamp((input.commission / Math.max(1, input.amount)) * 500, 0, 100));
    return { client, provider, partner, novigo };
  }

  private static mapMission(m: any) {
    return {
      id: m.id,
      reference: m.reference,
      serviceKey: m.serviceKey,
      status: m.status,
      clientId: m.clientId,
      providerId: m.providerId,
      providerKind: m.providerKind,
      orderId: m.orderId,
      storeId: m.storeId,
      zone: m.zone,
      city: m.city,
      pickup: m.pickupLat != null ? { lat: m.pickupLat, lng: m.pickupLng } : null,
      dropoff: m.dropoffLat != null ? { lat: m.dropoffLat, lng: m.dropoffLng } : null,
      distanceMeters: m.distanceMeters,
      etaMinutes: m.etaMinutes,
      price: { amount: m.priceAmount, currency: m.currency },
      batchId: m.batchId,
      createdAt: m.createdAt,
      assignedAt: m.assignedAt,
      completedAt: m.completedAt,
      actualMinutes: m.actualMinutes,
      events: (m.events ?? []).map((e: any) => ({
        type: e.type,
        actorId: e.actorId,
        data: e.data,
        at: e.createdAt,
      })),
    };
  }
}
