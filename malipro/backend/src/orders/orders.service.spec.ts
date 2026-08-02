import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OrdersService } from "./orders.service";

/// Le service dépend aussi de la passerelle temps réel et du bus d'événements :
/// les tests unitaires les stubbent, seul le calcul métier est vérifié ici.
const svc = (prisma: any) =>
  new OrdersService(
    prisma,
    { emitToUsers: jest.fn() } as any,
    { publish: jest.fn() } as any,
    brainStub() as any,
  );

/// NOVIGO Brain stubbé : il décide du tarif/délai, on ne re-teste pas ses moteurs ici.
const brainStub = () => ({
  // Le tarif partenaire transmis par OrdersService est celui que le Brain restitue
  // (le vrai moteur respecte les frais de la boutique) ; sinon tarif par défaut.
  quote: jest.fn().mockImplementation(async (input: any) => ({
    price: { amount: input?.partnerFee ?? 1000, currency: "XOF" },
    etaMinutes: 25,
    reasons: ["stub"],
    breakdown: [],
    balance: { client: 80, provider: 80, partner: 80, novigo: 50 },
    decisionId: "dec-1",
  })),
  onOrderCreated: jest.fn().mockResolvedValue({ reference: "NVG-M-2026-000001" }),
  onOrderCancelled: jest.fn().mockResolvedValue(null),
});

