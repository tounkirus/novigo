import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PromotionsService } from "./promotions.service";

const coupon = (over: any = {}) => ({
  id: "c1", code: "BIENVENUE10", type: "PERCENT", value: 10, minAmount: 2000,
  maxDiscount: 1000, usageLimit: null, usedCount: 0, isActive: true, expiresAt: null, ...over,
});
const svc = (c: any) => new PromotionsService({ coupon: { findUnique: jest.fn().mockResolvedValue(c) } } as any);

describe("PromotionsService.validate", () => {
  it("calcule une remise en pourcentage (plafonnée)", async () => {
    const res = await svc(coupon()).validate("BIENVENUE10", 5000);
    expect(res.discount.amount).toBe(500);
    expect(res.finalAmount.amount).toBe(4500);
  });

  it("plafonne au maxDiscount", async () => {
    const res = await svc(coupon()).validate("BIENVENUE10", 50000);
    expect(res.discount.amount).toBe(1000);
  });

  it("rejette un code inconnu", async () => {
    await expect(svc(null).validate("XXX", 5000)).rejects.toThrow(NotFoundException);
  });

  it("rejette si montant minimum non atteint", async () => {
    await expect(svc(coupon()).validate("BIENVENUE10", 1000)).rejects.toThrow(BadRequestException);
  });

  it("rejette un coupon expiré", async () => {
    await expect(svc(coupon({ expiresAt: new Date(Date.now() - 1000) })).validate("BIENVENUE10", 5000))
      .rejects.toThrow(BadRequestException);
  });
});
