import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { NotificationsService } from "../notifications/notifications.service";
import { EventBusService } from "../common/events/event-bus.service";

function mapDelivery(d: any) {
  return {
    id: d.id, orderId: d.orderId, driverId: d.driverId, status: d.status,
    pickupLocation: d.pickupLat != null ? { lat: d.pickupLat, lng: d.pickupLng } : undefined,
    dropoffLocation: d.dropoffLat != null ? { lat: d.dropoffLat, lng: d.dropoffLng } : undefined,
    etaMinutes: d.etaMinutes, distanceMeters: d.distanceMeters,
    acceptedAt: d.acceptedAt, completedAt: d.completedAt,
  };
}

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private notifications: NotificationsService,
    private bus: EventBusService,
  ) {}

  private async driverFor(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException("Profil livreur requis.");
    return driver;
  }

  // Affectation géo optimisée = P4 ; ici on liste simplement les livraisons libres.
  async available() {
    const rows = await this.prisma.delivery.findMany({
      where: { status: "UNASSIGNED" }, orderBy: { id: "asc" }, take: 50,
    });
    return rows.map(mapDelivery);
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
    return mapDelivery(updated);
  }

  async updateLocation(id: string, userId: string, lat: number, lng: number) {
    const d = await this.ownDelivery(id, userId);
    await this.prisma.delivery.update({ where: { id }, data: { driverLat: lat, driverLng: lng } });
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