describe("OrdersService", () => {
  it("trackByCode : suivi introuvable -> NotFound", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).trackByCode("XXX")).rejects.toThrow(NotFoundException);
  });

  it("trackByCode : renvoie le suivi avec livreur assigné", async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          reference: "MLP-1", status: "ASSIGNED", type: "FOOD", createdAt: new Date(0),
          items: [{ id: "i1" }, { id: "i2" }], total: 6000, currency: "XOF",
          delivery: { status: "IN_PROGRESS", driver: { user: { firstName: "Amadou" } } },
        }),
      },
    } as any;
    const res = await svc(prisma).trackByCode("ABC");
    expect(res.reference).toBe("MLP-1");
    expect(res.itemsCount).toBe(2);
    expect(res.total).toEqual({ amount: 6000, currency: "XOF" });
    expect(res.delivery).toEqual({ status: "IN_PROGRESS", driverName: "Amadou" });
  });

  it("trackByCode : sans livraison -> delivery null", async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          reference: "MLP-2", status: "PENDING", type: "SHOP", createdAt: new Date(0),
          items: [], total: 1000, currency: "XOF", delivery: null,
        }),
      },
    } as any;
    const res = await svc(prisma).trackByCode("ABC");
    expect(res.delivery).toBeNull();
    expect(res.itemsCount).toBe(0);
  });

  it("trackByCode : livraison sans conducteur -> driverName null", async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          reference: "MLP-3", status: "READY", type: "FOOD", createdAt: new Date(0),
          items: [{ id: "i1" }], total: 2000, currency: "XOF",
          delivery: { status: "UNASSIGNED", driver: null },
        }),
      },
    } as any;
    const res = await svc(prisma).trackByCode("ABC");
    expect(res.delivery).toEqual({ status: "UNASSIGNED", driverName: null });
  });

  it("trackByCode : conducteur sans prénom -> driverName null", async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          reference: "MLP-4", status: "ASSIGNED", type: "FOOD", createdAt: new Date(0),
          items: [{ id: "i1" }], total: 2000, currency: "XOF",
          delivery: { status: "IN_PROGRESS", driver: { user: {} } },
        }),
      },
    } as any;
    const res = await svc(prisma).trackByCode("ABC");
    expect(res.delivery).toEqual({ status: "IN_PROGRESS", driverName: null });
  });

  it("createForCustomer : produit introuvable -> BadRequest", async () => {
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const dto = { items: [{ productId: "p1", quantity: 1 }], type: "SHOP", paymentMethod: "WALLET", deliveryAddress: { line1: "Rue 1", city: "Bamako" } };
    await expect(svc(prisma).createForCustomer("me", dto)).rejects.toThrow(BadRequestException);
  });

  it("createForCustomer : crée la commande, calcule sous-total + frais et mappe", async () => {
    const created = {
      id: "o1", reference: "MLP-2026-000006", customerId: "me", type: "SHOP", status: "PENDING",
      items: [{ productId: "p1", name: "Riz", quantity: 2, unitPrice: 1500 }],
      addressLine1: "Rue 1", addressCity: "Bamako", addressDistrict: "ACI",
      subtotal: 3000, deliveryFee: 1000, total: 4000, paymentMethod: "WALLET", createdAt: new Date(0),
    };
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([{ id: "p1", name: "Riz", price: 1500 }]) },
      order: { count: jest.fn().mockResolvedValue(5), create: jest.fn().mockResolvedValue(created) },
    } as any;
    const dto = {
      items: [{ productId: "p1", quantity: 2 }], type: "SHOP", paymentMethod: "WALLET",
      deliveryAddress: { line1: "Rue 1", city: "Bamako", district: "ACI" },
    };
    const res = await svc(prisma).createForCustomer("me", dto);
    expect(prisma.order.create).toHaveBeenCalled();
    const arg = prisma.order.create.mock.calls[0][0];
    expect(arg.data.subtotal).toBe(3000);
    expect(arg.data.total).toBe(4000);
    expect(arg.data.reference).toBe("MLP-2026-000006");
    expect(typeof arg.data.trackingCode).toBe("string");
    expect(arg.data.trackingCode).toHaveLength(10);
    expect(res.id).toBe("o1");
    expect(res.subtotal).toEqual({ amount: 3000, currency: "XOF" });
    expect(res.total).toEqual({ amount: 4000, currency: "XOF" });
    expect(res.deliveryAddress).toEqual({ line1: "Rue 1", city: "Bamako", district: "ACI" });
    expect(res.items[0]).toEqual({ productId: "p1", name: "Riz", quantity: 2, unitPrice: { amount: 1500, currency: "XOF" } });
  });

  it("createForCustomer : applique les frais de livraison de la boutique", async () => {
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([{ id: "p1", name: "Riz", price: 1500, storeId: "s1" }]) },
      store: { findUnique: jest.fn().mockResolvedValue({ deliveryFee: 500 }) },
      order: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: "o1", items: [] }) },
    } as any;
    const dto = {
      items: [{ productId: "p1", quantity: 2 }], type: "FOOD", paymentMethod: "CASH",
      deliveryAddress: { line1: "Rue 1", city: "Bamako" },
    };
    await svc(prisma).createForCustomer("me", dto);
    const arg = prisma.order.create.mock.calls[0][0];
    // Les coordonnées sont lues pour calculer la distance réelle (CDC §2) ;
    // cette boutique n'en a pas, donc le tarif de repli s'applique.
    expect(prisma.store.findUnique).toHaveBeenCalledWith({
      where: { id: "s1" },
      select: { deliveryFee: true, lat: true, lng: true },
    });
    expect(arg.data.deliveryFee).toBe(500);
    expect(arg.data.total).toBe(3500);
  });

  it("createForCustomer : sans boutique rattachée -> tarif par défaut", async () => {
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([{ id: "p1", name: "Riz", price: 1000 }]) },
      order: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: "o1", items: [] }) },
    } as any;
    const dto = {
      items: [{ productId: "p1", quantity: 1 }], type: "FOOD", paymentMethod: "CASH",
      deliveryAddress: { line1: "Rue 1", city: "Bamako" },
    };
    await svc(prisma).createForCustomer("me", dto);
    expect(prisma.order.create.mock.calls[0][0].data.deliveryFee).toBe(1000);
  });

  it("createForCustomer : district par défaut null quand absent", async () => {
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([{ id: "p1", name: "Riz", price: 1000 }]) },
      order: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: "o1", items: [] }) },
    } as any;
    const dto = {
      items: [{ productId: "p1", quantity: 1 }], type: "FOOD", paymentMethod: "WAVE",
      deliveryAddress: { line1: "Rue 2", city: "Bamako" },
    };
    await svc(prisma).createForCustomer("me", dto);
    const arg = prisma.order.create.mock.calls[0][0];
    expect(arg.data.addressDistrict).toBeNull();
    expect(arg.data.reference).toBe("MLP-2026-000001");
  });

  it("listMine : filtre par statut et pagine", async () => {
    const rows = [{ id: "o1", reference: "R1", customerId: "me", type: "FOOD", status: "PENDING", subtotal: 1, deliveryFee: 1, total: 2, createdAt: new Date(0) }];
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(rows),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const res = await svc(prisma).listMine("me", 1, 10, "PENDING");
    expect(res.data).toHaveLength(1);
    expect(res.meta.total).toBe(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId: "me", status: "PENDING" } }));
  });

  it("listMine : sans statut ne filtre pas", async () => {
    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    } as any;
    await svc(prisma).listMine("me", 2, 5);
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId: "me" }, skip: 5, take: 5 }));
  });

  it("listAdmin : filtre par statut et pagine", async () => {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([{ id: "o1", reference: "R1", customerId: "u", type: "FOOD", status: "CONFIRMED", subtotal: 1, deliveryFee: 1, total: 2, createdAt: new Date(0) }]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const res = await svc(prisma).listAdmin(1, 10, "CONFIRMED");
    expect(res.data).toHaveLength(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "CONFIRMED" } }));
  });

  it("listAdmin : sans statut -> where vide", async () => {
    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    } as any;
    await svc(prisma).listAdmin(1, 10);
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("get : introuvable -> NotFound", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).get("o1")).rejects.toThrow(NotFoundException);
  });

  it("get : renvoie la commande mappée", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", reference: "R1", customerId: "me", type: "FOOD", status: "PENDING", subtotal: 100, deliveryFee: 1000, total: 1100, createdAt: new Date(0), items: [] }) },
    } as any;
    const res = await svc(prisma).get("o1");
    expect(res.id).toBe("o1");
    expect(res.total).toEqual({ amount: 1100, currency: "XOF" });
  });

  it("tracking : introuvable -> NotFound", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).tracking("o1")).rejects.toThrow(NotFoundException);
  });

  it("tracking : renvoie position + eta quand disponibles", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", status: "ASSIGNED", delivery: { driverLat: 12.6, driverLng: -8.0, etaMinutes: 15 } }) },
    } as any;
    const res = await svc(prisma).tracking("o1");
    expect(res.driverLocation).toEqual({ lat: 12.6, lng: -8.0 });
    expect(res.etaMinutes).toBe(15);
  });

  it("tracking : sans position -> driverLocation undefined, eta null", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", status: "PENDING", delivery: null }) },
    } as any;
    const res = await svc(prisma).tracking("o1");
    expect(res.driverLocation).toBeUndefined();
    expect(res.etaMinutes).toBeNull();
  });

  it("cancel : introuvable -> NotFound", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).cancel("o1")).rejects.toThrow(NotFoundException);
  });

  it("cancel : statut non annulable -> BadRequest", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", status: "DELIVERED" }) } } as any;
    await expect(svc(prisma).cancel("o1")).rejects.toThrow(BadRequestException);
  });

  it("cancel : annule une commande annulable, sans frais avant prise en charge", async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "o1", status: "PENDING", customerId: "me", total: 4500, delivery: null,
        }),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({ id: "o1", reference: "R1", customerId: "me", type: "FOOD", status: "CANCELLED", subtotal: 1, deliveryFee: 1, total: 2, createdAt: new Date(0), items: [] }),
      },
    } as any;
    const res = await svc(prisma).cancel("o1");
    // Aucun livreur engagé : gratuit (CDC v0.75 §4).
    expect(prisma.order.update.mock.calls[0][0].data).toMatchObject({
      status: "CANCELLED",
      cancellationFee: 0,
    });
    expect(res.status).toBe("CANCELLED");
  });

  it("cancel : facture 500 FCFA après l'arrivée du livreur (§4)", async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "o1", status: "ASSIGNED", customerId: "me", total: 4500,
          delivery: { status: "ARRIVED", acceptedAt: new Date(0) },
        }),
        // Quota mensuel de gratuités déjà épuisé : on mesure le tarif nu.
        count: jest.fn().mockResolvedValue(5),
        update: jest.fn().mockResolvedValue({ id: "o1", reference: "R1", customerId: "me", type: "FOOD", status: "CANCELLED", subtotal: 1, deliveryFee: 1, total: 2, createdAt: new Date(0), items: [] }),
      },
    } as any;
    const res = await svc(prisma).cancel("o1");
    expect(prisma.order.update.mock.calls[0][0].data.cancellationFee).toBe(500);
    expect(res.cancellation.feeBeforeAllowance).toBe(500);
  });
});
