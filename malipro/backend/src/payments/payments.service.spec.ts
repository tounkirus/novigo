import { ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

const notifications = { create: jest.fn() } as any;
const provider = {
  initiate: jest.fn().mockResolvedValue({ providerRef: "OM-1", instruction: "#144#" }),
  verifySignature: jest.fn().mockReturnValue(true),
  parseWebhook: jest.fn().mockReturnValue({ providerRef: "OM-1", status: "SUCCEEDED" }),
};
const registry = { byMethod: () => provider, byName: () => provider } as any;

describe("PaymentsService Mobile Money", () => {
  it("initie un paiement Mobile Money (PENDING + providerRef)", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", total: 5000, reference: "CMD-1", payment: null }) },
      payment: { upsert: jest.fn().mockResolvedValue({ id: "p1", providerRef: "OM-1" }) },
    } as any;
    const res = await new PaymentsService(prisma, registry, notifications).initiateMobileMoney("me", "o1", "ORANGE_MONEY", "+22370000000");
    expect(res.status).toBe("PENDING");
    expect(res.providerRef).toBe("OM-1");
    expect(res.instruction).toContain("144");
  });

  it("webhook SUCCEEDED -> paiement confirmé + commande CONFIRMED", async () => {
    const prisma = {
      payment: {
        findFirst: jest.fn().mockResolvedValue({ id: "p1", status: "PENDING", orderId: "o1", userId: "me", amount: 5000 }),
        update: jest.fn().mockResolvedValue({}),
      },
      order: { update: jest.fn().mockResolvedValue({}) },
      paymentEvent: { create: jest.fn().mockResolvedValue({}) },
    } as any;
    const res = await new PaymentsService(prisma, registry, notifications).handleWebhook("orange-money", "{}", "sig", { status: "SUCCESS", reference: "OM-1" });
    expect(res).toEqual({ processed: true, status: "SUCCEEDED" });
    expect(prisma.order.update).toHaveBeenCalled();
    expect(notifications.create).toHaveBeenCalled();
  });

  it("webhook idempotent si déjà SUCCEEDED", async () => {
    const prisma = { payment: { findFirst: jest.fn().mockResolvedValue({ id: "p1", status: "SUCCEEDED" }) } } as any;
    const res = await new PaymentsService(prisma, registry, notifications).handleWebhook("orange-money", "{}", "sig", { status: "SUCCESS", reference: "OM-1" });
    expect(res).toEqual({ alreadyProcessed: true });
  });

  it("refund : paiement non SUCCEEDED -> conflit", async () => {
    const prisma = { payment: { findUnique: jest.fn().mockResolvedValue({ id: "p1", status: "PENDING" }) } } as any;
    await expect(new PaymentsService(prisma, registry, notifications).refund("p1")).rejects.toThrow(ConflictException);
  });

  it("refund : appelle l'opérateur, recrédite le wallet et marque REFUNDED", async () => {
    const refundProvider = { refund: jest.fn().mockResolvedValue({ ok: true, providerRef: "OM-1" }) };
    const reg = { byMethod: () => refundProvider } as any;
    const prisma = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({ id: "p1", status: "SUCCEEDED", method: "ORANGE_MONEY", providerRef: "OM-1", userId: "me", amount: 5000, currency: "XOF" }),
        update: jest.fn().mockResolvedValue({}),
      },
      paymentEvent: { create: jest.fn().mockResolvedValue({}) },
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", balance: 1000 }), update: jest.fn() },
      transaction: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([{}, {}, {}]),
    } as any;
    const res = await new PaymentsService(prisma, reg, notifications).refund("p1");
    expect(refundProvider.refund).toHaveBeenCalledWith("OM-1", 5000, "XOF");
    expect(res.status).toBe("REFUNDED");
    expect(res.providerRefunded).toBe(true);
    expect(prisma.paymentEvent.create).toHaveBeenCalled();
  });

  it("réconciliation : rapproche les transactions opérateur réelles (source=provider-api)", async () => {
    const reconProvider = {
      fetchProviderTransactions: jest.fn().mockResolvedValue([
        { providerRef: "OM-1", amount: 5000, currency: "XOF", status: "SUCCEEDED" },
        { providerRef: "OM-orphan", amount: 700, currency: "XOF", status: "SUCCEEDED" },
      ]),
    };
    const reg = { byMethod: () => reconProvider } as any;
    const prisma = {
      payment: {
        findMany: jest.fn().mockResolvedValue([
          { id: "p1", providerRef: "OM-1", amount: 5000, status: "SUCCEEDED", createdAt: new Date(0) },
          { id: "p2", providerRef: "OM-missing", amount: 300, status: "SUCCEEDED", createdAt: new Date(0) },
        ]),
      },
    } as any;
    const res = await new PaymentsService(prisma, reg, notifications).reconciliation("ORANGE_MONEY");
    expect(res.source).toBe("provider-api");
    expect(res.summary.matched).toBe(1);
    expect(res.summary.orphans).toBe(1); // OM-orphan présent opérateur, absent interne
    // p2 (OM-missing) absent opérateur => discrepance
    expect((res.lines.find((l: any) => l.internalRef === "p2") as any)?.status).toBe("MISSING_IN_PROVIDER");
  });

  it("réconciliation : repli interne quand l'opérateur n'est pas branché", async () => {
    const reg = { byMethod: () => ({ fetchProviderTransactions: jest.fn().mockResolvedValue(null) }) } as any;
    const prisma = {
      payment: { findMany: jest.fn().mockResolvedValue([
        { id: "p1", providerRef: "OM-1", amount: 5000, status: "SUCCEEDED", createdAt: new Date(0) },
        { id: "p2", providerRef: null, amount: 300, status: "SUCCEEDED", createdAt: new Date(0) },
        { id: "p3", providerRef: "OM-3", amount: 100, status: "FAILED", createdAt: new Date(0) },
      ]) },
    } as any;
    const res = await new PaymentsService(prisma, reg, notifications).reconciliation("ORANGE_MONEY", "2026-01-01", "2026-02-01");
    expect(res.source).toBe("internal-only");
    expect(res.summary.matched).toBe(1);
    expect(res.summary.discrepancies).toBe(2);
  });

  it("initiate : commande d'un autre utilisateur -> Forbidden", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "other", total: 1, payment: null }) } } as any;
    await expect(new PaymentsService(prisma, registry, notifications).initiateMobileMoney("me", "o1", "WAVE", "+1"))
      .rejects.toThrow(ForbiddenException);
  });

  it("initiate : commande déjà payée -> Conflict", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", total: 1, payment: { status: "SUCCEEDED" } }) } } as any;
    await expect(new PaymentsService(prisma, registry, notifications).initiateMobileMoney("me", "o1", "WAVE", "+1"))
      .rejects.toThrow(ConflictException);
  });

  it("handleWebhook : signature invalide -> Unauthorized", async () => {
    const badReg = { byName: () => ({ verifySignature: () => false }) } as any;
    await expect(new PaymentsService({} as any, badReg, notifications).handleWebhook("wave", "{}", "sig", {}))
      .rejects.toThrow(UnauthorizedException);
  });

  it("webhook FAILED -> paiement marqué FAILED", async () => {
    const prisma = {
      payment: { findFirst: jest.fn().mockResolvedValue({ id: "p1", status: "PENDING", orderId: "o1", userId: "me", amount: 5000 }), update: jest.fn() },
      paymentEvent: { create: jest.fn() },
    } as any;
    const failProvider = { verifySignature: () => true, parseWebhook: () => ({ providerRef: "OM-1", status: "FAILED" }) };
    const reg = { byName: () => failProvider } as any;
    const res = await new PaymentsService(prisma, reg, notifications).handleWebhook("orange-money", "{}", "s", {});
    expect(res).toEqual({ processed: true, status: "FAILED" });
  });

  it("applyWebhookResult : providerRef absent -> NotFound", async () => {
    await expect(new PaymentsService({} as any, registry, notifications).applyWebhookResult(undefined, "SUCCEEDED"))
      .rejects.toThrow(NotFoundException);
  });

  it("payWithWallet : succès débite le wallet et confirme la commande", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", total: 2000, reference: "CMD-1", payment: null }), update: jest.fn() },
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", balance: 5000 }), update: jest.fn() },
      transaction: { create: jest.fn() },
      payment: { upsert: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([{}, {}, { id: "pay1", orderId: "o1", userId: "me", method: "WALLET", status: "SUCCEEDED", amount: 2000, providerRef: null, createdAt: new Date(0) }, {}]),
    } as any;
    const res = await new PaymentsService(prisma, registry, notifications).payWithWallet("me", "o1");
    expect(res.status).toBe("SUCCEEDED");
    expect(res.method).toBe("WALLET");
  });

  it("payWithWallet : solde insuffisant -> Conflict", async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue({ id: "o1", customerId: "me", total: 9000, payment: null }) },
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: "w1", balance: 100 }) },
    } as any;
    await expect(new PaymentsService(prisma, registry, notifications).payWithWallet("me", "o1")).rejects.toThrow(ConflictException);
  });

  it("listAdmin : pagine et filtre par statut", async () => {
    const prisma = {
      payment: {
        findMany: jest.fn().mockResolvedValue([{ id: "p1", orderId: "o1", userId: "me", method: "WAVE", status: "SUCCEEDED", amount: 1000, providerRef: "WV-1", createdAt: new Date(0) }]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const res = await new PaymentsService(prisma, registry, notifications).listAdmin(1, 20, "SUCCEEDED");
    expect(res.data).toHaveLength(1);
    expect(res.data[0].amount).toEqual({ amount: 1000, currency: "XOF" });
  });

  it("refund : sans wallet, marque REFUNDED sans recrédit", async () => {
    const prisma = {
      payment: { findUnique: jest.fn().mockResolvedValue({ id: "p1", status: "SUCCEEDED", method: "WALLET", providerRef: null, userId: "me", amount: 1000, currency: "XOF" }), update: jest.fn() },
      paymentEvent: { create: jest.fn() },
      wallet: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const res = await new PaymentsService(prisma, registry, notifications).refund("p1");
    expect(res.status).toBe("REFUNDED");
    expect(res.providerRefunded).toBe(false);
  });
});
