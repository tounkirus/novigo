import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { EventBusService } from "../common/events/event-bus.service";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

function mapOrder(o: any) {
  return {
    id: o.id,
    reference: o.reference,
    customerId: o.customerId,
    type: o.type,
    status: o.status,
    items: o.items?.map((it: any) => ({
      productId: it.productId, name: it.name, quantity: it.quantity,
      unitPrice: money(it.unitPrice), optionsLabel: it.optionsLabel ?? undefined,
    })),
    deliveryAddress: o.addressLine1
      ? { line1: o.addressLine1, city: o.addressCity, district: o.addressDistrict }
      : undefined,
    subtotal: money(o.subtotal),
    deliveryFee: money(o.deliveryFee),
    total: money(o.total),
    paymentMethod: o.paymentMethod ?? undefined,
    createdAt: o.createdAt,
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private bus: EventBusService,
  ) {}

  /// Utilisateurs à notifier pour un établissement : propriétaire + staff.
  private async merchantRecipients(storeId: string | null): Promise<string[]> {
    if (!storeId) return [];
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { merchant: { include: { staff: { select: { userId: true } } } } },
    });
    if (!store?.merchant) return [];
    return [store.merchant.userId, ...store.merchant.staff.map((s) => s.userId)];
  }

  private genTrackingCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  async trackByCode(code: string) {
    const order = await this.prisma.order.findUnique({
      where: { trackingCode: code },
      include: { items: true, delivery: { include: { driver: { include: { user: true } } } } },
    });
    if (!order) throw new NotFoundException("Suivi introuvable.");
    const driver = (order as any).delivery?.driver?.user;
    return {
      reference: order.reference,
      status: order.status,
      type: order.type,
      createdAt: order.createdAt,
      itemsCount: order.items.length,
      total: { amount: order.total, currency: order.currency },
      delivery: order.delivery
        ? { status: (order as any).delivery.status, driverName: driver ? `${driver.firstName ?? ""}`.trim() || null : null }
        : null,
    };
  }

  async createForCustomer(userId: string, dto: any) {
    const ids = dto.items.map((i: any) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: { optionGroups: { include: { choices: true } } },
    });
    if (products.length !== new Set(ids).size) {
      throw new BadRequestException("Un ou plusieurs produits sont introuvables.");
    }
    const priceOf = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const itemsData = dto.items.map((i: any) => {
      const p = priceOf.get(i.productId)! as any;
      // Applique la promotion commerçant au moment de la commande.
      const base = p.promoPercent ? Math.round(p.price * (1 - p.promoPercent / 100)) : p.price;
      // Options choisies : ne retenir que les choix appartenant à ce produit.
      const choiceIds: string[] = Array.isArray(i.choiceIds) ? i.choiceIds : [];
      const chosen = (p.optionGroups ?? [])
        .flatMap((g: any) => g.choices)
        .filter((c: any) => choiceIds.includes(c.id));
      const optionsDelta = chosen.reduce((s: number, c: any) => s + c.priceDelta, 0);
      const optionsLabel = chosen.length ? chosen.map((c: any) => c.name).join(", ") : null;
      const unit = base + optionsDelta;
      subtotal += unit * i.quantity;
      return { productId: p.id, name: p.name, quantity: i.quantity, unitPrice: unit, optionsLabel };
    });
    const deliveryFee = 1000;
    const total = subtotal + deliveryFee;
    const count = await this.prisma.order.count();
    const reference = `MLP-2026-${String(count + 1).padStart(6, "0")}`;

    // Rattache la commande à la boutique du/des produit(s) (commande mono-boutique).
    const storeIds = [...new Set(products.map((p) => p.storeId).filter(Boolean))];
    const storeId = storeIds.length === 1 ? (storeIds[0] as string) : null;

    const order = await this.prisma.order.create({
      data: {
        reference, trackingCode: this.genTrackingCode(), customerId: userId, storeId, type: dto.type as any, status: "PENDING",
        subtotal, deliveryFee, total, paymentMethod: dto.paymentMethod as any,
        addressLine1: dto.deliveryAddress.line1, addressCity: dto.deliveryAddress.city,
        addressDistrict: dto.deliveryAddress.district ?? null,
        items: { create: itemsData },
        delivery: { create: { status: "UNASSIGNED" } },
        payment: {
          create: {
            userId, method: dto.paymentMethod as any, status: "INITIATED", amount: total,
          },
        },
      },
      include: { items: true },
    });

    // Push temps réel de la nouvelle commande au commerçant (propriétaire + staff).
    const recipients = await this.merchantRecipients(order.storeId);
    if (recipients.length) {
      this.realtime.emitToUsers(recipients, "order.new", {
        id: order.id, reference: order.reference, status: order.status,
        storeId: order.storeId, total: money(order.total), paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      });
    }

    // Publie sur le bus finance (Spring) : règlement wallet commerçant, commission, compta (ADR-5/P1).
    await this.bus.publish("order.created", {
      orderId: order.id,
      reference: order.reference,
      customerId: order.customerId,
      merchantUserId: recipients.length ? recipients[0] : null, // propriétaire boutique (Nest UUID)
      storeId: order.storeId,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    });
    return mapOrder(order);
  }

  async listMine(userId: string, page: number, limit: number, status?: string) {
    const where: any = { customerId: userId };
    if (status) where.status = status;
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(rows.map(mapOrder), total, page, limit);
  }

  async listAdmin(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {};
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(rows.map(mapOrder), total, page, limit);
  }

  async get(id: string) {
    const o = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!o) throw new NotFoundException("Commande introuvable.");
    return mapOrder(o);
  }

  async tracking(id: string) {
    const o = await this.prisma.order.findUnique({ where: { id }, include: { delivery: true } });
    if (!o) throw new NotFoundException("Commande introuvable.");
    const d = o.delivery;
    return {
      orderId: o.id,
      status: o.status,
      driverLocation: d?.driverLat != null && d?.driverLng != null
        ? { lat: d.driverLat, lng: d.driverLng } : undefined,
      etaMinutes: d?.etaMinutes ?? null,
    };
  }

  async cancel(id: string) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o) throw new NotFoundException("Commande introuvable.");
    const cancellable = ["PENDING", "CONFIRMED", "PREPARING", "READY", "ASSIGNED"];
    if (!cancellable.includes(o.status)) {
      throw new BadRequestException("Cette commande ne peut plus être annulée.");
    }
    const updated = await this.prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
    return mapOrder(updated);
  }
}
