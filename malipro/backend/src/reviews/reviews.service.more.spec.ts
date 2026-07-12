import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";

describe("ReviewsService (couverture complète)", () => {
  it("rateOrder : commande introuvable -> NotFound", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ReviewsService(prisma).rateOrder("me", "o1", 5)).rejects.toThrow(NotFoundException);
  });

  it("rateOrder : commande d'autrui -> Forbidden", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "other", delivery: null }) } } as any;
    await expect(new ReviewsService(prisma).rateOrder("me", "o1", 5)).rejects.toThrow(ForbiddenException);
  });

  it("rateOrder : déjà notée -> Conflict", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", delivery: null }) },
      review: { findFirst: jest.fn().mockResolvedValue({ id: "r0" }) },
    } as any;
    await expect(new ReviewsService(prisma).rateOrder("me", "o1", 5)).rejects.toThrow(ConflictException);
  });

  it("rateOrder : sans livreur -> crée uniquement la note commande", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", delivery: { driverId: null } }) },
      review: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: "r1", authorId: "me", targetType: "ORDER", targetId: "o1", rating: 5 }) },
    } as any;
    const res = await new ReviewsService(prisma).rateOrder("me", "o1", 5, "super");
    expect(res.id).toBe("r1");
    expect(prisma.review.create).toHaveBeenCalledTimes(1);
  });

  it("rateOrder : avec livreur -> crée note driver + recalcule la moyenne", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", delivery: { driverId: "d1" } }) },
      review: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "r1", authorId: "me", targetType: "ORDER", targetId: "o1", rating: 4 }),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 } }),
      },
      driver: { update: jest.fn() },
    } as any;
    await new ReviewsService(prisma).rateOrder("me", "o1", 4);
    expect(prisma.review.create).toHaveBeenCalledTimes(2);
    expect(prisma.driver.update).toHaveBeenCalledWith(expect.objectContaining({ data: { rating: 4.5 } }));
  });

  it("rateOrder : moyenne nulle -> rating 0", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", delivery: { driverId: "d1" } }) },
      review: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "r1" }),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null } }),
      },
      driver: { update: jest.fn() },
    } as any;
    await new ReviewsService(prisma).rateOrder("me", "o1", 4);
    expect(prisma.driver.update).toHaveBeenCalledWith(expect.objectContaining({ data: { rating: 0 } }));
  });

  it("list : filtre par cible et pagine", async () => {
    const prisma = { review: { findMany: jest.fn().mockResolvedValue([{ id: "r1" }]), count: jest.fn().mockResolvedValue(1) } } as any;
    await new ReviewsService(prisma).list(1, 10, "DRIVER", "d1");
    expect(prisma.review.findMany.mock.calls[0][0].where).toEqual({ targetType: "DRIVER", targetId: "d1" });
  });
});
