import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

const money = (amount: number) => ({ amount, currency: "XOF" });

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, amount: number) {
    const c = await this.prisma.coupon.findUnique({ where: { code } });
    if (!c || !c.isActive) throw new NotFoundException("Coupon invalide.");
    if (c.expiresAt && c.expiresAt < new Date()) throw new BadRequestException("Coupon expiré.");
    if (c.usageLimit != null && c.usedCount >= c.usageLimit) throw new BadRequestException("Coupon épuisé.");
    if (c.minAmount != null && amount < c.minAmount) {
      throw new BadRequestException(`Montant minimum : ${c.minAmount} FCFA.`);
    }
    let discount = c.type === "PERCENT" ? Math.floor((amount * c.value) / 100) : c.value;
    if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
    discount = Math.min(discount, amount);
    return { valid: true, code: c.code, discount: money(discount), finalAmount: money(amount - discount) };
  }

  async createCoupon(dto: any) {
    const c = await this.prisma.coupon.create({
      data: {
        code: dto.code, type: dto.type, value: dto.value, minAmount: dto.minAmount ?? null,
        maxDiscount: dto.maxDiscount ?? null, usageLimit: dto.usageLimit ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    return c;
  }

  async listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }
}
