import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
  it("kpis : agrège GMV, compteurs et durée moyenne de livraison", async () => {
    const prisma = {
      order: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { total: 250000 } }),
        count: jest.fn().mockResolvedValue(42),
      },
      driver: { count: jest.fn().mockResolvedValue(7) },
      user: { count: jest.fn().mockResolvedValue(15) },
      delivery: {
        findMany: jest.fn().mockResolvedValue([
          { acceptedAt: new Date(0), completedAt: new Date(30 * 60000) }, // 30 min
          { acceptedAt: new Date(0), completedAt: new Date(20 * 60000) }, // 20 min
          { acceptedAt: new Date(10 * 60000), completedAt: new Date(0) }, // négatif -> filtré
        ]),
      },
    } as any;
    const res = await new AnalyticsService(prisma).kpis();
    expect(res.gmv).toEqual({ amount: 250000, currency: "XOF" });
    expect(res.ordersCount).toBe(42);
    expect(res.activeDrivers).toBe(7);
    expect(res.newCustomers).toBe(15);
    expect(res.avgDeliveryMinutes).toBe(25); // (30+20)/2
  });

  it("kpis : sans GMV ni livraisons -> valeurs neutres", async () => {
    const prisma = {
      order: { aggregate: jest.fn().mockResolvedValue({ _sum: { total: null } }), count: jest.fn().mockResolvedValue(0) },
      driver: { count: jest.fn().mockResolvedValue(0) },
      user: { count: jest.fn().mockResolvedValue(0) },
      delivery: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const res = await new AnalyticsService(prisma).kpis();
    expect(res.gmv.amount).toBe(0);
    expect(res.avgDeliveryMinutes).toBe(0);
  });
});
