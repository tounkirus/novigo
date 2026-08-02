import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { EventBusService } from "../common/events/event-bus.service";
import { BrainService } from "../brain/brain.service";
import { roadMeters, zoneCenter } from "../brain/geo";
import { quoteDelivery } from "../pricing/delivery-tariff";
import { assessCancellation, type CourseStage } from "../policies/cancellation-policy";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

/// Tarif de repli, appliqué quand la distance de la course est indéterminée
/// (boutique sans coordonnées, ou quartier de livraison inconnu du référentiel).
const DEFAULT_DELIVERY_FEE = 1000;

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
    // Le Brain décide (tarif, délai, attribution) ; ce service exécute (principe n°1).
    private brain: BrainService,
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
    // Rattache la commande à la boutique du/des produit(s) (commande mono-boutique).
    const storeIds = [...new Set(products.map((p) => p.storeId).filter(Boolean))];
    const storeId = storeIds.length === 1 ? (storeIds[0] as string) : null;

    // Frais de livraison : valeur portée par la boutique, c'est-à-dire exactement
    // celle que /stores a renvoyée au client. Sans boutique rattachée, tarif par défaut.
    const store = storeId
      ? await this.prisma.store.findUnique({
          where: { id: storeId },
          select: { deliveryFee: true, lat: true, lng: true },
        })
      : null;

    // Distance réelle de la course : du point de retrait au quartier de livraison.
    // Sans coordonnées de boutique ou sans quartier connu, elle reste indéterminée
    // et l'ancien tarif s'applique — mieux vaut un prix conservateur qu'un prix
    // calculé sur une distance inventée.
    const dropoff = zoneCenter(dto.deliveryAddress?.district);
    const pickup =
      store?.lat != null && store?.lng != null ? { lat: store.lat, lng: store.lng } : undefined;
    const distanceKm =
      pickup && dropoff ? roadMeters(pickup, dropoff) / 1000 : null;

    // NOVIGO Brain : c'est LUI qui arrête le tarif de livraison et le délai annoncé.
    // Quand la boutique impose ses frais, le Brain les respecte et se contente de
    // les expliquer ; sans boutique rattachée, il calcule (distance, trafic, tension).
    const quote = await this.brain
      .quote({
        orderType: dto.type,
        storeId: storeId ?? undefined,
        zone: dto.deliveryAddress?.district ?? undefined,
        subtotal,
        itemsCount: dto.items.length,
        clientId: userId,
        partnerFee: store ? store.deliveryFee : null,
      })
      .catch(() => null);
    // Barème officiel de la course (CDC v0.75 §2) : il fait autorité dès que la
    // distance est connue. Le Brain conserve l'ETA et l'explication du prix, mais
    // ne fixe plus le montant — deux barèmes concurrents donnaient deux prix.
    const tariffed = distanceKm == null ? null : quoteDelivery({ distanceKm });
    const deliveryFee =
      tariffed?.total ?? quote?.price.amount ?? store?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
    const total = subtotal + deliveryFee;
    const count = await this.prisma.order.count();
    const reference = `MLP-2026-${String(count + 1).padStart(6, "0")}`;

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
        // Lignes + total d'articles : sans eux la carte commerçant ne peut afficher
        // qu'un décompte inventé tant que le refetch n'a pas eu lieu.
        items: order.items.map((it: any) => ({
          name: it.name, quantity: it.quantity, unitPrice: money(it.unitPrice),
          optionsLabel: it.optionsLabel ?? undefined,
        })),
        itemsCount: order.items.reduce((s: number, it: any) => s + it.quantity, 0),
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

    // Une commande EST une mission du Brain (principe n°5) : le suivi, l'attribution
    // du livreur et l'apprentissage passeront désormais par lui.
    const mission = await this.brain.onOrderCreated({
      id: order.id,
      reference: order.reference,
      customerId: order.customerId,
      storeId: order.storeId,
      type: order.type,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      paymentMethod: order.paymentMethod,
      zone: order.addressDistrict,
    });

    return {
      ...mapOrder(order),
      // Décision du Brain rendue au client : délai annoncé et raisons du tarif.
      etaMinutes: quote?.etaMinutes ?? null,
      brain: quote
        ? {
            decisionId: quote.decisionId,
            missionReference: mission?.reference ?? null,
            reasons: quote.reasons,
            breakdown: quote.breakdown,
            balance: quote.balance,
          }
        : null,
    };
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

  /// Étape de la course au sens du barème d'annulation (CDC v0.75 §4).
  ///
  /// Le statut de commande décrit la préparation ; l'annulation, elle, se juge à
  /// l'avancement du LIVREUR. Un plat en préparation dont personne n'est encore
  /// venu s'occuper n'a coûté de déplacement à personne.
  private stageOf(order: { status: string }, delivery: { status?: string | null } | null): CourseStage {
    switch (delivery?.status) {
      case "PICKED_UP":
      case "EN_ROUTE_DROPOFF":
        return "IN_DELIVERY";
      case "ARRIVED":
        return "ARRIVED";
      case "ASSIGNED":
      case "ACCEPTED":
      case "EN_ROUTE_PICKUP":
        return "ACCEPTED";
      default:
        // Aucun livreur engagé : personne ne s'est déplacé, l'annulation reste
        // gratuite même si le commerçant a déjà confirmé la commande.
        return "PENDING";
    }
  }

  /// Annulations facturées au client depuis le 1er du mois — c'est ce compteur
  /// que le quota de cinq gratuités consomme.
  private async billedCancellationsThisMonth(customerId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.prisma.order.count({
      where: {
        customerId,
        status: "CANCELLED",
        cancellationFee: { gt: 0 },
        // `Order` ne porte pas de date de mise à jour : on compte sur le mois de
        // création. L'écart ne concerne qu'une commande créée fin de mois et
        // annulée début du suivant — assez rare pour ne pas justifier une
        // colonne de plus, mais à corriger si le quota devient contesté.
        createdAt: { gte: monthStart },
      },
    });
  }

  async cancel(id: string) {
    const o = await this.prisma.order.findUnique({ where: { id }, include: { delivery: true } });
    if (!o) throw new NotFoundException("Commande introuvable.");
    const cancellable = ["PENDING", "CONFIRMED", "PREPARING", "READY", "ASSIGNED"];
    if (!cancellable.includes(o.status)) {
      throw new BadRequestException("Cette commande ne peut plus être annulée.");
    }

    // Barème officiel (§4) : l'étape atteinte fixe le montant, le quota mensuel
    // peut l'effacer.
    const outcome = assessCancellation({
      stage: this.stageOf(o, o.delivery),
      acceptedAt: o.delivery?.acceptedAt ?? null,
      cancelledAt: new Date(),
      orderTotal: o.total,
      billedCancellationsThisMonth: await this.billedCancellationsThisMonth(o.customerId),
    });

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationFee: outcome.fee,
        cancellationReason: outcome.reason,
      },
    });
    // Le Brain apprend aussi des échecs (principe n°4).
    await this.brain.onOrderCancelled(id, outcome.reason).catch(() => undefined);
    return { ...mapOrder(updated), cancellation: outcome };
  }
}
