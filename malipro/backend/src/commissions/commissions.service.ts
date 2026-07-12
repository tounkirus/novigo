import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  private async ensure() {
    const existing = await this.prisma.commissionSettings.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.commissionSettings.create({ data: { id: 1 } });
  }

  async get() {
    const c = await this.ensure();
    return {
      deliveryPercent: c.deliveryPercent, merchantPercent: c.merchantPercent,
      artisanPercent: c.artisanPercent, updatedAt: c.updatedAt,
    };
  }

  async update(body: { deliveryPercent: number; merchantPercent: number; artisanPercent: number }, actorId: string) {
    await this.ensure();
    const c = await this.prisma.commissionSettings.update({ where: { id: 1 }, data: body });
    await this.prisma.auditLog.create({
      data: { actorId, action: "COMMISSIONS_UPDATED", entityType: "CommissionSettings" },
    });
    return {
      deliveryPercent: c.deliveryPercent, merchantPercent: c.merchantPercent,
      artisanPercent: c.artisanPercent, updatedAt: c.updatedAt,
    };
  }
}
