import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { NotificationsService } from "../notifications/notifications.service";
import { EventBusService } from "../common/events/event-bus.service";
import { BrainService } from "../brain/brain.service";
import { serviceKeyForOrderType } from "../brain/service-catalog";

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
