import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

function mapDriver(d: any) {
  return {
    id: d.id, userId: d.userId,
    userName: d.user ? [d.user.firstName, d.user.lastName].filter(Boolean).join(" ") || null : null,
    userPhone: d.user?.phone ?? null,
    vehicleType: d.vehicleType, plateNumber: d.plateNumber,
    kycStatus: d.kycStatus, isAvailable: d.isAvailable, rating: d.rating,
    totalDeliveries: d.totalDeliveries,
    documents: d.documents?.map((doc: any) => ({
      id: doc.id, type: doc.type, url: doc.url, status: doc.status, uploadedAt: doc.uploadedAt,
    })),
    createdAt: d.createdAt,
  };
}

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async listAdmin(page: number, limit: number, kycStatus?: string, search?: string) {
    const where: any = {};
    if (kycStatus) where.kycStatus = kycStatus;
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      };
    }
    const [rows, total] = await Promise.all([
      this.prisma.driver.findMany({
        where, include: { user: true }, orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.driver.count({ where }),
    ]);
    return paginate(rows.map(mapDriver), total, page, limit);
  }

  async get(id: string) {
    const d = await this.prisma.driver.findUnique({
      where: { id }, include: { user: true, documents: true },
    });
    if (!d) throw new NotFoundException("Livreur introuvable.");
    return mapDriver(d);
  }

  async me(userId: string) {
    const d = await this.prisma.driver.findUnique({
      where: { userId }, include: { user: true, documents: true },
    });
    if (!d) throw new NotFoundException("Profil livreur introuvable.");
    return mapDriver(d);
  }

  /** Onboarding : crée le profil livreur s'il manque, sinon le complète. */
  async upsertProfile(userId: string, dto: any) {
    const d = await this.prisma.driver.upsert({
      where: { userId },
      update: {
        vehicleType: dto.vehicleType ?? undefined,
        plateNumber: dto.plateNumber ?? undefined,
      },
      create: {
        userId,
        vehicleType: dto.vehicleType ?? null,
        plateNumber: dto.plateNumber ?? null,
      },
      include: { user: true, documents: true },
    });
    return mapDriver(d);
  }

  async setAvailability(userId: string, isAvailable: boolean, lat?: number, lng?: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException("Profil livreur introuvable.");
    const d = await this.prisma.driver.update({
      where: { id: driver.id },
      // La position transmise à la mise en ligne alimente le critère de proximité
      // du NOVIGO Brain (Service Decision Engine) — avant, elle était ignorée.
      data: {
        isAvailable,
        ...(lat != null && lng != null ? { lastLat: lat, lastLng: lng, lastSeenAt: new Date() } : {}),
      },
      include: { user: true },
    });
    return mapDriver(d);
  }

  async myDeliveries(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException("Profil livreur introuvable.");
    const rows = await this.prisma.delivery.findMany({
      where: { driverId: driver.id },
      orderBy: { id: "desc" },
      take: 50,
      // Référence, commerce et rémunération : l'historique de l'app livreur en a
      // besoin, sinon il ne peut afficher que des libellés inventés.
      include: { order: { select: { reference: true, deliveryFee: true, store: { select: { name: true } } } } },
    });
    return rows.map((d: any) => ({
      id: d.id, orderId: d.orderId, status: d.status,
      etaMinutes: d.etaMinutes, completedAt: d.completedAt,
      reference: d.order?.reference ?? null,
      storeName: d.order?.store?.name ?? null,
      payout: d.order ? money(d.order.deliveryFee) : null,
    }));
  }

  /// Gains du livreur, calculés sur les livraisons réellement terminées.
  /// La rémunération d'une course = les frais de livraison de sa commande
  /// (même base que l'événement `delivery.completed` publié vers la finance).
  async myEarnings(userId: string, now = new Date()) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException("Profil livreur introuvable.");
    const rows = await this.prisma.delivery.findMany({
      where: { driverId: driver.id, status: "COMPLETED" },
      select: { completedAt: true, order: { select: { deliveryFee: true } } },
    });

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6); // 7 jours glissants, aujourd'hui inclus

    let today = 0, todayCount = 0, week = 0, total = 0;
    for (const r of rows) {
      const fee = r.order?.deliveryFee ?? 0;
      total += fee;
      const at = r.completedAt;
      if (!at) continue;
      if (at >= startOfWeek) week += fee;
      if (at >= startOfToday) {
        today += fee;
        todayCount += 1;
      }
    }
    return {
      today: money(today), todayCount,
      week: money(week),
      total: money(total), totalCount: rows.length,
    };
  }

  async validate(id: string, decision: "APPROVED" | "REJECTED", actorId: string, reason?: string) {
    const d = await this.prisma.driver.findUnique({ where: { id } });
    if (!d) throw new NotFoundException("Livreur introuvable.");
    const updated = await this.prisma.driver.update({
      where: { id }, data: { kycStatus: decision }, include: { user: true, documents: true },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId, action: decision === "APPROVED" ? "DRIVER_VALIDATED" : "DRIVER_REJECTED",
        entityType: "Driver", entityId: id,
      },
    });
    return mapDriver(updated);
  }
}
