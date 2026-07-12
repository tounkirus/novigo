import { NotFoundException } from "@nestjs/common";
import { DriversService } from "./drivers.service";

const driverRow = (over: any = {}) => ({
  id: "d1", userId: "u1", vehicleType: "MOTO", plateNumber: "ML-1", kycStatus: "PENDING",
  isAvailable: false, rating: 4.5, totalDeliveries: 12, createdAt: new Date(0),
  user: { firstName: "Moussa", lastName: "Diarra", phone: "+22370" },
  documents: [{ id: "doc1", type: "ID", url: "u", status: "PENDING", uploadedAt: new Date(0) }],
  ...over,
});

describe("DriversService", () => {
  it("listAdmin : filtre kyc + recherche, mappe et pagine", async () => {
    const prisma = {
      driver: { findMany: jest.fn().mockResolvedValue([driverRow()]), count: jest.fn().mockResolvedValue(1) },
    } as any;
    const res = await new DriversService(prisma).listAdmin(1, 10, "PENDING", "Mou");
    expect(res.data[0]).toMatchObject({ userName: "Moussa Diarra", userPhone: "+22370" });
    const call = prisma.driver.findMany.mock.calls[0][0];
    expect(call.where.kycStatus).toBe("PENDING");
    expect(call.where.user.OR).toBeDefined();
  });

  it("get : introuvable -> NotFound ; trouvé -> mappe", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new DriversService(prisma).get("x")).rejects.toThrow(NotFoundException);
    prisma.driver.findUnique.mockResolvedValue(driverRow());
    expect((await new DriversService(prisma).get("d1")).id).toBe("d1");
  });

  it("me : profil absent -> NotFound", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new DriversService(prisma).me("u1")).rejects.toThrow(NotFoundException);
  });

  it("upsertProfile : crée/complète le profil", async () => {
    const prisma = { driver: { upsert: jest.fn().mockResolvedValue(driverRow({ vehicleType: "VELO" })) } } as any;
    const res = await new DriversService(prisma).upsertProfile("u1", { vehicleType: "VELO" });
    expect(res.vehicleType).toBe("VELO");
    expect(prisma.driver.upsert).toHaveBeenCalled();
  });

  it("setAvailability : profil absent -> NotFound ; sinon met à jour", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new DriversService(prisma).setAvailability("u1", true)).rejects.toThrow(NotFoundException);
    prisma.driver.findUnique.mockResolvedValue({ id: "d1" });
    prisma.driver.update = jest.fn().mockResolvedValue(driverRow({ isAvailable: true }));
    expect((await new DriversService(prisma).setAvailability("u1", true, 1, 2)).isAvailable).toBe(true);
  });

  it("myDeliveries : profil absent -> NotFound ; sinon liste", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new DriversService(prisma).myDeliveries("u1")).rejects.toThrow(NotFoundException);
    prisma.driver.findUnique.mockResolvedValue({ id: "d1" });
    prisma.delivery = { findMany: jest.fn().mockResolvedValue([{ id: "dl1", orderId: "o1", status: "COMPLETED", etaMinutes: 10, completedAt: new Date(0) }]) };
    const res = await new DriversService(prisma).myDeliveries("u1");
    expect(res[0]).toMatchObject({ id: "dl1", status: "COMPLETED" });
  });

  it("validate : introuvable -> NotFound", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new DriversService(prisma).validate("d1", "APPROVED", "admin")).rejects.toThrow(NotFoundException);
  });

  it("validate : approuve, met à jour KYC et journalise l'audit", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue(driverRow({ kycStatus: "APPROVED" })) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    } as any;
    const res = await new DriversService(prisma).validate("d1", "APPROVED", "admin", "ok");
    expect(res.kycStatus).toBe("APPROVED");
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "DRIVER_VALIDATED" }) }));
  });
});
