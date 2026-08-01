import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { mapOptionGroups } from "../catalog/catalog.service";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

const mapStore = (s: any) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  description: s.description,
  phone: s.phone,
  address: s.address,
  hours: s.hours ?? undefined,
  logoUrl: s.logoUrl,
  coverUrl: s.coverUrl,
  rating: s.rating,
  isOpen: s.isOpen,
  deliveryFee: money(s.deliveryFee),
  productCount: s._count?.products ?? undefined,
});

const mapProduct = (p: any) => {
  const finalAmount = p.promoPercent ? Math.round(p.price * (1 - p.promoPercent / 100)) : p.price;
  const stockState = !p.inStock || p.stockQuantity <= 0 ? "OUT_OF_STOCK" : p.stockQuantity <= 5 ? "LIMITED" : "AVAILABLE";
  return {
    id: p.id, name: p.name, description: p.description, category: p.category,
    menuCategoryId: p.menuCategoryId,
    price: money(p.price), promoPercent: p.promoPercent ?? undefined, finalPrice: money(finalAmount),
    imageUrl: p.imageUrl, images: p.images ?? [],
    inStock: p.inStock, stockQuantity: p.stockQuantity, stockState,
    optionGroups: mapOptionGroups(p),
  };
};

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async list(page: number, limit: number, search?: string, category?: string) {
    // Vitrines publiques : uniquement les commerçants approuvés & actifs.
    const where: any = { merchant: { status: "APPROVED", isActive: true } };
    if (search) where.name = { contains: search, mode: "insensitive" as const };
    if (category) where.category = category;
    const [rows, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: [{ isOpen: "desc" }, { rating: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.store.count({ where }),
    ]);
    return paginate(rows.map(mapStore), total, page, limit);
  }

  async detail(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        _count: { select: { products: { where: { status: "PUBLISHED" } } } },
        products: { where: { status: "PUBLISHED" }, orderBy: { name: "asc" }, include: { optionGroups: { include: { choices: true } } } },
        categories: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    });
    if (!store) throw new NotFoundException("Boutique introuvable.");
    return {
      ...mapStore(store),
      categories: (store as any).categories.map((c: any) => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })),
      products: (store as any).products.map(mapProduct),
    };
  }
}
