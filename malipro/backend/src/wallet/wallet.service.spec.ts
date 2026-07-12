import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { WalletService } from "./wallet.service";

const txPassthrough = { $transaction: jest.fn(async (arr: any[]) => Promise.all(arr)) };

describe("WalletService.withdraw", () => {
  it("refuse un solde insuffisant", async () => {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 1000, isLocked: false }) },
    } as any;
    await expect(new WalletService(prisma).withdraw("u1", 3000, "ORANGE_MONEY")).rejects.toThrow(BadRequestException);
  });

  it("débite le portefeuille", async () => {
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 10000, isLocked: false, updatedAt: new Date() }),
        update: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 7000, isLocked: false, updatedAt: new Date() }),
      },
      transaction: { create: jest.fn().mockResolvedValue({}) },
      ...txPassthrough,
    } as any;
    const res = await new WalletService(prisma).withdraw("u1", 3000, "ORANGE_MONEY");
    expect(res.balance.amount).toBe(7000);
  });
});

describe("WalletService.transfer", () => {
  const base = () => ({
    wallet: {
      findUnique: jest.fn().mockImplementation(({ where }: any) =>
        where.userId === "u1"
          ? { id: "ws", userId: "u1", balance: 5000, isLocked: false }
          : { id: "wr", userId: "u2", balance: 1000, isLocked: false }),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
    },
    user: { findUnique: jest.fn().mockResolvedValue({ id: "u2", phone: "+22371000000" }) },
    transaction: { create: jest.fn().mockResolvedValue({}) },
    ...txPassthrough,
  });

  it("refuse un destinataire inconnu", async () => {
    const prisma = base() as any;
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(new WalletService(prisma).transfer("u1", "+22371000000", 2000)).rejects.toThrow(NotFoundException);
  });

  it("transfère et débite l'émetteur", async () => {
    const prisma = base() as any;
    const res = await new WalletService(prisma).transfer("u1", "+22371000000", 2000);
    expect(res.balance.amount).toBe(3000);
    expect(res.transferred.amount).toBe(2000);
    expect(res.to).toBe("+22371000000");
  });

  it("refuse un montant invalide (<= 0)", async () => {
    const prisma = base() as any;
    await expect(new WalletService(prisma).transfer("u1", "+22371000000", 0)).rejects.toThrow(BadRequestException);
  });

  it("refuse un émetteur verrouillé", async () => {
    const prisma = base() as any;
    prisma.wallet.findUnique.mockImplementation(({ where }: any) =>
      where.userId === "u1"
        ? { id: "ws", userId: "u1", balance: 5000, isLocked: true }
        : { id: "wr", userId: "u2", balance: 1000, isLocked: false });
    await expect(new WalletService(prisma).transfer("u1", "+22371000000", 2000)).rejects.toThrow(ForbiddenException);
  });

  it("refuse un solde insuffisant", async () => {
    const prisma = base() as any;
    prisma.wallet.findUnique.mockImplementation(({ where }: any) =>
      where.userId === "u1"
        ? { id: "ws", userId: "u1", balance: 100, isLocked: false }
        : { id: "wr", userId: "u2", balance: 1000, isLocked: false });
    await expect(new WalletService(prisma).transfer("u1", "+22371000000", 2000)).rejects.toThrow(BadRequestException);
  });

  it("refuse un transfert vers soi-même", async () => {
    const prisma = base() as any;
    prisma.user.findUnique.mockResolvedValue({ id: "u1", phone: "+22371000000" });
    await expect(new WalletService(prisma).transfer("u1", "+22371000000", 2000)).rejects.toThrow(BadRequestException);
  });
});

describe("WalletService.withdraw (branches supplémentaires)", () => {
  it("refuse un portefeuille verrouillé", async () => {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 10000, isLocked: true }) },
    } as any;
    await expect(new WalletService(prisma).withdraw("u1", 3000, "ORANGE_MONEY")).rejects.toThrow(ForbiddenException);
  });

  it("refuse un montant invalide (<= 0)", async () => {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 10000, isLocked: false }) },
    } as any;
    await expect(new WalletService(prisma).withdraw("u1", 0, "ORANGE_MONEY")).rejects.toThrow(BadRequestException);
  });
});

describe("WalletService.balance", () => {
  it("retourne le solde d'un portefeuille existant", async () => {
    const updatedAt = new Date();
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 4200, isLocked: false, updatedAt }) },
    } as any;
    const res = await new WalletService(prisma).balance("u1");
    expect(res.id).toBe("w1");
    expect(res.userId).toBe("u1");
    expect(res.balance).toEqual({ amount: 4200, currency: "XOF" });
    expect(res.isLocked).toBe(false);
  });

  it("crée le portefeuille s'il n'existe pas (ensure)", async () => {
    const created = { id: "wnew", userId: "u1", balance: 0, isLocked: false, updatedAt: new Date() };
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(created),
      },
    } as any;
    const res = await new WalletService(prisma).balance("u1");
    expect(prisma.wallet.create).toHaveBeenCalledWith({ data: { userId: "u1" } });
    expect(res.id).toBe("wnew");
    expect(res.balance.amount).toBe(0);
  });
});

describe("WalletService.deposit", () => {
  it("crédite le portefeuille", async () => {
    const updatedAt = new Date();
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 1000, isLocked: false, updatedAt }),
        update: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 6000, isLocked: false, updatedAt }),
      },
      transaction: { create: jest.fn().mockResolvedValue({}) },
      ...txPassthrough,
    } as any;
    const res = await new WalletService(prisma).deposit("u1", 5000, "WAVE");
    expect(res.balance.amount).toBe(6000);
    expect(prisma.wallet.update).toHaveBeenCalledWith({ where: { id: "w1" }, data: { balance: 6000 } });
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "DEPOSIT", reference: "DEP-WAVE" }) }),
    );
  });
});

describe("WalletService.transactions", () => {
  it("pagine l'historique des transactions", async () => {
    const createdAt = new Date();
    const rows = [
      { id: "t1", walletId: "w1", type: "DEPOSIT", amount: 5000, balanceAfter: 5000, reference: "DEP-WAVE", createdAt },
      { id: "t2", walletId: "w1", type: "WITHDRAWAL", amount: 2000, balanceAfter: 3000, reference: "WDR-ORANGE_MONEY", createdAt },
    ];
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 3000, isLocked: false }) },
      transaction: {
        findMany: jest.fn().mockResolvedValue(rows),
        count: jest.fn().mockResolvedValue(2),
      },
    } as any;
    const res = await new WalletService(prisma).transactions("u1", 1, 20);
    expect(res.data).toHaveLength(2);
    expect(res.data[0]).toEqual(expect.objectContaining({
      id: "t1", type: "DEPOSIT", amount: { amount: 5000, currency: "XOF" }, balanceAfter: { amount: 5000, currency: "XOF" },
    }));
    expect(res.meta.total).toBe(2);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { walletId: "w1" }, skip: 0, take: 20,
    }));
  });
});
