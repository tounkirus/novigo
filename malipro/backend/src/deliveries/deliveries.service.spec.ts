import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { DeliveriesService } from "./deliveries.service";

const realtime = { emitTracking: jest.fn() } as any;
const notifications = { create: jest.fn() } as any;
/// Bus finance (Spring) stubbé : les tests unitaires ne vérifient que le métier.
const bus = { publish: jest.fn() } as any;
/// Brain stubbé : le classement et l'apprentissage sont testés dans src/brain.
const brain = {
  scoreOffersFor: jest.fn().mockResolvedValue(new Map()),
  onDeliveryAccepted: jest.fn().mockResolvedValue(null),
  onDeliveryStarted: jest.fn().mockResolvedValue(null),
  onDeliveryCompleted: jest.fn().mockResolvedValue(null),
} as any;
const svc = (prisma: any) => new DeliveriesService(prisma, realtime, notifications, bus, brain);

describe("DeliveriesService", () => {
  it("accept : assigne une livraison libre", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: {
        findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "UNASSIGNED", driverId: null, orderId: "o1" }),
        update: jest.fn().mockResolvedValue({ id: "dl1", status: "ACCEPTED", driverId: "d1", orderId: "o1" }),
      },
      order: { update: jest.fn().mockResolvedValue({}) },
    } as any;
    const res = await svc(prisma).accept("dl1", "u1");
    expect(res.status).toBe("ACCEPTED");
    expect(prisma.order.update).toHaveBeenCalled();
  });

  it("accept : conflit si déjà prise", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: { findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "ACCEPTED", driverId: "dx", orderId: "o1" }) },
    } as any;
    await expect(svc(prisma).accept("dl1", "u1")).rejects.toThrow(ConflictException);
  });

  it("start : refuse une livraison d'un autre livreur", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: { findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "ACCEPTED", driverId: "other", orderId: "o1" }) },
    } as any;
    await expect(svc(prisma).start("dl1", "u1")).rejects.toThrow(ForbiddenException);
  });

  it("start : transition invalide si pas ACCEPTED", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: { findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "UNASSIGNED", driverId: "d1", orderId: "o1" }) },
    } as any;
    await expect(svc(prisma).start("dl1", "u1")).rejects.toThrow(BadRequestException);
  });

  beforeEach(() => jest.clearAllMocks());

  it("available : liste les livraisons libres et mappe pickup/dropoff", async () => {
    const prisma = {
      delivery: {
        findMany: jest.fn().mockResolvedValue([
          { id: "dl1", orderId: "o1", status: "UNASSIGNED", pickupLat: 12, pickupLng: -8, dropoffLat: 13, dropoffLng: -7 },
          { id: "dl2", orderId: "o2", status: "UNASSIGNED", pickupLat: null, dropoffLat: null },
        ]),
      },
    } as any;
    const res = await svc(prisma).available();
    expect(res).toHaveLength(2);
    expect(res[0].pickupLocation).toEqual({ lat: 12, lng: -8 });
    expect(res[0].dropoffLocation).toEqual({ lat: 13, lng: -7 });
    expect(res[1].pickupLocation).toBeUndefined();
    expect(res[1].dropoffLocation).toBeUndefined();
    expect(prisma.delivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "UNASSIGNED" }, orderBy: { id: "asc" }, take: 50 }),
    );
  });

  it("available : porte le contexte de la commande (commerce, client, articles, payout)", async () => {
    const prisma = {
      delivery: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "dl1", orderId: "o1", status: "UNASSIGNED",
            order: {
              reference: "MLP-2026-000031", total: 4000, deliveryFee: 500,
              addressLine1: "Rue 250", addressDistrict: "Hamdallaye", addressCity: "Bamako",
              store: { id: "s1", name: "Chez Fatou", address: "ACI 2000" },
              customer: { firstName: "Awa", lastName: "Traoré" },
              items: [{ quantity: 2 }, { quantity: 1 }],
            },
          },
        ]),
      },
    } as any;
    const [row] = await svc(prisma).available();
    expect(row.reference).toBe("MLP-2026-000031");
    expect(row.store).toEqual({ id: "s1", name: "Chez Fatou", address: "ACI 2000" });
    expect(row.customerName).toBe("Awa Traoré");
    expect(row.dropoffAddress).toBe("Rue 250 · Hamdallaye · Bamako");
    expect(row.itemsCount).toBe(3);
    expect(row.payout).toEqual({ amount: 500, currency: "XOF" });
    expect(row.orderTotal).toEqual({ amount: 4000, currency: "XOF" });
  });

  it("available : commande absente -> champs neutres, aucune valeur inventée", async () => {
    const prisma = {
      delivery: { findMany: jest.fn().mockResolvedValue([{ id: "dl1", orderId: "o1", status: "UNASSIGNED", order: null }]) },
    } as any;
    const [row] = await svc(prisma).available();
    expect(row.reference).toBeNull();
    expect(row.store).toBeNull();
    expect(row.customerName).toBeNull();
    expect(row.itemsCount).toBe(0);
    expect(row.payout).toBeNull();
  });

  it("get : retourne la livraison mappée", async () => {
    const prisma = {
      delivery: { findUnique: jest.fn().mockResolvedValue({ id: "dl1", orderId: "o1", status: "ACCEPTED" }) },
    } as any;
    const res = await svc(prisma).get("dl1");
    expect(res.id).toBe("dl1");
  });

  it("get : NotFound si absente", async () => {
    const prisma = { delivery: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).get("dl1")).rejects.toThrow(NotFoundException);
  });

  it("accept : Forbidden si pas de profil livreur", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).accept("dl1", "u1")).rejects.toThrow(ForbiddenException);
  });

  it("accept : NotFound si livraison absente", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    await expect(svc(prisma).accept("dl1", "u1")).rejects.toThrow(NotFoundException);
  });

  it("accept : conflit si driverId déjà défini mais statut UNASSIGNED", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: { findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "UNASSIGNED", driverId: "dx", orderId: "o1" }) },
    } as any;
    await expect(svc(prisma).accept("dl1", "u1")).rejects.toThrow(ConflictException);
  });

  it("accept : émet le tracking ASSIGNED", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: {
        findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "UNASSIGNED", driverId: null, orderId: "o1" }),
        update: jest.fn().mockResolvedValue({ id: "dl1", status: "ACCEPTED", driverId: "d1", orderId: "o1" }),
      },
      order: { update: jest.fn().mockResolvedValue({}) },
    } as any;
    await svc(prisma).accept("dl1", "u1");
    expect(realtime.emitTracking).toHaveBeenCalledWith("o1", { orderId: "o1", status: "ASSIGNED" });
  });

  it("reject : passe son tour et renvoie rejected", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }) } } as any;
    const res = await svc(prisma).reject("dl1", "u1");
    expect(res).toEqual({ rejected: true });
  });

  it("reject : Forbidden si pas de profil livreur", async () => {
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).reject("dl1", "u1")).rejects.toThrow(ForbiddenException);
  });

  it("start : passe en EN_ROUTE_DROPOFF et émet IN_TRANSIT", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: {
        findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "ACCEPTED", driverId: "d1", orderId: "o1" }),
        update: jest.fn().mockResolvedValue({ id: "dl1", status: "EN_ROUTE_DROPOFF", orderId: "o1" }),
      },
      order: { update: jest.fn().mockResolvedValue({}) },
    } as any;
    const res = await svc(prisma).start("dl1", "u1");
    expect(res.status).toBe("EN_ROUTE_DROPOFF");
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: "o1" }, data: { status: "IN_TRANSIT" } });
    expect(realtime.emitTracking).toHaveBeenCalledWith("o1", { orderId: "o1", status: "IN_TRANSIT" });
  });

  it("start : NotFound si livraison absente", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    await expect(svc(prisma).start("dl1", "u1")).rejects.toThrow(NotFoundException);
  });

  it("complete : termine la livraison, incrémente le compteur et notifie le client", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: {
        findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "EN_ROUTE_DROPOFF", driverId: "d1", orderId: "o1" }),
        update: jest.fn().mockResolvedValue({ id: "dl1", status: "COMPLETED", orderId: "o1" }),
      },
      order: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "c1" }),
      },
    } as any;
    const res = await svc(prisma).complete("dl1", "u1");
    expect(res.status).toBe("COMPLETED");
    expect(prisma.driver.update).toHaveBeenCalledWith({ where: { id: "d1" }, data: { totalDeliveries: { increment: 1 } } });
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: "o1" }, data: { status: "DELIVERED" } });
    expect(realtime.emitTracking).toHaveBeenCalledWith("o1", { orderId: "o1", status: "DELIVERED" });
    expect(notifications.create).toHaveBeenCalledWith("c1", "ORDER_DELIVERED", "Commande livrée", expect.any(String), { orderId: "o1" });
  });

  it("complete : sans driverId n'incrémente pas et sans commande ne notifie pas", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: null }), update: jest.fn() },
      delivery: {
        findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "ACCEPTED", driverId: null, orderId: "o1" }),
        update: jest.fn().mockResolvedValue({ id: "dl1", status: "COMPLETED", orderId: "o1" }),
      },
      order: { update: jest.fn().mockResolvedValue({}), findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const res = await svc(prisma).complete("dl1", "u1");
    expect(res.status).toBe("COMPLETED");
    expect(prisma.driver.update).not.toHaveBeenCalled();
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it("complete : BadRequest si déjà terminée", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: { findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "COMPLETED", driverId: "d1", orderId: "o1" }) },
    } as any;
    await expect(svc(prisma).complete("dl1", "u1")).rejects.toThrow(BadRequestException);
  });

  it("updateLocation : met à jour la position et émet le tracking", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: {
        findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "EN_ROUTE_DROPOFF", driverId: "d1", orderId: "o1", etaMinutes: 10 }),
        update: jest.fn().mockResolvedValue({}),
      },
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", status: "IN_TRANSIT" }) },
    } as any;
    const res = await svc(prisma).updateLocation("dl1", "u1", 12.5, -8.1);
    expect(res).toEqual({ ok: true });
    expect(prisma.delivery.update).toHaveBeenCalledWith({ where: { id: "dl1" }, data: { driverLat: 12.5, driverLng: -8.1 } });
    expect(realtime.emitTracking).toHaveBeenCalledWith("o1", {
      orderId: "o1", status: "IN_TRANSIT", driverLocation: { lat: 12.5, lng: -8.1 }, etaMinutes: 10,
    });
  });

  it("updateLocation : commande absente => status undefined dans le tracking", async () => {
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "d1" }), update: jest.fn().mockResolvedValue({}) },
      delivery: {
        findUnique: jest.fn().mockResolvedValue({ id: "dl1", status: "ACCEPTED", driverId: "d1", orderId: "o1" }),
        update: jest.fn().mockResolvedValue({}),
      },
      order: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    await svc(prisma).updateLocation("dl1", "u1", 1, 2);
    expect(realtime.emitTracking).toHaveBeenCalledWith("o1", expect.objectContaining({ status: undefined }));
  });

  it("reportIssue : crée un signalement", async () => {
    const prisma = {
      delivery: { findUnique: jest.fn().mockResolvedValue({ id: "dl1", orderId: "o1" }) },
      deliveryIssue: { create: jest.fn().mockResolvedValue({ id: "iss1", type: "DAMAGE", createdAt: new Date(0) }) },
    } as any;
    const res = await svc(prisma).reportIssue("dl1", "u1", "DAMAGE", "colis abîmé");
    expect(res).toEqual({ id: "iss1", deliveryId: "dl1", type: "DAMAGE", createdAt: new Date(0) });
    expect(prisma.deliveryIssue.create).toHaveBeenCalledWith({ data: { deliveryId: "dl1", reporterId: "u1", type: "DAMAGE", description: "colis abîmé" } });
  });

  it("reportIssue : NotFound si livraison absente", async () => {
    const prisma = { delivery: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).reportIssue("dl1", "u1", "DAMAGE", "x")).rejects.toThrow(NotFoundException);
  });
});
