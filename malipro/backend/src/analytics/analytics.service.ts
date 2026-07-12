import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async kpis() {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [gmvAgg, ordersCount, activeDrivers, newCustomers, deliveries] = await Promise.all([
      this.prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
      this.prisma.order.count(),
      this.prisma.driver.count({ where: { isAvailable: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: since }, roles: { has: "CUSTOMER" } } }),
      this.prisma.delivery.findMany({
        where: { status: "COMPLETED", acceptedAt: { not: null }, completedAt: { not: null } },
        select: { acceptedAt: true, completedAt: true },
        take: 200,
      }),
    ]);
    const durations = deliveries
      .map((d) => (d.completedAt!.getTime() - d.acceptedAt!.getTime()) / 60000)
      .filter((m) => m > 0);
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return {
      gmv: { amount: gmvAgg._sum.total ?? 0, currency: "XOF" },
      ordersCount,
      activeDrivers,
      newCustomers,
      avgDeliveryMinutes: Math.round(avg * 10) / 10,
    };
  }
}
