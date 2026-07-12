import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";

const storage = { upload: jest.fn().mockResolvedValue("http://minio/x") } as any;

describe("UsersService", () => {
  it("met à jour le profil", async () => {
    const prisma = {
      user: { update: jest.fn().mockResolvedValue({ id: "u1", phone: "+22370000000", firstName: "Neo", roles: ["CUSTOMER"], status: "ACTIVE" }) },
    } as any;
    const res = await new UsersService(prisma, storage).updateProfile("u1", { firstName: "Neo" });
    expect(res.firstName).toBe("Neo");
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("refuse la suppression d'une adresse d'autrui", async () => {
    const prisma = { address: { findUnique: jest.fn().mockResolvedValue({ id: "a1", userId: "other" }) } } as any;
    await expect(new UsersService(prisma, storage).deleteAddress("me", "a1")).rejects.toThrow(ForbiddenException);
  });

  it("404 si l'adresse n'existe pas", async () => {
    const prisma = { address: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new UsersService(prisma, storage).deleteAddress("me", "x")).rejects.toThrow(NotFoundException);
  });

  // --- uploadPhoto ---
  it("uploadPhoto : téléverse et met à jour photoUrl", async () => {
    const st = { upload: jest.fn().mockResolvedValue("http://minio/p.jpg") } as any;
    const prisma = { user: { update: jest.fn().mockResolvedValue({}) } } as any;
    const file = { buffer: Buffer.from("x"), mimetype: "image/jpeg" } as any;
    const res = await new UsersService(prisma, st).uploadPhoto("u1", file);
    expect(res).toEqual({ photoUrl: "http://minio/p.jpg" });
    expect(st.upload).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { photoUrl: "http://minio/p.jpg" } });
  });

  it("uploadPhoto : fichier manquant -> NotFound", async () => {
    await expect(new UsersService({} as any, storage).uploadPhoto("u1", undefined as any)).rejects.toThrow(NotFoundException);
  });

  // --- uploadDocument ---
  it("uploadDocument : fichier manquant -> NotFound", async () => {
    await expect(new UsersService({} as any, storage).uploadDocument("u1", "ID", undefined as any)).rejects.toThrow(NotFoundException);
  });

  it("uploadDocument : sans profil livreur -> stocké non rattaché", async () => {
    const st = { upload: jest.fn().mockResolvedValue("http://minio/d.pdf") } as any;
    const prisma = { driver: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    const file = { buffer: Buffer.from("x"), mimetype: "application/pdf" } as any;
    const res = await new UsersService(prisma, st).uploadDocument("u1", "ID_CARD", file);
    expect(res).toEqual({ url: "http://minio/d.pdf", type: "ID_CARD", status: "PENDING", linked: false });
  });

  it("uploadDocument : avec profil livreur -> crée le document et passe kycStatus PENDING", async () => {
    const st = { upload: jest.fn().mockResolvedValue("http://minio/d.pdf") } as any;
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: "drv1" }), update: jest.fn().mockResolvedValue({}) },
      driverDocument: { create: jest.fn().mockResolvedValue({ id: "doc1", type: "ID_CARD", url: "http://minio/d.pdf", status: "PENDING" }) },
    } as any;
    const file = { buffer: Buffer.from("x"), mimetype: "application/pdf" } as any;
    const res = await new UsersService(prisma, st).uploadDocument("u1", "ID_CARD", file);
    expect(res).toEqual({ id: "doc1", type: "ID_CARD", url: "http://minio/d.pdf", status: "PENDING", linked: true });
    expect(prisma.driverDocument.create).toHaveBeenCalled();
    expect(prisma.driver.update).toHaveBeenCalledWith({ where: { id: "drv1" }, data: { kycStatus: "PENDING" } });
  });

  // --- me ---
  it("me : renvoie l'utilisateur mappé", async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: "u1", phone: "+22370000000", email: "a@b.c", firstName: "Neo", roles: ["CUSTOMER"], status: "ACTIVE" }) } } as any;
    const res = await new UsersService(prisma, storage).me("u1");
    expect(res).toMatchObject({ id: "u1", phone: "+22370000000", firstName: "Neo" });
  });

  it("me : utilisateur introuvable -> NotFound", async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new UsersService(prisma, storage).me("x")).rejects.toThrow(NotFoundException);
  });

  // --- listAddresses ---
  it("listAddresses : mappe les adresses avec/sans localisation", async () => {
    const prisma = {
      address: {
        findMany: jest.fn().mockResolvedValue([
          { id: "a1", label: "Maison", line1: "L1", line2: null, city: "Bamako", district: "ACI", lat: 12.6, lng: -8, isDefault: true },
          { id: "a2", label: null, line1: "L2", line2: "L2b", city: "Kati", district: null, lat: null, lng: null, isDefault: false },
        ]),
      },
    } as any;
    const res = await new UsersService(prisma, storage).listAddresses("me");
    expect(res[0].location).toEqual({ lat: 12.6, lng: -8 });
    expect(res[1].location).toBeUndefined();
  });

  // --- createAddress ---
  it("createAddress : par défaut réinitialise les autres adresses", async () => {
    const prisma = {
      address: {
        updateMany: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({ id: "a1", label: "Maison", line1: "L1", city: "Bamako", lat: 1, lng: 2, isDefault: true }),
      },
    } as any;
    const res = await new UsersService(prisma, storage).createAddress("me", { line1: "L1", city: "Bamako", location: { lat: 1, lng: 2 }, isDefault: true } as any);
    expect(prisma.address.updateMany).toHaveBeenCalledWith({ where: { userId: "me" }, data: { isDefault: false } });
    expect(res.location).toEqual({ lat: 1, lng: 2 });
  });

  it("createAddress : non par défaut ne touche pas les autres", async () => {
    const prisma = {
      address: {
        updateMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: "a1", line1: "L1", city: "Bamako", isDefault: false }),
      },
    } as any;
    await new UsersService(prisma, storage).createAddress("me", { line1: "L1", city: "Bamako" } as any);
    expect(prisma.address.updateMany).not.toHaveBeenCalled();
    expect(prisma.address.create).toHaveBeenCalled();
  });

  // --- updateAddress ---
  it("updateAddress : par défaut réinitialise puis met à jour", async () => {
    const prisma = {
      address: {
        findUnique: jest.fn().mockResolvedValue({ id: "a1", userId: "me" }),
        updateMany: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({ id: "a1", line1: "New", city: "Bamako", isDefault: true }),
      },
    } as any;
    const res = await new UsersService(prisma, storage).updateAddress("me", "a1", { line1: "New", city: "Bamako", isDefault: true } as any);
    expect(prisma.address.updateMany).toHaveBeenCalled();
    expect(res.line1).toBe("New");
  });

  it("updateAddress : adresse d'autrui -> Forbidden", async () => {
    const prisma = { address: { findUnique: jest.fn().mockResolvedValue({ id: "a1", userId: "other" }) } } as any;
    await expect(new UsersService(prisma, storage).updateAddress("me", "a1", { line1: "L", city: "C" } as any)).rejects.toThrow(ForbiddenException);
  });

  // --- deleteAddress success ---
  it("deleteAddress : supprime sa propre adresse", async () => {
    const prisma = {
      address: { findUnique: jest.fn().mockResolvedValue({ id: "a1", userId: "me" }), delete: jest.fn().mockResolvedValue({}) },
    } as any;
    await new UsersService(prisma, storage).deleteAddress("me", "a1");
    expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
  });

  // --- registerDevice / removeDevice ---
  it("registerDevice : upsert le token", async () => {
    const prisma = { deviceToken: { upsert: jest.fn().mockResolvedValue({ token: "t1", platform: "android" }) } } as any;
    const res = await new UsersService(prisma, storage).registerDevice("me", "t1", "android");
    expect(res).toEqual({ token: "t1", platform: "android" });
  });

  it("removeDevice : supprime le token", async () => {
    const prisma = { deviceToken: { deleteMany: jest.fn().mockResolvedValue({}) } } as any;
    await new UsersService(prisma, storage).removeDevice("me", "t1");
    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({ where: { token: "t1", userId: "me" } });
  });

  // --- listFavorites ---
  it("listFavorites : mappe et pagine", async () => {
    const prisma = {
      favorite: {
        findMany: jest.fn().mockResolvedValue([{ id: "f1", targetType: "ARTISAN", targetId: "a1", createdAt: new Date(0) }]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const res = await new UsersService(prisma, storage).listFavorites("me", 1, 10);
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({ id: "f1", targetType: "ARTISAN", targetId: "a1" });
  });

  // --- addFavorite ---
  it("addFavorite : upsert et renvoie le favori", async () => {
    const prisma = { favorite: { upsert: jest.fn().mockResolvedValue({ id: "f1", targetType: "ARTISAN", targetId: "a1", createdAt: new Date(0) }) } } as any;
    const res = await new UsersService(prisma, storage).addFavorite("me", { targetType: "ARTISAN", targetId: "a1" } as any);
    expect(res).toMatchObject({ id: "f1", targetType: "ARTISAN", targetId: "a1" });
  });

  // --- removeFavorite ---
  it("removeFavorite : supprime son propre favori", async () => {
    const prisma = {
      favorite: { findUnique: jest.fn().mockResolvedValue({ id: "f1", userId: "me" }), delete: jest.fn().mockResolvedValue({}) },
    } as any;
    await new UsersService(prisma, storage).removeFavorite("me", "f1");
    expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: "f1" } });
  });

  it("removeFavorite : introuvable -> NotFound", async () => {
    const prisma = { favorite: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new UsersService(prisma, storage).removeFavorite("me", "x")).rejects.toThrow(NotFoundException);
  });

  it("removeFavorite : favori d'autrui -> Forbidden", async () => {
    const prisma = { favorite: { findUnique: jest.fn().mockResolvedValue({ id: "f1", userId: "other" }) } } as any;
    await expect(new UsersService(prisma, storage).removeFavorite("me", "f1")).rejects.toThrow(ForbiddenException);
  });
});
