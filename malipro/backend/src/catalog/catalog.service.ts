import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

/// Mappe les groupes d'options d'un produit (triés) pour l'app cliente.
export const mapOptionGroups = (p: any) =>
  (p.optionGroups ?? [])
    .slice()
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((g: any) => ({
      id: g.id, name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect,
      required: g.minSelect > 0, multiple: g.maxSelect > 1,
      choices: (g.choices ?? [])
        .slice()
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((c: any) => ({ id: c.id, name: c.name, priceDelta: c.priceDelta })),
    }));

/// Mappe un produit complet (prix promo, photos, stock, options) pour l'app cliente.
export const mapCatalogProduct = (p: any) => {
  const finalAmount = p.promoPercent ? Math.round(p.price * (1 - p.promoPercent / 100)) : p.price;
  const stockState = !p.inStock || p.stockQuantity <= 0 ? "OUT_OF_STOCK" : p.stockQuantity <= 5 ? "LIMITED" : "AVAILABLE";
  return {
    id: p.id, name: p.name, description: p.description, category: p.category, menuCategoryId: p.menuCategoryId,
    price: money(p.price), promoPercent: p.promoPercent ?? undefined, finalPrice: money(finalAmount),
    imageUrl: p.imageUrl, images: p.images ?? [],
    inStock: p.inStock, stockQuantity: p.stockQuantity, stockState,
    optionGroups: mapOptionGroups(p),
  };
};

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async list(page: number, limit: number, search?: string, category?: string) {
    // Catalogue public : uniquement les produits publiés (modération), et
    // rattachés à un commerçant approuvé & actif (ou sans boutique = catalogue plateforme).
    const where: any = {
      status: "PUBLISHED",
      OR: [{ storeId: null }, { store: { merchant: { status: "APPROVED", isActive: true } } }],
    };
    if (search) where.name = { contains: search, mode: "insensitive" as const };
    if (category) where.category = category;
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit,
        include: { optionGroups: { include: { choices: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);
    const data = rows.map((p) => mapCatalogProduct(p));
    return paginate(data, total, page, limit);
  }
}
