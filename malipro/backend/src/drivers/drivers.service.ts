import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

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
      data: { isAvailable },
      include: { user: true },
    });
    return mapDriver(d);
  }

  async myDeliveries(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException("Profil livreur introuvable.");
    const rows = await this.prisma.delivery.findMany({
      where: { driverId: driver.id }, orderBy: { id: "desc" }, take: 50,
    });
    return rows.map((d) => ({
      id: d.id, orderId: d.orderId, status: d.status,
      etaMinutes: d.etaMinutes, completedAt: d.completedAt,
    }));
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
