import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ReferralsService } from "./referrals.service";

const notifications = { create: jest.fn() } as any;

describe("ReferralsService.apply", () => {
  const make = (prisma: any) => new ReferralsService(prisma, notifications);

  it("rejette un code invalide", async () => {
    const prisma = { referral: { findUnique: jest.fn().mockResolvedValue(null) }, user: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(make(prisma).apply("me", "BADCODE")).rejects.toThrow(NotFoundException);
  });

  it("empêche l'auto-parrainage", async () => {
    const prisma = { referral: { findUnique: jest.fn().mockResolvedValue(null) }, user: { findUnique: jest.fn().mockResolvedValue({ id: "me", referralCode: "X" }) } } as any;
    await expect(make(prisma).apply("me", "X")).rejects.toThrow(BadRequestException);
  });

  it("rejette un utilisateur déjà parrainé", async () => {
    const prisma = { referral: { findUnique: jest.fn().mockResolvedValue({ id: "r1" }) } } as any;
    await expect(make(prisma).apply("me", "X")).rejects.toThrow(BadRequestException);
  });

  it("crédite le parrain et notifie", async () => {
    const prisma = {
      referral: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ id: "ref", referralCode: "CODE1234" }) },
      wallet: { upsert: jest.fn() },
      $transaction: jest.fn(async (arr: any[]) => Promise.all(arr)),
    } as any;
    const res = await make(prisma).apply("me", "CODE1234");
    expect(res.rewarded).toBe(true);
    expect(res.bonus.amount).toBe(500);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(notifications.create).toHaveBeenCalled();
  });
});

describe("ReferralsService.myReferral", () => {
  it("génère un code si absent", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: "me", referralCode: null }),
              update: jest.fn().mockResolvedValue({ id: "me", referralCode: "NEWCODE1" }) },
      referral: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const res = await new ReferralsService(prisma, notifications).myReferral("me");
    expect(res.code).toBe("NEWCODE1");
    expect(res.totalEarned.amount).toBe(0);
  });
});
