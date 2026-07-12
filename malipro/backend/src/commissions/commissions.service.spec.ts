import { CommissionsService } from "./commissions.service";

describe("CommissionsService", () => {
  const settings = { deliveryPercent: 12.5, merchantPercent: 15, artisanPercent: 10, updatedAt: new Date(0) };

  it("get : renvoie les réglages existants", async () => {
    const prisma = { commissionSettings: { findUnique: jest.fn().mockResolvedValue({ id: 1, ...settings }) } } as any;
    expect(await new CommissionsService(prisma).get()).toMatchObject({ deliveryPercent: 12.5, merchantPercent: 15 });
  });

  it("get : crée les réglages par défaut s'ils manquent", async () => {
    const prisma = {
      commissionSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1, ...settings }),
      },
    } as any;
    await new CommissionsService(prisma).get();
    expect(prisma.commissionSettings.create).toHaveBeenCalledWith({ data: { id: 1 } });
  });

  it("update : applique les nouveaux taux et journalise", async () => {
    const prisma = {
      commissionSettings: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, ...settings }),
        update: jest.fn().mockResolvedValue({ id: 1, deliveryPercent: 20, merchantPercent: 18, artisanPercent: 12, updatedAt: new Date(0) }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    } as any;
    const res = await new CommissionsService(prisma).update({ deliveryPercent: 20, merchantPercent: 18, artisanPercent: 12 }, "admin");
    expect(res.deliveryPercent).toBe(20);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "COMMISSIONS_UPDATED" }) }));
  });
});
