import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { MerchantsService } from "./merchants.service";

/// Le service pousse aussi des événements temps réel : stub dans les tests unitaires.
const svc = (prisma: any) => new MerchantsService(prisma, { emitToUsers: jest.fn(), emitTracking: jest.fn() } as any);

describe("MerchantsService", () => {
  it("refuse la création de boutique sans profil commerçant", async () => {
    const prisma = { merchant: { findUnique: jest.fn().mockResolvedValue(null) }, merchantStaff: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).createStore("u1", { name: "X" })).rejects.toThrow(ForbiddenException);
  });

  it("refuse la modification d'une boutique d'autrui", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "other" }) },
    } as any;
    await expect(svc(prisma).updateStore("u1", "s1", { name: "Y" })).rejects.toThrow(ForbiddenException);
  });

  it("adminSetActive : 404 si commerçant absent", async () => {
    const prisma = { merchant: { findUnique: jest.fn().mockResolvedValue(null) }, merchantStaff: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).adminSetActive("x", false)).rejects.toThrow(NotFoundException);
  });

  // --- me / merchantFor ---
  it("me : renvoie le profil mappé", async () => {
    const prisma = { merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1", userId: "u1", businessName: "Chez X", category: "FOOD", isActive: true, createdAt: new Date(0) }) } } as any;
    const res = await svc(prisma).me("u1");
    expect(res).toEqual({ id: "m1", userId: "u1", businessName: "Chez X", category: "FOOD", isActive: true, createdAt: new Date(0) });
  });
  it("me : Forbidden si pas de profil", async () => {
    const prisma = { merchant: { findUnique: jest.fn().mockResolvedValue(null) }, merchantStaff: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).me("u1")).rejects.toThrow(ForbiddenException);
  });

  // --- upsertProfile ---
  it("upsertProfile : crée/complète et mappe", async () => {
    const prisma = { merchant: { upsert: jest.fn().mockResolvedValue({ id: "m1", userId: "u1", businessName: "Boutique", category: "FOOD", isActive: true, createdAt: new Date(0) }) } } as any;
    const res = await svc(prisma).upsertProfile("u1", { businessName: "Boutique", category: "FOOD" });
    expect(res.businessName).toBe("Boutique");
    expect(prisma.merchant.upsert).toHaveBeenCalled();
  });
  it("upsertProfile : valeurs par défaut quand dto vide", async () => {
    const prisma = { merchant: { upsert: jest.fn().mockResolvedValue({ id: "m1", userId: "u1", businessName: "À renseigner", category: null, isActive: true, createdAt: new Date(0) }) } } as any;
    await svc(prisma).upsertProfile("u1", {});
    const arg = prisma.merchant.upsert.mock.calls[0][0];
    expect(arg.create.businessName).toBe("À renseigner");
    expect(arg.create.category).toBeNull();
    expect(arg.update.businessName).toBeUndefined();
  });

  // --- listStores ---
  it("listStores : mappe les boutiques (avec et sans localisation)", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findMany: jest.fn().mockResolvedValue([
        { id: "s1", merchantId: "m1", name: "A", category: "FOOD", lat: 12.6, lng: -8, isOpen: true, rating: 4.5 },
        { id: "s2", merchantId: "m1", name: "B", category: null, lat: null, lng: null, isOpen: false, rating: 0 },
      ]) },
    } as any;
    const res = await svc(prisma).listStores("u1");
    expect(res[0].location).toEqual({ lat: 12.6, lng: -8 });
    expect(res[1].location).toBeUndefined();
  });

  // --- createStore ---
  it("createStore : crée avec localisation", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { create: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1", name: "A", category: "FOOD", lat: 1, lng: 2, isOpen: true, rating: 0 }) },
    } as any;
    const res = await svc(prisma).createStore("u1", { name: "A", category: "FOOD", location: { lat: 1, lng: 2 } });
    expect(res.location).toEqual({ lat: 1, lng: 2 });
    expect(prisma.store.create).toHaveBeenCalledWith({ data: { merchantId: "m1", name: "A", category: "FOOD", lat: 1, lng: 2 } });
  });
  it("createStore : sans localisation ni catégorie -> null", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { create: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1", name: "A", category: null, lat: null, lng: null, isOpen: true, rating: 0 }) },
    } as any;
    await svc(prisma).createStore("u1", { name: "A" });
    expect(prisma.store.create).toHaveBeenCalledWith({ data: { merchantId: "m1", name: "A", category: null, lat: null, lng: null } });
  });

  // --- updateStore ---
  it("updateStore : succès met à jour et mappe", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: {
        findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1" }),
        update: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1", name: "Y", category: "FOOD", lat: null, lng: null, isOpen: false, rating: 0 }),
      },
    } as any;
    const res = await svc(prisma).updateStore("u1", "s1", { name: "Y", category: "FOOD", isOpen: false });
    expect(res.name).toBe("Y");
  });
  it("updateStore : boutique introuvable -> NotFound", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    await expect(svc(prisma).updateStore("u1", "s1", {})).rejects.toThrow(NotFoundException);
  });

  // --- listProducts ---
  it("listProducts : pagine et mappe le prix", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1" }) },
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: "p1", storeId: "s1", name: "P", description: "d", price: 1500, imageUrl: null, inStock: true, stockQuantity: 5 }]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const res = await svc(prisma).listProducts("u1", "s1", 1, 10);
    expect(res.data[0].price).toEqual({ amount: 1500, currency: "XOF" });
    expect(res.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { storeId: "s1" }, skip: 0, take: 10 }));
  });
  it("listProducts : totalPages au moins 1 quand aucun produit", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1" }) },
      product: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    } as any;
    const res = await svc(prisma).listProducts("u1", "s1", 2, 10);
    expect(res.meta.totalPages).toBe(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10 }));
  });

  // --- createProduct ---
  it("createProduct : prix depuis money object", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1" }) },
      product: { create: jest.fn().mockResolvedValue({ id: "p1", storeId: "s1", name: "P", description: "d", price: 2000, imageUrl: null, inStock: false, stockQuantity: 3 }) },
    } as any;
    await svc(prisma).createProduct("u1", "s1", { name: "P", description: "d", price: { amount: 2000 }, stockQuantity: 3 });
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ storeId: "s1", name: "P", description: "d", price: 2000, stockQuantity: 3 }),
    });
  });
  it("createProduct : prix scalaire et valeurs par défaut", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1" }) },
      product: { create: jest.fn().mockResolvedValue({ id: "p1", storeId: "s1", name: "P", price: 500, stockQuantity: 0, inStock: false }) },
    } as any;
    await svc(prisma).createProduct("u1", "s1", { name: "P", price: 500 });
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ storeId: "s1", name: "P", description: null, price: 500, stockQuantity: 0 }),
    });
  });

  // --- ownProduct branches via updateProduct ---
  it("updateProduct : produit introuvable -> NotFound", async () => {
    const prisma = { product: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).updateProduct("u1", "p1", {})).rejects.toThrow(NotFoundException);
  });
  it("updateProduct : produit sans store -> NotFound", async () => {
    const prisma = { product: { findUnique: jest.fn().mockResolvedValue({ id: "p1", store: null }) } } as any;
    await expect(svc(prisma).updateProduct("u1", "p1", {})).rejects.toThrow(NotFoundException);
  });
  it("updateProduct : produit d'un autre commerçant -> Forbidden", async () => {
    const prisma = {
      product: { findUnique: jest.fn().mockResolvedValue({ id: "p1", store: { merchantId: "other" } }) },
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
    } as any;
    await expect(svc(prisma).updateProduct("u1", "p1", {})).rejects.toThrow(ForbiddenException);
  });
  it("updateProduct : succès met à jour prix et champs", async () => {
    const prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: "p1", store: { merchantId: "m1" } }),
        update: jest.fn().mockResolvedValue({ id: "p1", storeId: "s1", name: "New", description: "nd", price: 900, imageUrl: null, inStock: true, stockQuantity: 4 }),
      },
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
    } as any;
    const res = await svc(prisma).updateProduct("u1", "p1", { name: "New", description: "nd", price: { amount: 900 } });
    expect(res.price).toEqual({ amount: 900, currency: "XOF" });
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: expect.objectContaining({ name: "New", description: "nd", price: 900 }),
      }),
    );
  });

  // --- deleteProduct ---
  it("deleteProduct : supprime après contrôle de propriété", async () => {
    const prisma = {
      product: { findUnique: jest.fn().mockResolvedValue({ id: "p1", store: { merchantId: "m1" } }), delete: jest.fn().mockResolvedValue({}) },
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
    } as any;
    await svc(prisma).deleteProduct("u1", "p1");
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });

  // --- setInventory ---
  it("setInventory : stock > 0 -> inStock true", async () => {
    const prisma = {
      product: { findUnique: jest.fn().mockResolvedValue({ id: "p1", store: { merchantId: "m1" } }), update: jest.fn().mockResolvedValue({ id: "p1", storeId: "s1", name: "P", price: 100, inStock: true, stockQuantity: 5 }) },
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
    } as any;
    const res = await svc(prisma).setInventory("u1", "p1", 5);
    expect(res.inStock).toBe(true);
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { stockQuantity: 5, inStock: true } });
  });
  it("setInventory : stock 0 -> inStock false", async () => {
    const prisma = {
      product: { findUnique: jest.fn().mockResolvedValue({ id: "p1", store: { merchantId: "m1" } }), update: jest.fn().mockResolvedValue({ id: "p1", storeId: "s1", name: "P", price: 100, inStock: false, stockQuantity: 0 }) },
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
    } as any;
    await svc(prisma).setInventory("u1", "p1", 0);
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { stockQuantity: 0, inStock: false } });
  });

  // --- adminList ---
  it("adminList : mappe owner, phone et storeCount", async () => {
    const prisma = {
      merchant: {
        findMany: jest.fn().mockResolvedValue([
          { id: "m1", businessName: "A", category: "FOOD", isActive: true, createdAt: new Date(0), _count: { stores: 2 }, user: { firstName: "Ali", lastName: "Ba", phone: "+223" } },
          { id: "m2", businessName: "B", category: null, isActive: false, createdAt: new Date(0), _count: { stores: 0 }, user: null },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
    } as any;
    const res = await svc(prisma).adminList(1, 10);
    expect(res.data[0]).toMatchObject({ storeCount: 2, owner: "Ali Ba", phone: "+223" });
    expect(res.data[1].owner).toBeNull();
    expect(res.data[1].phone).toBeUndefined();
    expect(res.meta.total).toBe(2);
  });

  // --- adminGet ---
  it("adminGet : introuvable -> NotFound", async () => {
    const prisma = { merchant: { findUnique: jest.fn().mockResolvedValue(null) }, merchantStaff: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
    await expect(svc(prisma).adminGet("m1")).rejects.toThrow(NotFoundException);
  });
  it("adminGet : mappe owner et boutiques", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({
        id: "m1", businessName: "A", category: "FOOD", isActive: true,
        user: { firstName: "Ali", lastName: "Ba", phone: "+223" }, documents: [],
        stores: [{ id: "s1", name: "Sto", category: "FOOD", isOpen: true, _count: { products: 3 } }],
      }) },
    } as any;
    const res = await svc(prisma).adminGet("m1");
    expect(res.owner).toBe("Ali Ba");
    expect(res.stores[0]).toEqual({ id: "s1", name: "Sto", category: "FOOD", isOpen: true, productCount: 3 });
  });
  it("adminGet : owner null quand pas d'utilisateur", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1", businessName: "A", category: null, isActive: true, user: null, documents: [], stores: [] }) },
    } as any;
    const res = await svc(prisma).adminGet("m1");
    expect(res.owner).toBeNull();
    expect(res.phone).toBeUndefined();
  });

  // --- adminSetActive success ---
  it("adminSetActive : succès met à jour isActive", async () => {
    const prisma = {
      merchant: {
        findUnique: jest.fn().mockResolvedValue({ id: "m1", isActive: false }),
        update: jest.fn().mockResolvedValue({ id: "m1", isActive: true }),
      },
    } as any;
    const res = await svc(prisma).adminSetActive("m1", true);
    expect(res).toEqual({ id: "m1", isActive: true });
  });

  // --- reports ---
  it("reports : renvoie le nombre de produits", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "m1" }) },
      product: { count: jest.fn().mockResolvedValue(7) },
    } as any;
    const res = await svc(prisma).reports("u1", "s1");
    expect(res).toMatchObject({ storeId: "s1", productCount: 7 });
  });
  it("reports : Forbidden si boutique d'autrui", async () => {
    const prisma = {
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1" }) },
      store: { findUnique: jest.fn().mockResolvedValue({ id: "s1", merchantId: "other" }) },
    } as any;
    await expect(svc(prisma).reports("u1", "s1")).rejects.toThrow(ForbiddenException);
  });

  // --- orderAction : notification des livreurs en ligne ---
  const orderActionPrisma = (fromStatus: string, toStatus: string) =>
    ({
      merchant: { findUnique: jest.fn().mockResolvedValue({ id: "m1", userId: "u1" }) },
      merchantStaff: { findMany: jest.fn().mockResolvedValue([]) },
      driver: { findMany: jest.fn().mockResolvedValue([{ userId: "d1" }, { userId: "d2" }]) },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "o1", status: fromStatus, store: { id: "s1", merchantId: "m1", name: "Chez X" },
        }),
        update: jest.fn().mockResolvedValue({
          id: "o1", reference: "MLP-1", status: toStatus, customerId: "c1", deliveryFee: 500,
          store: { id: "s1", merchantId: "m1", name: "Chez X" },
          items: [{ quantity: 2 }, { quantity: 1 }], customer: null, delivery: null,
        }),
      },
    }) as any;

  it("orderAction ready : notifie les livreurs en ligne de la course disponible", async () => {
    const prisma = orderActionPrisma("PREPARING", "READY");
    const realtime = { emitToUsers: jest.fn(), emitTracking: jest.fn() };
    await new MerchantsService(prisma, realtime as any).orderAction("u1", "o1", "ready");
    expect(prisma.driver.findMany).toHaveBeenCalledWith({ where: { isAvailable: true }, select: { userId: true } });
    const push = realtime.emitToUsers.mock.calls.find((c: any[]) => c[1] === "delivery.available");
    expect(push).toBeDefined();
    expect(push![0]).toEqual(["d1", "d2"]);
    expect(push![2]).toMatchObject({ reference: "MLP-1", storeName: "Chez X", itemsCount: 3 });
  });

  it("orderAction accept : aucune notification livreur (course pas encore prête)", async () => {
    const prisma = orderActionPrisma("PENDING", "CONFIRMED");
    const realtime = { emitToUsers: jest.fn(), emitTracking: jest.fn() };
    await new MerchantsService(prisma, realtime as any).orderAction("u1", "o1", "accept");
    expect(prisma.driver.findMany).not.toHaveBeenCalled();
    expect(realtime.emitToUsers.mock.calls.some((c: any[]) => c[1] === "delivery.available")).toBe(false);
  });
});