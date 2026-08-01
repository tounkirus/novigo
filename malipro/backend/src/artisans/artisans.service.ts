import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

const money = (amount: number) => ({ amount, currency: "XOF" });
const mapArtisan = (a: any) => ({
  id: a.id, userId: a.userId, profession: a.profession, bio: a.bio,
  rating: a.rating, isAvailable: a.isAvailable, serviceArea: a.serviceArea, createdAt: a.createdAt,
});
const mapService = (s: any) => ({
  id: s.id, artisanId: s.artisanId, title: s.title, description: s.description,
  price: money(s.price), durationMinutes: s.durationMinutes, imageUrl: s.imageUrl,
});
const mapQuotation = (q: any) => ({
  id: q.id, artisanId: q.artisanId, customerId: q.customerId, description: q.description,
  amount: money(q.amount), status: q.status, createdAt: q.createdAt,
});
const mapPublicArtisan = (a: any) => ({
  id: a.id, profession: a.profession, bio: a.bio, rating: a.rating,
  isAvailable: a.isAvailable, serviceArea: a.serviceArea,
  name: a.user ? [a.user.firstName, a.user.lastName].filter(Boolean).join(" ") || null : null,
  photoUrl: a.user?.photoUrl ?? null,
  serviceCount: a._count?.services,
  // Prix d'appel : évite un aller-retour de détail par prestataire côté client.
  startingPrice: a.services?.length ? money(a.services[0].price) : null,
});

@Injectable()
export class ArtisansService {
  constructor(private prisma: PrismaService) {}

  private async artisanFor(userId: string) {
    const a = await this.prisma.artisan.findUnique({ where: { userId } });
    if (!a) throw new ForbiddenException("Profil artisan requis.");
    return a;
  }

  async me(userId: string) {
    return mapArtisan(await this.artisanFor(userId));
  }

  /** Onboarding : crée le profil artisan s'il manque, sinon le complète. */
  async upsertProfile(userId: string, dto: any) {
    const a = await this.prisma.artisan.upsert({
      where: { userId },
      update: {
        profession: dto.profession ?? undefined,
        bio: dto.bio ?? undefined,
        serviceArea: dto.serviceArea ?? undefined,
      },
      create: {
        userId,
        profession: dto.profession ?? "À renseigner",
        bio: dto.bio ?? null,
        serviceArea: dto.serviceArea ?? null,
      },
    });
    return mapArtisan(a);
  }
  async update(userId: string, dto: any) {
    const a = await this.artisanFor(userId);
    const u = await this.prisma.artisan.update({
      where: { id: a.id }, data: { profession: dto.profession, bio: dto.bio, serviceArea: dto.serviceArea },
    });
    return mapArtisan(u);
  }

  async listServices(userId: string) {
    const a = await this.artisanFor(userId);
    const rows = await this.prisma.artisanService.findMany({ where: { artisanId: a.id } });
    return rows.map(mapService);
  }
  async createService(userId: string, dto: any) {
    const a = await this.artisanFor(userId);
    const s = await this.prisma.artisanService.create({
      data: { artisanId: a.id, title: dto.title, description: dto.description ?? null,
              price: dto.price?.amount ?? dto.price, durationMinutes: dto.durationMinutes ?? null },
    });
    return mapService(s);
  }
  async updateService(userId: string, serviceId: string, dto: any) {
    await this.ownService(userId, serviceId);
    const s = await this.prisma.artisanService.update({
      where: { id: serviceId },
      data: { title: dto.title, description: dto.description, price: dto.price?.amount ?? dto.price,
              durationMinutes: dto.durationMinutes },
    });
    return mapService(s);
  }
  async deleteService(userId: string, serviceId: string) {
    await this.ownService(userId, serviceId);
    await this.prisma.artisanService.delete({ where: { id: serviceId } });
  }
  private async ownService(userId: string, serviceId: string) {
    const a = await this.artisanFor(userId);
    const s = await this.prisma.artisanService.findUnique({ where: { id: serviceId } });
    if (!s) throw new NotFoundException("Service introuvable.");
    if (s.artisanId !== a.id) throw new ForbiddenException("Service d'un autre artisan.");
    return s;
  }

