import {
  ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { PaymentProviderRegistry } from "./providers/provider-registry";
import { ProviderTransaction } from "./providers/payment-provider";
import { NotificationsService } from "../notifications/notifications.service";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private registry: PaymentProviderRegistry,
    private notifications: NotificationsService,
  ) {}

  async initiateMobileMoney(userId: string, orderId: string, method: string, phone: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundException("Commande introuvable.");
    if (order.customerId !== userId) throw new ForbiddenException("Commande d'un autre utilisateur.");
    if (order.payment?.status === "SUCCEEDED") throw new ConflictException("Commande déjà payée.");

    const provider = this.registry.byMethod(method);
    const init = await provider.initiate({
      amount: order.total, currency: "XOF", phone, reference: order.reference,
    });
    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: { method: method as any, status: "PENDING", providerRef: init.providerRef },
      create: { orderId: order.id, userId, method: method as any, status: "PENDING", amount: order.total, providerRef: init.providerRef },
    });
    return { paymentId: payment.id, status: "PENDING", providerRef: init.providerRef, instruction: init.instruction };
  }

  /// Vérifie la signature puis applique (chemin direct, conservé pour compat/tests).
  async handleWebhook(providerName: string, rawBody: string, signature: string | undefined, payload: any) {
    const provider = this.registry.byName(providerName);
    if (!provider.verifySignature(rawBody, signature)) {
      throw new UnauthorizedException("Signature de webhook invalide.");
    }
    const { providerRef, status } = provider.parseWebhook(payload);
    return this.applyWebhookResult(providerRef, status);
  }

  /// Coeur idempotent : applique le résultat d'un webhook à un paiement.
  async applyWebhookResult(providerRef: string | undefined, status: "SUCCEEDED" | "FAILED") {
    if (!providerRef) throw new NotFoundException("Référence fournisseur absente.");
    const payment = await this.prisma.payment.findFirst({ where: { providerRef } });
    if (!payment) throw new NotFoundException("Paiement introuvable.");
    if (payment.status === "SUCCEEDED") return { alreadyProcessed: true };

    if (status === "SUCCEEDED") {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED" } });
      if (payment.orderId) {
        await this.prisma.order.update({ where: { id: payment.orderId }, data: { status: "CONFIRMED" } });
      }
      await this.prisma.paymentEvent.create({
        data: { paymentId: payment.id, type: "PAYMENT_SUCCEEDED", data: { providerRef } },
      });
      await this.notifications.create(payment.userId, "PAYMENT_CONFIRMED", "Paiement confirmé",
        `Votre paiement de ${payment.amount} FCFA est confirmé.`, { orderId: payment.orderId });
      return { processed: true, status: "SUCCEEDED" };
    }
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await this.prisma.paymentEvent.create({
      data: { paymentId: payment.id, type: "PAYMENT_FAILED", data: { providerRef } },
    });
    return { processed: true, status: "FAILED" };
  }

  async refund(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException("Paiement introuvable.");
    if (payment.status !== "SUCCEEDED") throw new ConflictException("Paiement non remboursable.");

    // Remboursement réel côté opérateur pour les paiements Mobile Money.
    // Le recrédit du wallet reste le filet interne (remboursement immédiat côté client)
    // quand l'opérateur ne supporte pas / refuse le remboursement automatique.
    let providerRefund: { ok: boolean; reason?: string; providerRef?: string } = { ok: false, reason: "not_mobile_money" };
    if ((payment.method === "ORANGE_MONEY" || payment.method === "WAVE") && payment.providerRef) {
      const provider = this.registry.byMethod(payment.method);
      providerRefund = provider.refund
        ? await provider.refund(payment.providerRef, payment.amount, payment.currency)
        : { ok: false, reason: "refund_not_supported" };
    }
    await this.prisma.paymentEvent.create({
      data: { paymentId: payment.id, type: providerRefund.ok ? "REFUND_PROVIDER_OK" : "REFUND_PROVIDER_SKIPPED",
        data: { providerRef: payment.providerRef, reason: providerRefund.reason ?? null } },
    });

    const wallet = await this.prisma.wallet.findUnique({ where: { userId: payment.userId } });
    if (wallet) {
      const balanceAfter = wallet.balance + payment.amount;
      await this.prisma.$transaction([
        this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } }),
        this.prisma.transaction.create({
          data: { walletId: wallet.id, type: "REFUND", amount: payment.amount, balanceAfter, reference: `refund-${payment.id}` },
        }),
        this.prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } }),
      ]);
    } else {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
    }
    return {
      id: payment.id, status: "REFUNDED", amount: money(payment.amount),
      providerRefunded: providerRefund.ok,
      providerRefundReason: providerRefund.ok ? undefined : providerRefund.reason,
    };
  }

  async listAdmin(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {};
    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    const data = rows.map((p) => ({
      id: p.id, orderId: p.orderId, userId: p.userId, method: p.method, status: p.status,
      amount: money(p.amount), providerRef: p.providerRef, createdAt: p.createdAt,
    }));
    return paginate(data, total, page, limit);
  }

  async payWithWallet(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundException("Commande introuvable.");
    if (order.customerId !== userId) throw new ForbiddenException("Commande d'un autre utilisateur.");
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < order.total) {
      throw new ConflictException("Solde du wallet insuffisant.");
    }
    const balanceAfter = wallet.balance - order.total;
    const [, , payment] = await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } }),
      this.prisma.transaction.create({
        data: { walletId: wallet.id, type: "PAYMENT", amount: order.total, balanceAfter, reference: order.reference },
      }),
      this.prisma.payment.upsert({
        where: { orderId: order.id },
        update: { status: "SUCCEEDED", method: "WALLET" },
        create: { orderId: order.id, userId, method: "WALLET", status: "SUCCEEDED", amount: order.total },
      }),
      this.prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } }),
    ]);
    return {
      id: payment.id, orderId: payment.orderId, userId: payment.userId, method: payment.method,
      status: payment.status, amount: money(payment.amount), providerRef: payment.providerRef,
      createdAt: payment.createdAt,
    };
  }

  // Réconciliation : rapproche les paiements internes des transactions opérateur.
  // Si l'API opérateur (Orange Money / Wave) est configurée, on récupère les
  // transactions réelles et on compare référence par référence ; sinon on tombe
  // sur un rapprochement interne (source = "internal-only") clairement signalé.
  async reconciliation(provider = "ORANGE_MONEY", dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : undefined;
    const to = dateTo ? new Date(dateTo) : undefined;

    const where: any = { method: provider as any };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }
    const payments = await this.prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });

    // Transactions réelles de l'opérateur, si disponibles.
    let providerTx: ProviderTransaction[] | null = null;
    try {
      const prov = this.registry.byMethod(provider);
      providerTx = prov.fetchProviderTransactions ? await prov.fetchProviderTransactions(from, to) : null;
    } catch { providerTx = null; }
    const source = providerTx ? "provider-api" : "internal-only";
    const byRef = new Map<string, { amount: number; status: string }>();
    for (const t of providerTx ?? []) {
      if (t.providerRef) byRef.set(t.providerRef, { amount: t.amount, status: t.status });
    }
    const seenRefs = new Set<string>();

    let internalTotal = 0, providerTotal = 0, matched = 0, discrepancies = 0;
    const lines = payments.map((p) => {
      internalTotal += p.amount;
      let status = "MATCHED";
      let providerAmount: number | undefined;

      if (!p.providerRef) {
        status = "MISSING_IN_PROVIDER"; providerAmount = undefined;
      } else if (providerTx) {
        // Rapprochement réel : on cherche la transaction opérateur correspondante.
        seenRefs.add(p.providerRef);
        const t = byRef.get(p.providerRef);
        if (!t) { status = "MISSING_IN_PROVIDER"; providerAmount = undefined; }
        else {
          providerAmount = t.amount;
          if (t.status !== "SUCCEEDED") status = "STATUS_MISMATCH";
          else if (t.amount !== p.amount) status = "AMOUNT_MISMATCH";
        }
      } else {
        // Repli interne (opérateur non branché).
        providerAmount = p.amount;
        if (p.status === "FAILED") { status = "AMOUNT_MISMATCH"; providerAmount = 0; }
      }

      if (providerAmount != null) providerTotal += providerAmount;
      if (status === "MATCHED") matched++; else discrepancies++;
      return {
        internalRef: p.id, providerRef: p.providerRef, provider,
        internalAmount: money(p.amount),
        providerAmount: providerAmount != null ? money(providerAmount) : undefined,
        status, occurredAt: p.createdAt,
      };
    });

    // Transactions présentes chez l'opérateur mais absentes en interne (orphelines).
    const orphans = (providerTx ?? [])
      .filter((t) => t.providerRef && !seenRefs.has(t.providerRef))
      .map((t) => ({
        internalRef: null, providerRef: t.providerRef, provider,
        internalAmount: undefined, providerAmount: money(t.amount),
        status: "MISSING_IN_INTERNAL", occurredAt: t.occurredAt ?? null,
      }));
    for (const o of orphans) { providerTotal += o.providerAmount!.amount; discrepancies++; }

    return {
      provider,
      source,
      periodFrom: dateFrom ?? null,
      periodTo: dateTo ?? null,
      summary: {
        internalTotal: money(internalTotal),
        providerTotal: money(providerTotal),
        difference: money(internalTotal - providerTotal),
        matched, discrepancies, orphans: orphans.length,
      },
      lines: [...lines, ...orphans],
    };
  }
}
