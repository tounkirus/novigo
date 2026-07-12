import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../common/prisma/prisma.service";
import { StorageService } from "../common/storage/storage.service";
import { paginate } from "../common/dto/pagination.dto";
import { AddressDto, FavoriteDto, UpdateProfileDto } from "./dto/users.dto";

function mapAddress(a: any) {
  return {
    id: a.id, label: a.label, line1: a.line1, line2: a.line2, city: a.city,
    district: a.district,
    location: a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : undefined,
    isDefault: a.isDefault,
  };
}
const mapUser = (u: any) => ({
  id: u.id, phone: u.phone, email: u.email, firstName: u.firstName, lastName: u.lastName, photoUrl: u.photoUrl,
  roles: u.roles, status: u.status, locale: u.locale, createdAt: u.createdAt, updatedAt: u.updatedAt,
});

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  async uploadPhoto(userId: string, file: Express.Multer.File) {
    if (!file) throw new NotFoundException("Fichier manquant.");
    const key = `photos/${userId}/${randomUUID()}`;
    const url = await this.storage.upload(key, file.buffer, file.mimetype);
    await this.prisma.user.update({ where: { id: userId }, data: { photoUrl: url } });
    return { photoUrl: url };
  }

  async uploadDocument(userId: string, type: string, file: Express.Multer.File) {
    if (!file) throw new NotFoundException("Fichier manquant.");
    const key = `documents/${userId}/${randomUUID()}`;
    const url = await this.storage.upload(key, file.buffer, file.mimetype);
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      // Document stocké mais non rattaché à un profil livreur.
      return { url, type, status: "PENDING", linked: false };
    }
    const doc = await this.prisma.driverDocument.create({
      data: { driverId: driver.id, type, url, status: "PENDING" },
    });
    await this.prisma.driver.update({ where: { id: driver.id }, data: { kycStatus: "PENDING" } });
    return { id: doc.id, type: doc.type, url: doc.url, status: doc.status, linked: true };
  }

  async me(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException("Utilisateur introuvable.");
    return mapUser(u);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const u = await this.prisma.user.update({ where: { id }, data: { ...dto } });
    return mapUser(u);
  }

  // --- Adresses ---
  async listAddresses(userId: string) {
    const rows = await this.prisma.address.findMany({
      where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapAddress);
  }

  async createAddress(userId: string, dto: AddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const a = await this.prisma.address.create({
      data: {
        userId, label: dto.label ?? null, line1: dto.line1, line2: dto.line2 ?? null,
        city: dto.city, district: dto.district ?? null,
        lat: dto.location?.lat ?? null, lng: dto.location?.lng ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
    return mapAddress(a);
  }

  async updateAddress(userId: string, addressId: string, dto: AddressDto) {
    await this.ownAddress(userId, addressId);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const a = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        label: dto.label, line1: dto.line1, line2: dto.line2, city: dto.city,
        district: dto.district, lat: dto.location?.lat, lng: dto.location?.lng,
        isDefault: dto.isDefault,
      },
    });
    return mapAddress(a);
  }

  async deleteAddress(userId: string, addressId: string) {
    await this.ownAddress(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  private async ownAddress(userId: string, addressId: string) {
    const a = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!a) throw new NotFoundException("Adresse introuvable.");
    if (a.userId !== userId) throw new ForbiddenException("Adresse d'un autre utilisateur.");
    return a;
  }

  // --- Appareils (push) ---
  async registerDevice(userId: string, token: string, platform: string) {
    const d = await this.prisma.deviceToken.upsert({
      where: { token }, update: { userId, platform }, create: { userId, token, platform },
    });
    return { token: d.token, platform: d.platform };
  }
  async removeDevice(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token, userId } });
  }

  // --- Favoris ---
  async listFavorites(userId: string, page: number, limit: number) {
    const [rows, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);
    const data = rows.map((f) => ({
      id: f.id, targetType: f.targetType, targetId: f.targetId, createdAt: f.createdAt,
    }));
    return paginate(data, total, page, limit);
  }

  async addFavorite(userId: string, dto: FavoriteDto) {
    const f = await this.prisma.favorite.upsert({
      where: { userId_targetType_targetId: { userId, targetType: dto.targetType, targetId: dto.targetId } },
      update: {},
      create: { userId, targetType: dto.targetType, targetId: dto.targetId },
    });
    return { id: f.id, targetType: f.targetType, targetId: f.targetId, createdAt: f.createdAt };
  }

  async removeFavorite(userId: string, favoriteId: string) {
    const f = await this.prisma.favorite.findUnique({ where: { id: favoriteId } });
    if (!f) throw new NotFoundException("Favori introuvable.");
    if (f.userId !== userId) throw new ForbiddenException("Favori d'un autre utilisateur.");
    await this.prisma.favorite.delete({ where: { id: favoriteId } });
  }
}
