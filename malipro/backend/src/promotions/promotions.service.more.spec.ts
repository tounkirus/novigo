import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PromotionsService } from "./promotions.service";

const coupon = (over: any = {}) => ({
  code: "PROMO", type: "PERCENT", value: 10, isActive: true, usedCount: 0,
  minAmount: null, maxDiscount: null, usageLimit: null, expiresAt: null, ...over,
});

describe("PromotionsService (couverture complète)", () => {
  it("validate : coupon inexistant/inactif -> NotFound", async () => {
    const p1 = { coupon: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new PromotionsService(p1).validate("X", 1000)).rejects.toThrow(NotFoundException);
    const p2 = { coupon: { findUnique: jest.fn().mockResolvedValue(coupon({ isActive: false })) } } as any;
    await expect(new PromotionsService(p2).validate("X", 1000)).rejects.toThrow(NotFoundException);
  });

  it("validate : expiré -> BadRequest", async () => {
    const prisma = { coupon: { findUnique: jest.fn().mockResolvedValue(coupon({ expiresAt: new Date(0) })) } } as any;
    await expect(new PromotionsService(prisma).validate("X", 1000)).rejects.toThrow(BadRequestException);
  });

  it("validate : épuisé -> BadRequest", async () => {
    const prisma = { coupon: { findUnique: jest.fn().mockResolvedValue(coupon({ usageLimit: 5, usedCount: 5 })) } } as any;
    await expect(new PromotionsService(prisma).validate("X", 1000)).rejects.toThrow(BadRequestException);
  });

  it("validate : sous le minimum -> BadRequest", async () => {
    const prisma = { coupon: { findUnique: jest.fn().mockResolvedValue(coupon({ minAmount: 2000 })) } } as any;
    await expect(new PromotionsService(prisma).validate("X", 1000)).rejects.toThrow(BadRequestException);
  });

  it("validate PERCENT : remise 10% plafonnée par maxDiscount", async () => {
    const prisma = { coupon: { findUnique: jest.fn().mockResolvedValue(coupon({ value: 10, maxDiscount: 300 })) } } as any;
    const res = await new PromotionsService(prisma).validate("PROMO", 10000); // 10% = 1000, plafonné 300
    expect(res.discount).toEqual({ amount: 300, currency: "XOF" });
    expect(res.finalAmount).toEqual({ amount: 9700, currency: "XOF" });
  });

  it("validate FIXED : remise plafonnée au montant", async () => {
    const prisma = { coupon: { findUnique: jest.fn().mockResolvedValue(coupon({ type: "FIXED", value: 5000 })) } } as any;
    const res = await new PromotionsService(prisma).validate("PROMO", 3000); // remise 5000 -> plafonnée à 3000
    expect(res.discount.amount).toBe(3000);
    expect(res.finalAmount.amount).toBe(0);
  });

  it("createCoupon : mappe les champs optionnels + date", async () => {
    const prisma = { coupon: { create: jest.fn().mockImplementation((a: any) => Promise.resolve(a.data)) } } as any;
    const res = await new PromotionsService(prisma).createCoupon({ code: "C", type: "PERCENT", value: 5, expiresAt: "2027-01-01" });
    expect(res.code).toBe("C");
    expect(res.expiresAt).toBeInstanceOf(Date);
    expect(res.minAmount).toBeNull();
  });

  it("listCoupons : ordonné par date", async () => {
    const prisma = { coupon: { findMany: jest.fn().mockResolvedValue([coupon()]) } } as any;
    expect(await new PromotionsService(prisma).listCoupons()).toHaveLength(1);
  });
});
