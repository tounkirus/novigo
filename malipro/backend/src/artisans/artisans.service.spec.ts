import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ArtisansService } from "./artisans.service";

describe("ArtisansService", () => {
  it("refuse l'accès sans profil artisan", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ArtisansService(prisma).me("u1")).rejects.toThrow(ForbiddenException);
  });

  it("refuse la modification d'un service d'autrui", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: { findUnique: jest.fn().mockResolvedValue({ id: "sv1", artisanId: "other" }) },
    } as any;
    await expect(new ArtisansService(prisma).updateService("u1", "sv1", { title: "Z" })).rejects.toThrow(ForbiddenException);
  });

  it("adminSetAvailability : 404 si artisan absent", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ArtisansService(prisma).adminSetAvailability("x", false)).rejects.toThrow(NotFoundException);
  });

  // ---- me ------------------------------------------------------------------
  it("me : mappe le profil artisan", async () => {
    const prisma = {
      artisan: {
        findUnique: jest.fn().mockResolvedValue({
          id: "a1", userId: "u1", profession: "Plombier", bio: "b", rating: 4.5,
          isAvailable: true, serviceArea: "Bamako", createdAt: new Date(0),
        }),
      },
    } as any;
    const res = await new ArtisansService(prisma).me("u1");
    expect(res).toMatchObject({ id: "a1", profession: "Plombier", serviceArea: "Bamako" });
  });

  // ---- upsertProfile -------------------------------------------------------
  it("upsertProfile : crée/complète et mappe (valeurs fournies)", async () => {
    const prisma = {
      artisan: {
        upsert: jest.fn().mockResolvedValue({ id: "a1", userId: "u1", profession: "Menuisier", bio: "hello", serviceArea: "Ségou" }),
      },
    } as any;
    const res = await new ArtisansService(prisma).upsertProfile("u1", { profession: "Menuisier", bio: "hello", serviceArea: "Ségou" });
    expect(res.profession).toBe("Menuisier");
    const arg = prisma.artisan.upsert.mock.calls[0][0];
    expect(arg.update).toEqual({ profession: "Menuisier", bio: "hello", serviceArea: "Ségou" });
    expect(arg.create).toMatchObject({ userId: "u1", profession: "Menuisier" });
  });

  it("upsertProfile : applique les valeurs par défaut si dto vide", async () => {
    const prisma = { artisan: { upsert: jest.fn().mockResolvedValue({ id: "a1" }) } } as any;
    await new ArtisansService(prisma).upsertProfile("u1", {});
    const arg = prisma.artisan.upsert.mock.calls[0][0];
    expect(arg.update).toEqual({ profession: undefined, bio: undefined, serviceArea: undefined });
    expect(arg.create).toEqual({ userId: "u1", profession: "À renseigner", bio: null, serviceArea: null });
  });

  // ---- update --------------------------------------------------------------
  it("update : met à jour le profil de l'artisan courant", async () => {
    const prisma = {
      artisan: {
        findUnique: jest.fn().mockResolvedValue({ id: "a1", userId: "u1" }),
        update: jest.fn().mockResolvedValue({ id: "a1", profession: "Électricien", bio: "x", serviceArea: "Kayes" }),
      },
    } as any;
    const res = await new ArtisansService(prisma).update("u1", { profession: "Électricien", bio: "x", serviceArea: "Kayes" });
    expect(res.profession).toBe("Électricien");
    expect(prisma.artisan.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { profession: "Électricien", bio: "x", serviceArea: "Kayes" },
    });
  });

  it("update : Forbidden sans profil", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ArtisansService(prisma).update("u1", {})).rejects.toThrow(ForbiddenException);
  });

  // ---- listServices --------------------------------------------------------
  it("listServices : mappe les services de l'artisan", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: {
        findMany: jest.fn().mockResolvedValue([
          { id: "sv1", artisanId: "a1", title: "Fuite", description: "d", price: 5000, durationMinutes: 60 },
        ]),
      },
    } as any;
    const res = await new ArtisansService(prisma).listServices("u1");
    expect(res).toHaveLength(1);
    expect(res[0].price).toEqual({ amount: 5000, currency: "XOF" });
    expect(prisma.artisanService.findMany).toHaveBeenCalledWith({ where: { artisanId: "a1" } });
  });

  // ---- createService -------------------------------------------------------
  it("createService : price sous forme d'objet money", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: {
        create: jest.fn().mockResolvedValue({ id: "sv1", artisanId: "a1", title: "T", description: "d", price: 7000, durationMinutes: 30 }),
      },
    } as any;
    const res = await new ArtisansService(prisma).createService("u1", { title: "T", description: "d", price: { amount: 7000 }, durationMinutes: 30 });
    expect(res.price).toEqual({ amount: 7000, currency: "XOF" });
    expect(prisma.artisanService.create.mock.calls[0][0].data).toMatchObject({ artisanId: "a1", price: 7000 });
  });

  it("createService : price scalaire + valeurs par défaut null", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: { create: jest.fn().mockResolvedValue({ id: "sv1", artisanId: "a1", title: "T", price: 900 }) },
    } as any;
    await new ArtisansService(prisma).createService("u1", { title: "T", price: 900 });
    const data = prisma.artisanService.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ price: 900, description: null, durationMinutes: null });
  });

  // ---- updateService -------------------------------------------------------
  it("updateService : met à jour un service possédé", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: {
        findUnique: jest.fn().mockResolvedValue({ id: "sv1", artisanId: "a1" }),
        update: jest.fn().mockResolvedValue({ id: "sv1", artisanId: "a1", title: "New", price: 1200, durationMinutes: 15 }),
      },
    } as any;
    const res = await new ArtisansService(prisma).updateService("u1", "sv1", { title: "New", price: { amount: 1200 }, durationMinutes: 15 });
    expect(res.title).toBe("New");
    expect(prisma.artisanService.update.mock.calls[0][0].data.price).toBe(1200);
  });

  it("updateService : 404 si service introuvable", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    await expect(new ArtisansService(prisma).updateService("u1", "sv1", {})).rejects.toThrow(NotFoundException);
  });

  // ---- deleteService -------------------------------------------------------
  it("deleteService : supprime un service possédé", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: {
        findUnique: jest.fn().mockResolvedValue({ id: "sv1", artisanId: "a1" }),
        delete: jest.fn().mockResolvedValue({}),
      },
    } as any;
    await new ArtisansService(prisma).deleteService("u1", "sv1");
    expect(prisma.artisanService.delete).toHaveBeenCalledWith({ where: { id: "sv1" } });
  });

  it("deleteService : Forbidden si service d'un autre artisan", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      artisanService: { findUnique: jest.fn().mockResolvedValue({ id: "sv1", artisanId: "other" }) },
    } as any;
    await expect(new ArtisansService(prisma).deleteService("u1", "sv1")).rejects.toThrow(ForbiddenException);
  });

  // ---- listPublic ----------------------------------------------------------
  it("listPublic : sans filtre, mappe artisans publics + meta", async () => {
    const prisma = {
      artisan: {
        findMany: jest.fn().mockResolvedValue([
          { id: "a1", profession: "Plombier", bio: "b", rating: 5, isAvailable: true, serviceArea: "Bamako",
            user: { firstName: "Amadou", lastName: "Traoré" }, _count: { services: 3 } },
          { id: "a2", profession: "Menuisier", bio: null, rating: 4, isAvailable: false, serviceArea: null,
            user: null, _count: { services: 0 } },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
    } as any;
    const res = await new ArtisansService(prisma).listPublic(1, 10, {});
    expect(res.data[0]).toMatchObject({ name: "Amadou Traoré", serviceCount: 3 });
    expect(res.data[1].name).toBeNull();
    expect(res.meta).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 });
    expect(prisma.artisan.findMany.mock.calls[0][0].where).toEqual({});
  });

  it("listPublic : applique les filtres profession/serviceArea/search", async () => {
    const prisma = {
      artisan: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    } as any;
    await new ArtisansService(prisma).listPublic(2, 5, { profession: "Plomb", serviceArea: "Bam", search: "eau" });
    const where = prisma.artisan.findMany.mock.calls[0][0].where;
    expect(where.profession).toEqual({ contains: "Plomb", mode: "insensitive" });
    expect(where.serviceArea).toEqual({ contains: "Bam", mode: "insensitive" });
    expect(where.OR).toHaveLength(3);
    // total 0 -> totalPages plancher à 1
    const res = await new ArtisansService(prisma).listPublic(2, 5, {});
    expect(res.meta.totalPages).toBe(1);
  });

  // ---- getPublic -----------------------------------------------------------
  it("getPublic : renvoie l'artisan + ses services", async () => {
    const prisma = {
      artisan: {
        findUnique: jest.fn().mockResolvedValue({
          id: "a1", profession: "Plombier", bio: "b", rating: 5, isAvailable: true, serviceArea: "Bamako",
          user: { firstName: "Amadou", lastName: null }, _count: { services: 1 },
          services: [{ id: "sv1", artisanId: "a1", title: "Fuite", description: "d", price: 5000, durationMinutes: 60 }],
        }),
      },
    } as any;
    const res = await new ArtisansService(prisma).getPublic("a1");
    expect(res.name).toBe("Amadou");
    expect(res.services[0].price).toEqual({ amount: 5000, currency: "XOF" });
  });

  it("getPublic : 404 si introuvable", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ArtisansService(prisma).getPublic("nope")).rejects.toThrow(NotFoundException);
  });

  // ---- requestQuotation ----------------------------------------------------
  it("requestQuotation : budget numérique -> montant + statut REQUESTED", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: {
        create: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1", customerId: "me", description: "Fuite", amount: 5000, status: "REQUESTED", createdAt: new Date(0) }),
      },
    } as any;
    const res = await new ArtisansService(prisma).requestQuotation("me", "a1", { budget: 5000, description: "Fuite" });
    expect(res.status).toBe("REQUESTED");
    expect(res.amount).toEqual({ amount: 5000, currency: "XOF" });
    expect(prisma.quotation.create.mock.calls[0][0].data).toMatchObject({ amount: 5000, description: "Fuite" });
  });

  it("requestQuotation : budget objet money", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { create: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1", customerId: "me", description: "x", amount: 7000, status: "REQUESTED" }) },
    } as any;
    await new ArtisansService(prisma).requestQuotation("me", "a1", { budget: { amount: 7000 } });
    expect(prisma.quotation.create.mock.calls[0][0].data.amount).toBe(7000);
  });

  it("requestQuotation : dto absent -> montant 0 et description vide", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { create: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1", customerId: "me", description: "", amount: 0, status: "REQUESTED" }) },
    } as any;
    await new ArtisansService(prisma).requestQuotation("me", "a1", undefined);
    expect(prisma.quotation.create.mock.calls[0][0].data).toMatchObject({ amount: 0, description: "" });
  });

  it("requestQuotation : 404 si artisan absent", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ArtisansService(prisma).requestQuotation("me", "a1", {})).rejects.toThrow(NotFoundException);
  });

  // ---- listQuotations ------------------------------------------------------
  it("listQuotations : mappe + pagine les devis de l'artisan", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: {
        findMany: jest.fn().mockResolvedValue([
          { id: "q1", artisanId: "a1", customerId: "c1", description: "d", amount: 3000, status: "SENT", createdAt: new Date(0) },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const res = await new ArtisansService(prisma).listQuotations("u1", 1, 10);
    expect(res.data[0].amount).toEqual({ amount: 3000, currency: "XOF" });
    expect(res.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  // ---- createQuotation -----------------------------------------------------
  it("createQuotation : crée un devis SENT (amount objet)", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { create: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1", customerId: "c1", description: "d", amount: 4000, status: "SENT" }) },
    } as any;
    const res = await new ArtisansService(prisma).createQuotation("u1", { customerId: "c1", description: "d", amount: { amount: 4000 } });
    expect(res.status).toBe("SENT");
    expect(prisma.quotation.create.mock.calls[0][0].data).toMatchObject({ artisanId: "a1", customerId: "c1", amount: 4000, status: "SENT" });
  });

  it("createQuotation : amount scalaire", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { create: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1", customerId: "c1", amount: 2500, status: "SENT" }) },
    } as any;
    await new ArtisansService(prisma).createQuotation("u1", { customerId: "c1", amount: 2500 });
    expect(prisma.quotation.create.mock.calls[0][0].data.amount).toBe(2500);
  });

  // ---- updateQuotation -----------------------------------------------------
  it("updateQuotation : met à jour statut + montant", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: {
        findUnique: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1" }),
        update: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1", customerId: "c1", description: "d", amount: 8000, status: "ACCEPTED" }),
      },
    } as any;
    const res = await new ArtisansService(prisma).updateQuotation("u1", "q1", "ACCEPTED", 8000);
    expect(res.status).toBe("ACCEPTED");
    expect(prisma.quotation.update.mock.calls[0][0].data).toEqual({ status: "ACCEPTED", amount: 8000 });
  });

  it("updateQuotation : sans montant valide n'écrit que le statut", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: {
        findUnique: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1" }),
        update: jest.fn().mockResolvedValue({ id: "q1", artisanId: "a1", status: "REJECTED" }),
      },
    } as any;
    await new ArtisansService(prisma).updateQuotation("u1", "q1", "REJECTED");
    expect(prisma.quotation.update.mock.calls[0][0].data).toEqual({ status: "REJECTED" });
    // montant négatif ignoré
    await new ArtisansService(prisma).updateQuotation("u1", "q1", "REJECTED", -5);
    expect(prisma.quotation.update.mock.calls[1][0].data).toEqual({ status: "REJECTED" });
  });

  it("updateQuotation : 404 si devis introuvable", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    await expect(new ArtisansService(prisma).updateQuotation("u1", "q1", "ACCEPTED")).rejects.toThrow(NotFoundException);
  });

  it("updateQuotation : Forbidden si devis d'un autre artisan", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { findUnique: jest.fn().mockResolvedValue({ id: "q1", artisanId: "other" }) },
    } as any;
    await expect(new ArtisansService(prisma).updateQuotation("u1", "q1", "ACCEPTED")).rejects.toThrow(ForbiddenException);
  });

  // ---- getSchedule / setSchedule ------------------------------------------
  it("getSchedule : renvoie les créneaux existants", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1", schedule: [{ day: "MON" }] }) } } as any;
    expect(await new ArtisansService(prisma).getSchedule("u1")).toEqual({ slots: [{ day: "MON" }] });
  });

  it("getSchedule : liste vide si schedule null", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1", schedule: null }) } } as any;
    expect(await new ArtisansService(prisma).getSchedule("u1")).toEqual({ slots: [] });
  });

  it("setSchedule : persiste les créneaux", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }), update: jest.fn().mockResolvedValue({}) },
    } as any;
    const slots = [{ day: "TUE" }];
    const res = await new ArtisansService(prisma).setSchedule("u1", slots);
    expect(res).toEqual({ slots });
    expect(prisma.artisan.update).toHaveBeenCalledWith({ where: { id: "a1" }, data: { schedule: slots } });
  });

  // ---- adminList -----------------------------------------------------------
  it("adminList : pagine et mappe (avec et sans user)", async () => {
    const prisma = {
      artisan: {
        findMany: jest.fn().mockResolvedValue([
          { id: "a1", profession: "Plombier", rating: 5, isAvailable: true, _count: { services: 2 },
            user: { firstName: "Amadou", lastName: "Traoré", phone: "+223" }, createdAt: new Date(0) },
          { id: "a2", profession: "Menuisier", rating: 3, isAvailable: false, _count: { services: 0 },
            user: null, createdAt: new Date(0) },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
    } as any;
    const res = await new ArtisansService(prisma).adminList(1, 20);
    expect(res.data[0]).toMatchObject({ name: "Amadou Traoré", phone: "+223", serviceCount: 2 });
    expect(res.data[1].name).toBeNull();
    expect(res.data[1].phone).toBeUndefined();
    expect(res.meta.total).toBe(2);
  });

  // ---- adminGet ------------------------------------------------------------
  it("adminGet : renvoie le détail + services", async () => {
    const prisma = {
      artisan: {
        findUnique: jest.fn().mockResolvedValue({
          id: "a1", profession: "Plombier", bio: "b", rating: 5, isAvailable: true, serviceArea: "Bamako",
          user: { firstName: "Amadou", lastName: "Traoré", phone: "+223" },
          services: [{ id: "sv1", title: "Fuite", price: 5000, durationMinutes: 60 }],
        }),
      },
    } as any;
    const res = await new ArtisansService(prisma).adminGet("a1");
    expect(res.name).toBe("Amadou Traoré");
    expect(res.services[0].price).toEqual({ amount: 5000, currency: "XOF" });
  });

  it("adminGet : nom null sans user", async () => {
    const prisma = {
      artisan: {
        findUnique: jest.fn().mockResolvedValue({
          id: "a1", profession: "P", bio: null, rating: 0, isAvailable: true, serviceArea: null,
          user: null, services: [],
        }),
      },
    } as any;
    const res = await new ArtisansService(prisma).adminGet("a1");
    expect(res.name).toBeNull();
    expect(res.phone).toBeUndefined();
  });

  it("adminGet : 404 si introuvable", async () => {
    const prisma = { artisan: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ArtisansService(prisma).adminGet("nope")).rejects.toThrow(NotFoundException);
  });

  // ---- adminSetAvailability ------------------------------------------------
  it("adminSetAvailability : bascule la disponibilité", async () => {
    const prisma = {
      artisan: {
        findUnique: jest.fn().mockResolvedValue({ id: "a1" }),
        update: jest.fn().mockResolvedValue({ id: "a1", isAvailable: true }),
      },
    } as any;
    const res = await new ArtisansService(prisma).adminSetAvailability("a1", true);
    expect(res).toEqual({ id: "a1", isAvailable: true });
    expect(prisma.artisan.update).toHaveBeenCalledWith({ where: { id: "a1" }, data: { isAvailable: true } });
  });

  // ---- earnings ------------------------------------------------------------
  it("earnings : somme les devis ACCEPTED", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 15000 } }) },
    } as any;
    const res = await new ArtisansService(prisma).earnings("u1");
    expect(res).toEqual({ total: { amount: 15000, currency: "XOF" } });
  });

  it("earnings : 0 si aucune somme", async () => {
    const prisma = {
      artisan: { findUnique: jest.fn().mockResolvedValue({ id: "a1" }) },
      quotation: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }) },
    } as any;
    const res = await new ArtisansService(prisma).earnings("u1");
    expect(res.total.amount).toBe(0);
  });
});
