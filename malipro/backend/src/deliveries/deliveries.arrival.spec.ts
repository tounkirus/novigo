import { BadRequestException } from "@nestjs/common";
import { DeliveriesService } from "./deliveries.service";

/**
 * « Je suis arrivé » et ses conséquences (CDC v0.75 §3).
 *
 * Ces tests protègent la seule règle du §3 qui coûte de l'argent : la
 * compensation de 500 FCFA due au livreur quand le client ne se présente pas.
 */
describe("DeliveriesService — arrivée et attente (§3)", () => {
  const realtime = { emitTracking: jest.fn(), emitToUser: jest.fn() } as any;
  const notifications = { create: jest.fn().mockResolvedValue(undefined) } as any;
  const bus = { publish: jest.fn().mockResolvedValue(undefined) } as any;
  const brain = {
    onDeliveryAccepted: jest.fn(), onDeliveryStarted: jest.fn(),
    onDeliveryCompleted: jest.fn(), rankDeliveries: jest.fn(),
  } as any;

  const svc = (prisma: any) =>
    new DeliveriesService(prisma, realtime, notifications, bus, brain);

  /// Course appartenant au livreur `u1`, dans l'état demandé.
  const prismaWith = (delivery: any) => ({
    delivery: {
      findUnique: jest.fn().mockResolvedValue(delivery),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ ...delivery, ...data })),
    },
    order: {
      findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "client" }),
      update: jest.fn().mockResolvedValue({}),
    },
    driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1", userId: "u1" }) },
  }) as any;

  const base = {
    id: "dl1", orderId: "o1", driverId: "d1", status: "EN_ROUTE_DROPOFF",
    arrivedAt: null, driver: { userId: "u1" },
  };

  beforeEach(() => jest.clearAllMocks());

  it("horodate l'arrivée et passe la course en ARRIVED", async () => {
    const prisma = prismaWith({ ...base });
    await svc(prisma).arrive("dl1", "u1");
    const data = prisma.delivery.update.mock.calls[0][0].data;
    expect(data.status).toBe("ARRIVED");
    expect(data.arrivedAt).toBeInstanceOf(Date);
  });

  it("prévient le client que le livreur l'attend", async () => {
    await svc(prismaWith({ ...base })).arrive("dl1", "u1");
    expect(notifications.create).toHaveBeenCalledWith(
      "client", "ORDER_ARRIVED", expect.any(String), expect.any(String), { orderId: "o1" },
    );
  });

  it("est idempotent : un second appui ne redémarre pas le compteur", async () => {
    const arrivedAt = new Date("2026-08-02T10:00:00Z");
    const prisma = prismaWith({ ...base, status: "ARRIVED", arrivedAt });
    await svc(prisma).arrive("dl1", "u1");
    expect(prisma.delivery.update).not.toHaveBeenCalled();
  });

  it("refuse d'ouvrir l'attente sur une course terminée", async () => {
    const prisma = prismaWith({ ...base, status: "COMPLETED" });
    await expect(svc(prisma).arrive("dl1", "u1")).rejects.toThrow(BadRequestException);
  });

  describe("abandon pour client absent", () => {
    it("est refusé tant que « Je suis arrivé » n'a pas été pressé", async () => {
      const prisma = prismaWith({ ...base, arrivedAt: null });
      await expect(svc(prisma).cancelForAbsence("dl1", "u1")).rejects.toThrow(
        /Je suis arrivé/,
      );
    });

    it("est refusé avant les 20 minutes", async () => {
      const arrivedAt = new Date(Date.now() - 5 * 60_000);
      const prisma = prismaWith({ ...base, status: "ARRIVED", arrivedAt });
      await expect(svc(prisma).cancelForAbsence("dl1", "u1")).rejects.toThrow(
        /délai d'attente/,
      );
    });

    it("est autorisé après 20 minutes et verse 500 FCFA au livreur", async () => {
      const arrivedAt = new Date(Date.now() - 21 * 60_000);
      const prisma = prismaWith({ ...base, status: "ARRIVED", arrivedAt });
      const res = await svc(prisma).cancelForAbsence("dl1", "u1");
      expect(res.compensation).toBe(500);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) }),
      );
    });
  });

  it("expose l'attente écoulée sans que l'application ait à compter", async () => {
    const arrivedAt = new Date(Date.now() - 12 * 60_000);
    const prisma = prismaWith({ ...base, status: "ARRIVED", arrivedAt });
    const w = await svc(prisma).waiting("dl1", "u1");
    expect(w.waitedMinutes).toBeCloseTo(12, 1);
    expect(w.mayCancelForAbsence).toBe(false);
  });
});
