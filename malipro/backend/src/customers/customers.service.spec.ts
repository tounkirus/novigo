import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";

describe("CustomersService", () => {
  it("quotations : mappe artisan + montant et pagine", async () => {
    const prisma = {
      quotation: {
        findMany: jest.fn().mockResolvedValue([
          { id: "q1", artisanId: "a1", description: "Fuite", amount: 5000, status: "SENT", createdAt: new Date(0),
            artisan: { profession: "Plombier", user: { firstName: "Amadou", lastName: "Traoré" } } },
          { id: "q2", artisanId: "a2", description: "x", amount: 1000, status: "DRAFT", createdAt: new Date(0), artisan: null },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
    } as any;
    const res = await new CustomersService(prisma).quotations("me", 1, 10);
    expect(res.data[0]).toMatchObject({ artisanName: "Amadou Traoré", artisanProfession: "Plombier" });
    expect(res.data[1].artisanName).toBeNull();
    expect(res.meta.total).toBe(2);
  });

  it("respondQuotation : refuse un statut invalide", async () => {
    await expect(new CustomersService({} as any).respondQuotation("me", "q1", "MAYBE"))
      .rejects.toThrow(BadRequestException);
  });

  it("respondQuotation : introuvable ou autre client -> NotFound", async () => {
    const prisma = { quotation: { findUnique: jest.fn().mockResolvedValue({ id: "q1", customerId: "other" }) } } as any;
    await expect(new CustomersService(prisma).respondQuotation("me", "q1", "ACCEPTED"))
      .rejects.toThrow(NotFoundException);
  });

  it("respondQuotation : accepte et met à jour", async () => {
    const prisma = {
      quotation: {
        // Devis envoyé et encore valide : l'acceptation exige les deux (ch.4 §7).
        findUnique: jest.fn().mockResolvedValue({
          id: "q1", customerId: "me", artisanId: "a1", status: "SENT", amount: 100_000,
          depositAmount: null, depositPercent: 30, warrantyMonths: 12, warrantyTerms: "Pièces",
          expiresAt: new Date(Date.now() + 5 * 24 * 3600_000), lockedAt: null,
        }),
        update: jest.fn().mockResolvedValue({ id: "q1", status: "ACCEPTED" }),
      },
      worksite: {
        create: jest.fn().mockResolvedValue({ id: "w1", status: "AWAITING_DEPOSIT" }),
      },
      quotationEvent: { create: jest.fn().mockResolvedValue({}) },
      worksiteEvent: { create: jest.fn().mockResolvedValue({}) },
      // La transaction rend les résultats des opérations qu'on lui passe.
      $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
    } as any;

    const res = await new CustomersService(prisma).respondQuotation("me", "q1", "ACCEPTED");
    expect(res.status).toBe("ACCEPTED");
    // Le chantier naît avec l'acceptation (ch.5 §2), en attente de l'acompte.
    expect(res.worksite).toMatchObject({ id: "w1", status: "AWAITING_DEPOSIT" });
    const created = prisma.worksite.create.mock.calls[0][0].data;
    expect(created).toMatchObject({
      quotationId: "q1", artisanId: "a1", customerId: "me",
      status: "AWAITING_DEPOSIT", depositDue: 30_000, warrantyMonths: 12,
    });
  });

  it("respondQuotation : refuse sans créer de chantier", async () => {
    const prisma = {
      quotation: {
        findUnique: jest.fn().mockResolvedValue({
          id: "q1", customerId: "me", artisanId: "a1", status: "SENT", amount: 100_000,
          expiresAt: new Date(Date.now() + 5 * 24 * 3600_000), lockedAt: null,
        }),
        update: jest.fn().mockResolvedValue({ id: "q1", status: "REFUSED" }),
      },
      quotationEvent: { create: jest.fn().mockResolvedValue({}) },
      worksite: { create: jest.fn() },
    } as any;

    expect((await new CustomersService(prisma).respondQuotation("me", "q1", "REJECTED")).status)
      .toBe("REFUSED");
    expect(prisma.worksite.create).not.toHaveBeenCalled();
  });

  it("dashboard : agrège compteurs + wallet + commandes récentes", async () => {
    const prisma = {
      order: {
        count: jest.fn().mockResolvedValueOnce(7).mockResolvedValueOnce(3),
        findMany: jest.fn().mockResolvedValue([{ id: "o1", reference: "R1", customerId: "me", type: "FOOD", status: "DELIVERED", total: 5000, createdAt: new Date(0) }]),
      },
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", balance: 12000, isLocked: false, updatedAt: new Date(0) }) },
    } as any;
    const res = await new CustomersService(prisma).dashboard("me");
    expect(res.ordersCount).toBe(7);
    expect(res.deliveredCount).toBe(3);
    expect(res.walletBalance).toEqual({ amount: 12000, currency: "XOF" });
    expect(res.recentOrders).toHaveLength(1);
  });

  it("dashboard : crée le wallet si absent", async () => {
    const prisma = {
      order: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      wallet: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ balance: 0 }) },
    } as any;
    const res = await new CustomersService(prisma).dashboard("me");
    expect(prisma.wallet.create).toHaveBeenCalledWith({ data: { userId: "me" } });
    expect(res.walletBalance.amount).toBe(0);
  });

  it("orders : filtre par statut et pagine", async () => {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([{ id: "o1", reference: "R1", customerId: "me", type: "FOOD", status: "PENDING", total: 100, createdAt: new Date(0) }]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const res = await new CustomersService(prisma).orders("me", 1, 10, "PENDING");
    expect(res.data).toHaveLength(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId: "me", status: "PENDING" } }));
  });

  it("walletView : renvoie le solde", async () => {
    const prisma = { wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", balance: 500, isLocked: true, updatedAt: new Date(0) }) } } as any;
    const res = await new CustomersService(prisma).walletView("me");
    expect(res).toMatchObject({ id: "w1", balance: { amount: 500, currency: "XOF" }, isLocked: true });
  });

  it("loyalty : calcule points et palier", async () => {
    const prisma = { order: { count: jest.fn().mockResolvedValue(25) } } as any;
    const res = await new CustomersService(prisma).loyalty("me");
    expect(res).toEqual({ points: 250, tier: "ARGENT", deliveredOrders: 25 });
    prisma.order.count.mockResolvedValue(60);
    expect((await new CustomersService(prisma).loyalty("me")).tier).toBe("OR");
    prisma.order.count.mockResolvedValue(1);
    expect((await new CustomersService(prisma).loyalty("me")).tier).toBe("BRONZE");
  });
});