  // ---- Espace client : parcourir + réserver --------------------------------
  async listPublic(
    page: number,
    limit: number,
    opts: { profession?: string; serviceArea?: string; search?: string },
  ) {
    const where: any = {};
    if (opts.profession) where.profession = { contains: opts.profession, mode: "insensitive" };
    if (opts.serviceArea) where.serviceArea = { contains: opts.serviceArea, mode: "insensitive" };
    if (opts.search) {
      where.OR = [
        { profession: { contains: opts.search, mode: "insensitive" } },
        { bio: { contains: opts.search, mode: "insensitive" } },
        { serviceArea: { contains: opts.search, mode: "insensitive" } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.prisma.artisan.findMany({
        where,
        include: {
          user: true,
          _count: { select: { services: true } },
          services: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
        },
        orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.artisan.count({ where }),
    ]);
    return {
      data: rows.map(mapPublicArtisan),
      meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    };
  }

  async getPublic(id: string) {
    const a = await this.prisma.artisan.findUnique({
      where: { id },
      include: { user: true, services: true },
    });
    if (!a) throw new NotFoundException("Artisan introuvable.");
    return { ...mapPublicArtisan(a), services: (a as any).services.map(mapService) };
  }

  /** Le client envoie une demande de devis à un artisan (statut REQUESTED). */
  async requestQuotation(customerId: string, artisanId: string, dto: any) {
    const a = await this.prisma.artisan.findUnique({ where: { id: artisanId } });
    if (!a) throw new NotFoundException("Artisan introuvable.");
    const amount =
      typeof dto?.budget === "number" ? dto.budget : (dto?.budget?.amount ?? 0);
    const q = await this.prisma.quotation.create({
      data: {
        artisanId,
        customerId,
        description: (dto?.description ?? "").toString(),
        amount,
        status: "REQUESTED",
      },
    });
    return mapQuotation(q);
  }

  async listQuotations(userId: string, page: number, limit: number) {
    const a = await this.artisanFor(userId);
    const rows = await this.prisma.quotation.findMany({
      where: { artisanId: a.id }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
    });
    const total = await this.prisma.quotation.count({ where: { artisanId: a.id } });
    return { data: rows.map(mapQuotation), meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } };
  }
  async createQuotation(userId: string, dto: any) {
    const a = await this.artisanFor(userId);
    const q = await this.prisma.quotation.create({
      data: { artisanId: a.id, customerId: dto.customerId, description: dto.description,
              amount: dto.amount?.amount ?? dto.amount, status: "SENT" },
    });
    return mapQuotation(q);
  }
  async updateQuotation(userId: string, quotationId: string, status: string, amount?: number) {
    const a = await this.artisanFor(userId);
    const q = await this.prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!q) throw new NotFoundException("Devis introuvable.");
    if (q.artisanId !== a.id) throw new ForbiddenException("Devis d'un autre artisan.");
    const data: any = { status };
    if (typeof amount === "number" && amount >= 0) data.amount = amount;
    const upd = await this.prisma.quotation.update({ where: { id: quotationId }, data });
    return mapQuotation(upd);
  }

  async getSchedule(userId: string) {
    const a = await this.artisanFor(userId);
    return { slots: (a.schedule as any) ?? [] };
  }
  async setSchedule(userId: string, slots: unknown) {
    const a = await this.artisanFor(userId);
    await this.prisma.artisan.update({ where: { id: a.id }, data: { schedule: slots as any } });
    return { slots };
  }

  async adminList(page: number, limit: number) {
    const [rows, total] = await Promise.all([
      this.prisma.artisan.findMany({
        include: { user: true, _count: { select: { services: true } } },
        orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.artisan.count(),
    ]);
    const data = rows.map((a: any) => ({
      id: a.id, profession: a.profession, rating: a.rating, isAvailable: a.isAvailable,
      serviceCount: a._count.services,
      name: a.user ? `${a.user.firstName ?? ""} ${a.user.lastName ?? ""}`.trim() : null,
      phone: a.user?.phone, createdAt: a.createdAt,
    }));
    return paginate(data, total, page, limit);
  }

  async adminGet(id: string) {
    const a = await this.prisma.artisan.findUnique({
      where: { id }, include: { user: true, services: true },
    });
    if (!a) throw new NotFoundException("Artisan introuvable.");
    return {
      id: a.id, profession: a.profession, bio: a.bio, rating: a.rating, isAvailable: a.isAvailable,
      serviceArea: a.serviceArea,
      name: a.user ? `${a.user.firstName ?? ""} ${a.user.lastName ?? ""}`.trim() : null, phone: a.user?.phone,
      services: a.services.map((sv: any) => ({ id: sv.id, title: sv.title, price: { amount: sv.price, currency: "XOF" }, durationMinutes: sv.durationMinutes })),
    };
  }

  async adminSetAvailability(id: string, isAvailable: boolean) {
    const a = await this.prisma.artisan.findUnique({ where: { id } });
    if (!a) throw new NotFoundException("Artisan introuvable.");
    const upd = await this.prisma.artisan.update({ where: { id }, data: { isAvailable } });
    return { id: upd.id, isAvailable: upd.isAvailable };
  }

  async earnings(userId: string) {
    const a = await this.artisanFor(userId);
    const agg = await this.prisma.quotation.aggregate({
      _sum: { amount: true }, where: { artisanId: a.id, status: "ACCEPTED" },
    });
    return { total: money(agg._sum.amount ?? 0) };
  }
}
