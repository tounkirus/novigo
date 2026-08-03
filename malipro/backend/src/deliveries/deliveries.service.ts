import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { NotificationsService } from "../notifications/notifications.service";
import { EventBusService } from "../common/events/event-bus.service";
import { BrainService } from "../brain/brain.service";
import { serviceKeyForOrderType } from "../brain/service-catalog";
import { assessWaiting } from "../policies/waiting-policy";

function mapDelivery(d: any) {
  return {
    id: d.id, orderId: d.orderId, driverId: d.driverId, status: d.status,
    pickupLocation: d.pickupLat != null ? { lat: d.pickupLat, lng: d.pickupLng } : undefined,
    dropoffLocation: d.dropoffLat != null ? { lat: d.dropoffLat, lng: d.dropoffLng } : undefined,
    etaMinutes: d.etaMinutes, distanceMeters: d.distanceMeters,
    acceptedAt: d.acceptedAt, completedAt: d.completedAt,
  };
}

const money = (amount: number, currency = "XOF") => ({ amount, currency });

/// Livraison libre + contexte de la commande, tel que l'app livreur l'affiche :
/// nom du commerce, adresse de retrait, client, nombre d'articles et rémunération.
function mapAvailableDelivery(d: any) {
  const o = d.order;
  const customer = o?.customer
    ? [o.customer.firstName, o.customer.lastName].filter(Boolean).join(" ") || null
    : null;
  const dropoff = [o?.addressLine1, o?.addressDistrict, o?.addressCity].filter(Boolean).join(" · ") || null;
  return {
    ...mapDelivery(d),
    reference: o?.reference ?? null,
    store: o?.store ? { id: o.store.id, name: o.store.name, address: o.store.address ?? null } : null,
    customerName: customer,
    dropoffAddress: dropoff,
    itemsCount: (o?.items ?? []).reduce((s: number, i: any) => s + i.quantity, 0),
    orderTotal: o ? money(o.total) : null,
    // Rémunération du livreur = frais de livraison de la commande (cf. bus delivery.completed).
    payout: o ? money(o.deliveryFee) : null,
  };
}

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private notifications: NotificationsService,
    private bus: EventBusService,
    // Classement et apprentissage des courses : c'est le Brain qui décide.
    private brain: BrainService,
  ) {}

  private async driverFor(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException("Profil livreur requis.");
    return driver;
  }

  // Affectation géo optimisée = P4 ; ici on liste simplement les livraisons libres.
  // La charge utile porte le contexte de la course (commerce, client, articles,
  // rémunération) : sans lui l'app livreur ne peut qu'inventer ce qu'elle affiche.
  async available(userId?: string) {
    const rows = await this.prisma.delivery.findMany({
      where: { status: "UNASSIGNED" },
      orderBy: { id: "asc" },
      take: 50,
      include: {
        order: {
          include: { store: true, items: true, customer: true },
        },
      },
    });
    const items = rows.map(mapAvailableDelivery);
    if (!userId) return items;

    // Le NOVIGO Brain note chaque course POUR ce livreur (proximité, confiance,
    // équité de répartition) et joint les raisons : l'app affiche, elle ne trie pas
    // selon ses propres critères.
    const scores = await this.brain
      .scoreOffersFor(
        userId,
        rows.map((d: any) => ({
          id: d.id,
          serviceKey: serviceKeyForOrderType(d.order?.type),
          pickup:
            d.pickupLat != null && d.pickupLng != null
              ? { lat: d.pickupLat, lng: d.pickupLng }
              : d.order?.store?.lat != null && d.order?.store?.lng != null
                ? { lat: d.order.store.lat, lng: d.order.store.lng }
                : undefined,
        })),
      )
      .catch(() => new Map());

    return items
      .map((item: any) => {
        const s = scores.get(item.id);
        return s
          ? { ...item, brainScore: s.score, brainReasons: s.reasons, recommended: s.score >= 60 }
          : item;
      })
      .sort((a: any, b: any) => (b.brainScore ?? 0) - (a.brainScore ?? 0));
  }

  async get(id: string) {
    const d = await this.prisma.delivery.findUnique({ where: { id } });
    if (!d) throw new NotFoundException("Livraison introuvable.");
    return mapDelivery(d);
  }

  async accept(id: string, userId: string) {
    const driver = await this.driverFor(userId);
    const d = await this.prisma.delivery.findUnique({ where: { id } });
    if (!d) throw new NotFoundException("Livraison introuvable.");
    if (d.status !== "UNASSIGNED" || d.driverId) {
      throw new ConflictException("Livraison déjà prise.");
    }
    const updated = await this.prisma.delivery.update({
      where: { id }, data: { driverId: driver.id, status: "ACCEPTED", acceptedAt: new Date() },
    });
    await this.prisma.order.update({ where: { id: d.orderId }, data: { status: "ASSIGNED" } });
    this.realtime.emitTracking(d.orderId, { orderId: d.orderId, status: "ASSIGNED" });
    await this.brain.onDeliveryAccepted(d.orderId, userId).catch(() => undefined);
    return mapDelivery(updated);
  }

  async reject(id: string, userId: string) {
    await this.driverFor(userId);
    // Le livreur passe son tour ; la livraison reste disponible pour les autres.
    return { rejected: true };
  }

  async start(id: string, userId: string) {
    const d = await this.ownDelivery(id, userId);
    if (!["ACCEPTED"].includes(d.status)) throw new BadRequestException("Transition invalide.");
    const updated = await this.prisma.delivery.update({
      where: { id }, data: { status: "EN_ROUTE_DROPOFF" },
    });
    await this.prisma.order.update({ where: { id: d.orderId }, data: { status: "IN_TRANSIT" } });
    this.realtime.emitTracking(d.orderId, { orderId: d.orderId, status: "IN_TRANSIT" });
    await this.brain.onDeliveryStarted(d.orderId, userId).catch(() => undefined);
    return mapDelivery(updated);
  }

  /**
   * « Je suis arrivé » (CDC v0.75 §3).
   *
   * C'est le SEUL événement qui démarre le compteur d'attente facturable :
   * ni l'acceptation, ni la mise en route ne l'enclenchent. Sans cet appui,
   * aucune compensation d'absence ne peut être réclamée.
   *
   * Idempotent : un second appui ne redémarre pas le compteur, sans quoi un
   * livreur pourrait repousser indéfiniment le délai des 20 minutes — ou, à
   * l'inverse, perdre l'attente déjà écoulée par une fausse manipulation.
   */
  async arrive(id: string, userId: string) {
    const d = await this.ownDelivery(id, userId);
    if (["COMPLETED", "FAILED"].includes(d.status)) {
      throw new BadRequestException("Cette course est terminée.");
    }
    if (d.arrivedAt) return mapDelivery(d);

    const updated = await this.prisma.delivery.update({
      where: { id },
      data: { status: "ARRIVED", arrivedAt: new Date() },
    });
    this.realtime.emitTracking(d.orderId, { orderId: d.orderId, status: "ARRIVED" });
    const order = await this.prisma.order.findUnique({ where: { id: d.orderId } });
    if (order) {
      await this.notifications.create(order.customerId, "ORDER_ARRIVED", "Votre livreur est arrivé",
        "Votre livreur vous attend au point de livraison.", { orderId: d.orderId });
    }
    return mapDelivery(updated);
  }

  /**
   * Attente en cours au point de livraison, et droits qu'elle ouvre (§3).
   *
   * Le livreur interroge ce point pour savoir s'il peut abandonner la course et
   * avec quelle compensation — plutôt que de compter les minutes lui-même.
   */
  async waiting(id: string, userId: string) {
    const d = await this.ownDelivery(id, userId);
    return assessWaiting(
      { location: "CUSTOMER", arrivedAt: d.arrivedAt ?? null },
      new Date(),
    );
  }

  /**
   * Abandon pour absence du client (§3) : autorisé seulement une fois le délai
   * écoulé, et il ouvre droit à une compensation pour le livreur.
   */
  async cancelForAbsence(id: string, userId: string) {
    const d = await this.ownDelivery(id, userId);
    const assessment = assessWaiting(
      { location: "CUSTOMER", arrivedAt: d.arrivedAt ?? null },
      new Date(),
    );
    if (!assessment.mayCancelForAbsence) {
      throw new BadRequestException(
        d.arrivedAt
          ? "Le délai d'attente n'est pas encore écoulé."
          : "Appuyez d'abord sur « Je suis arrivé ».",
      );
    }
    const updated = await this.prisma.delivery.update({
      where: { id }, data: { status: "FAILED", completedAt: new Date() },
    });
    await this.prisma.order.update({
      where: { id: d.orderId },
      data: { status: "CANCELLED", cancellationReason: "Client absent au point de livraison" },
    });
    this.realtime.emitTracking(d.orderId, { orderId: d.orderId, status: "CANCELLED" });

    // Bus finance (Spring) : la compensation d'attente est un dû, pas un
    // affichage. Elle emprunte le même chemin que les frais de livraison, avec
    // sa propre nature pour rester distinguable en comptabilité.
    const order = await this.prisma.order.findUnique({ where: { id: d.orderId } });
    if (order && assessment.compensation > 0) {
      await this.bus.publish("delivery.compensated", {
        orderId: d.orderId,
        reference: order.reference,
        driverUserId: userId,
        amount: assessment.compensation,
        reason: "CUSTOMER_ABSENT",
        waitedMinutes: Math.round(assessment.waitedMinutes),
      });
      await this.notifications.create(order.customerId, "ORDER_CANCELLED",
        "Commande annulée", "Le livreur vous a attendu sans réponse. La course a été annulée.",
        { orderId: d.orderId });
    }
    return { ...mapDelivery(updated), compensation: assessment.compensation };
  }

  async complete(id: string, userId: string) {
    const d = await this.ownDelivery(id, userId);
    if (d.status === "COMPLETED") throw new BadRequestException("Déjà terminée.");
    const updated = await this.prisma.delivery.update({
      where: { id }, data: { status: "COMPLETED", completedAt: new Date() },
    });
    await this.prisma.order.update({ where: { id: d.orderId }, data: { status: "DELIVERED" } });
    if (d.driverId) {
      await this.prisma.driver.update({
        where: { id: d.driverId }, data: { totalDeliveries: { increment: 1 } },
      });
    }
    this.realtime.emitTracking(d.orderId, { orderId: d.orderId, status: "DELIVERED" });
    const order = await this.prisma.order.findUnique({ where: { id: d.orderId } });
    if (order) {
      await this.notifications.create(order.customerId, "ORDER_DELIVERED", "Commande livrée",
        "Votre commande a été livrée. Bon appétit !", { orderId: d.orderId });
      // Bus finance (Spring) : crédite le wallet livreur des frais de livraison (ADR-5/P1).
      await this.bus.publish("delivery.completed", {
        orderId: d.orderId, reference: order.reference,
        driverUserId: userId, deliveryFee: order.deliveryFee,
      });
    }
    // Clôture de la mission côté Brain : délai réel, confiance, livre de connaissances.
    await this.brain.onDeliveryCompleted(d.orderId, userId).catch(() => undefined);
    return mapDelivery(updated);
  }

  async updateLocation(id: string, userId: string, lat: number, lng: number) {
    const d = await this.ownDelivery(id, userId);
    await this.prisma.delivery.update({ where: { id }, data: { driverLat: lat, driverLng: lng } });
    // Dernière position connue du livreur : critère de proximité du Brain.
    if (d.driverId) {
      await this.prisma.driver
        .update({ where: { id: d.driverId }, data: { lastLat: lat, lastLng: lng, lastSeenAt: new Date() } })
        .catch(() => undefined);
    }
    const order = await this.prisma.order.findUnique({ where: { id: d.orderId } });
    this.realtime.emitTracking(d.orderId, {
      orderId: d.orderId, status: order?.status, driverLocation: { lat, lng }, etaMinutes: d.etaMinutes,
    });
    return { ok: true };
  }

  async reportIssue(id: string, userId: string, type: string, description: string) {
    const d = await this.prisma.delivery.findUnique({ where: { id } });
    if (!d) throw new NotFoundException("Livraison introuvable.");
    const issue = await this.prisma.deliveryIssue.create({
      data: { deliveryId: id, reporterId: userId, type, description },
    });
    return { id: issue.id, deliveryId: id, type: issue.type, createdAt: issue.createdAt };
  }

  private async ownDelivery(id: string, userId: string) {
    const driver = await this.driverFor(userId);
    const d = await this.prisma.delivery.findUnique({ where: { id } });
    if (!d) throw new NotFoundException("Livraison introuvable.");
    if (d.driverId !== driver.id) throw new ForbiddenException("Livraison assignée à un autre livreur.");
    return d;
  }
}
