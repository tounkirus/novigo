import { NotFoundException } from "@nestjs/common";
import { OrdersService } from "./orders.service";

describe("OrdersService.trackByCode", () => {
  it("404 si code inconnu", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new OrdersService(prisma).trackByCode("XXXX")).rejects.toThrow(NotFoundException);
  });

  it("renvoie un suivi limité", async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          reference: "MLP-2026-000842", status: "IN_TRANSIT", type: "FOOD", createdAt: new Date(),
          items: [{}, {}], total: 9000, currency: "XOF",
          delivery: { status: "IN_TRANSIT", driver: { user: { firstName: "Modibo" } } },
        }),
      },
    } as any;
    const res = await new OrdersService(prisma).trackByCode("ABCDEFGHJK");
    expect(res.status).toBe("IN_TRANSIT");
    expect(res.itemsCount).toBe(2);
    expect(res.total.amount).toBe(9000);
    expect(res.delivery?.driverName).toBe("Modibo");
  });
});
