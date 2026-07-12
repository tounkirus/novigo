import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

const mapReview = (r: any) => ({
  id: r.id, authorId: r.authorId, targetType: r.targetType, targetId: r.targetId,
  rating: r.rating, comment: r.comment, createdAt: r.createdAt,
});

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async rateOrder(userId: string, orderId: string, rating: number, comment?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
    if (!order) throw new NotFoundException("Commande introuvable.");
    if (order.customerId !== userId) throw new ForbiddenException("Commande d'un autre utilisateur.");
    const existing = await this.prisma.review.findFirst({
      where: { authorId: userId, targetType: "ORDER", targetId: orderId },
    });
    if (existing) throw new ConflictException("Commande déjà notée.");

    const review = await this.prisma.review.create({
      data: { authorId: userId, targetType: "ORDER", targetId: orderId, rating, comment: comment ?? null },
    });

    // Répercute la note sur le livreur et recalcule sa moyenne.
    const driverId = order.delivery?.driverId;
    if (driverId) {
      await this.prisma.review.create({
        data: { authorId: userId, targetType: "DRIVER", targetId: driverId, rating, comment: comment ?? null },
      });
      const agg = await this.prisma.review.aggregate({
        _avg: { rating: true }, where: { targetType: "DRIVER", targetId: driverId },
      });
      await this.prisma.driver.update({
        where: { id: driverId }, data: { rating: agg._avg.rating ?? 0 },
      });
    }
    return mapReview(review);
  }

  async list(page: number, limit: number, targetType?: string, targetId?: string) {
    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(rows.map(mapReview), total, page, limit);
  }
}
