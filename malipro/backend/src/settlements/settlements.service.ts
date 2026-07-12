import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

interface StatementLine { providerRef: string; amount: number; }

/// Classement d'une ligne de rapprochement.
type ItemStatus = "MATCHED" | "MISMATCH" | "MISSING" | "ORPHAN";

@Injectable()
export class SettlementsService {
  constructor(private prisma: PrismaService) {}

  /// Rapproche le relevé opérateur avec les paiements internes SUCCEEDED de la période.
  async reconcile(provider: string, periodStart: string, periodEnd: string, statement: StatementLine[]) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const payments = await this.prisma.payment.findMany({
      where: { method: provider as any, status: "SUCCEEDED", createdAt: { gte: start, lte: end } },
    });

    const stmtByRef = new Map<string, StatementLine>();
    for (const line of statement) if (line.providerRef) stmtByRef.set(line.providerRef, line);
    const seen = new Set<string>();

    const items: Array<{
      paymentId?: string; providerRef: string; expectedAmount: number; receivedAmount: number; status: ItemStatus;
    }> = [];

    // Paiements internes -> MATCHED / MISMATCH / MISSING
    for (const p of payments) {
      const ref = p.providerRef ?? "";
      const stmt = ref ? stmtByRef.get(ref) : undefined;
      if (stmt) seen.add(ref);
      let status: ItemStatus;
      if (!stmt) status = "MISSING";
      else if (stmt.amount !== p.amount) status = "MISMATCH";
      else status = "MATCHED";
      items.push({
        paymentId: p.id, providerRef: ref,
        expectedAmount: p.amount, receivedAmount: stmt?.amount ?? 0, status,
      });
    }
    // Lignes du relevé sans paiement interne -> ORPHAN
    for (const line of statement) {
      if (!seen.has(line.providerRef)) {
        items.push({ providerRef: line.providerRef, expectedAmount: 0, receivedAmount: line.amount, status: "ORPHAN" });
      }
    }

    const totalExpected = payments.reduce((s, p) => s + p.amount, 0);
    const totalReceived = statement.reduce((s, l) => s + (l.amount ?? 0), 0);
    const discrepancyCount = items.filter((i) => i.status !== "MATCHED").length;

    const settlement = await this.prisma.settlement.create({
      data: {
        provider, periodStart: start, periodEnd: end,
        status: discrepancyCount > 0 ? "DISCREPANCY" : "RECONCILED",
        totalExpected, totalReceived, discrepancyCount,
        items: { create: items },
      },
      include: { items: true },
    });
    return this.map(settlement);
  }

  async list(page: number, limit: number) {
    const [rows, total] = await Promise.all([
      this.prisma.settlement.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.settlement.count(),
    ]);
    return paginate(rows.map((r) => this.map(r)), total, page, limit);
  }

  async get(id: string) {
    const s = await this.prisma.settlement.findUnique({ where: { id }, include: { items: true } });
    if (!s) throw new NotFoundException("Settlement introuvable.");
    return this.map(s);
  }

  private map(s: any) {
    return {
      id: s.id, provider: s.provider, periodStart: s.periodStart, periodEnd: s.periodEnd,
      status: s.status,
      totalExpected: { amount: s.totalExpected, currency: "XOF" },
      totalReceived: { amount: s.totalReceived, currency: "XOF" },
      discrepancyCount: s.discrepancyCount,
      items: s.items?.map((i: any) => ({
        id: i.id, paymentId: i.paymentId, providerRef: i.providerRef,
        expectedAmount: i.expectedAmount, receivedAmount: i.receivedAmount, status: i.status,
      })),
    };
  }
}
