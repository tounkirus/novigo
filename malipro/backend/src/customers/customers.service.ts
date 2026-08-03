import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { refusalToAccept } from "../artisans/quotation.rules";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

const mapOrder = (o: any) => ({
  id: o.id, reference: o.reference, customerId: o.customerId, type: o.type, status: o.status,
  total: money(o.total), paymentMethod: o.paymentMethod ?? undefined, createdAt: o.createdAt,
});

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private async wallet(userId: string) {
    const w = await this.prisma.wallet.findUnique({ where: { userId } });
    return w ?? this.prisma.wallet.create({ data: { userId } });
  }

  /** Demandes de devis/services envoyées par le client aux artisans. */
  async quotations(userId: string, page: number, limit: number) {
    const where = { customerId: userId };
    const [rows, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        include: { artisan: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quotation.count({ where }),
    ]);
    const data = rows.map((q: any) => ({
      id: q.id,
      artisanId: q.artisanId,
      artisanName: q.artisan?.user
        ? [q.artisan.user.firstName, q.artisan.user.lastName].filter(Boolean).join(" ") || null
        : null,
      artisanProfession: q.artisan?.profession ?? null,
      description: q.description,
      amount: money(q.amount),
      status: q.status,
      createdAt: q.createdAt,
    }));
    return paginate(data, total, page, limit);
  }

  /**
   * Le client accepte ou refuse le devis proposé par l'artisan (ch.4 §8).
   *
   * L'acceptation verrouille le document : un devis accepté est un engagement
   * commercial et ne peut plus être modifié (§6).
   */
  async respondQuotation(customerId: string, quotationId: string, status: string) {
    // « REJECTED » reste accepté en entrée pour ne pas casser les applications
    // déjà déployées, mais le statut stocké est celui du cahier des charges.
    const decision = status === "REJECTED" ? "REFUSED" : status;
    if (decision !== "ACCEPTED" && decision !== "REFUSED") {
      throw new BadRequestException("Statut invalide (ACCEPTED ou REFUSED).");
    }
    const q = await this.prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!q || q.customerId !== customerId) {
      throw new NotFoundException("Demande introuvable.");
    }
    const now = new Date();
    if (decision === "ACCEPTED") {
      const refusal = refusalToAccept(
        { status: q.status, expiresAt: q.expiresAt, lockedAt: q.lockedAt },
        now,
      );
      if (refusal) throw new BadRequestException(refusal);
    }
    const upd = await this.prisma.quotation.update({
      where: { id: quotationId },
      data: decision === "ACCEPTED"
        ? { status: "ACCEPTED", acceptedAt: now, lockedAt: now }
        : { status: "REFUSED", refusedAt: now },
    });
    return { id: upd.id, status: upd.status };
  }

  async dashboard(userId: string) {
    const [ordersCount, delivered, recent, w] = await Promise.all([
      this.prisma.order.count({ where: { customerId: userId } }),
      this.prisma.order.count({ where: { customerId: userId, status: "DELIVERED" } }),
      this.prisma.order.findMany({
        where: { customerId: userId }, orderBy: { createdAt: "desc" }, take: 5,
      }),
      this.wallet(userId),
    ]);
    return {
      ordersCount,
      deliveredCount: delivered,
      walletBalance: money(w.balance),
      recentOrders: recent.map(mapOrder),
    };
  }

  async orders(userId: string, page: number, limit: number, status?: string) {
    const where: any = { customerId: userId };
    if (status) where.status = status;
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(rows.map(mapOrder), total, page, limit);
  }

  async walletView(userId: string) {
    const w = await this.wallet(userId);
    return { id: w.id, userId, balance: money(w.balance), isLocked: w.isLocked, updatedAt: w.updatedAt };
  }

  async loyalty(userId: string) {
    const delivered = await this.prisma.order.count({ where: { customerId: userId, status: "DELIVERED" } });
    const points = delivered * 10;
    const tier = points >= 500 ? "OR" : points >= 200 ? "ARGENT" : "BRONZE";
    return { points, tier, deliveredOrders: delivered };
  }
}
