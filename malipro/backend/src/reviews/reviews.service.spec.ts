import { ConflictException, ForbiddenException } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";

const base = () => ({
  order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", delivery: { driverId: null } }) },
  review: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: "r1", authorId: "me", targetType: "ORDER", targetId: "o1", rating: 5 }),
    aggregate: jest.fn(),
  },
  driver: { update: jest.fn() },
});

describe("ReviewsService.rateOrder", () => {
  it("crée un avis pour une commande de l'utilisateur", async () => {
    const prisma = base() as any;
    const res = await new ReviewsService(prisma).rateOrder("me", "o1", 5, "Parfait");
    expect(res.rating).toBe(5);
    expect(prisma.review.create).toHaveBeenCalled();
  });

  it("refuse de noter la commande d'autrui", async () => {
    const prisma = base() as any;
    prisma.order.findUnique.mockResolvedValue({ id: "o1", customerId: "other", delivery: null });
    await expect(new ReviewsService(prisma).rateOrder("me", "o1", 5)).rejects.toThrow(ForbiddenException);
  });

  it("refuse une double notation", async () => {
    const prisma = base() as any;
    prisma.review.findFirst.mockResolvedValue({ id: "existing" });
    await expect(new ReviewsService(prisma).rateOrder("me", "o1", 4)).rejects.toThrow(ConflictException);
  });
});
