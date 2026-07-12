import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

const money = (amount: number, currency = "XOF") => ({ amount, currency });

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  private async ensure(userId: string) {
    const w = await this.prisma.wallet.findUnique({ where: { userId } });
    return w ?? this.prisma.wallet.create({ data: { userId } });
  }

  async balance(userId: string) {
    const w = await this.ensure(userId);
    return { id: w.id, userId: w.userId, balance: money(w.balance), isLocked: w.isLocked, updatedAt: w.updatedAt };
  }

  async deposit(userId: string, amount: number, method: string) {
    const w = await this.ensure(userId);
    const balanceAfter = w.balance + amount;
    const [updated] = await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: w.id }, data: { balance: balanceAfter } }),
      this.prisma.transaction.create({
        data: { walletId: w.id, type: "DEPOSIT", amount, balanceAfter, reference: `DEP-${method}` },
      }),
    ]);
    return { id: updated.id, userId, balance: money(updated.balance), isLocked: updated.isLocked, updatedAt: updated.updatedAt };
  }

  async withdraw(userId: string, amount: number, method: string) {
    const w = await this.ensure(userId);
    if (w.isLocked) throw new ForbiddenException("Portefeuille verrouillé.");
    if (amount <= 0) throw new BadRequestException("Montant invalide.");
    if (w.balance < amount) throw new BadRequestException("Solde insuffisant.");
    const balanceAfter = w.balance - amount;
    const [updated] = await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: w.id }, data: { balance: balanceAfter } }),
      this.prisma.transaction.create({
        data: { walletId: w.id, type: "WITHDRAWAL", amount, balanceAfter, reference: `WDR-${method}` },
      }),
    ]);
    // [À BRANCHER] versement réel vers Mobile Money (payout Orange/Wave) via le provider.
    return { id: updated.id, userId, balance: money(updated.balance), isLocked: updated.isLocked, updatedAt: updated.updatedAt };
  }

  async transfer(userId: string, toPhone: string, amount: number) {
    if (amount <= 0) throw new BadRequestException("Montant invalide.");
    const sender = await this.ensure(userId);
    if (sender.isLocked) throw new ForbiddenException("Portefeuille verrouillé.");
    if (sender.balance < amount) throw new BadRequestException("Solde insuffisant.");
    const recipientUser = await this.prisma.user.findUnique({ where: { phone: toPhone } });
    if (!recipientUser) throw new NotFoundException("Destinataire introuvable.");
    if (recipientUser.id === userId) throw new BadRequestException("Transfert vers soi-même impossible.");
    const recipientWallet = await this.ensure(recipientUser.id);

    const senderAfter = sender.balance - amount;
    const recipientAfter = recipientWallet.balance + amount;
    await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: sender.id }, data: { balance: senderAfter } }),
      this.prisma.wallet.update({ where: { id: recipientWallet.id }, data: { balance: recipientAfter } }),
      this.prisma.transaction.create({
        data: { walletId: sender.id, type: "TRANSFER", amount, balanceAfter: senderAfter, reference: `TRF-OUT-${toPhone}` },
      }),
      this.prisma.transaction.create({
        data: { walletId: recipientWallet.id, type: "TRANSFER", amount, balanceAfter: recipientAfter, reference: "TRF-IN" },
      }),
    ]);
    return { balance: money(senderAfter), transferred: money(amount), to: toPhone };
  }

  async transactions(userId: string, page: number, limit: number) {
    const w = await this.ensure(userId);
    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: w.id }, orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.transaction.count({ where: { walletId: w.id } }),
    ]);
    const data = rows.map((t) => ({
      id: t.id, walletId: t.walletId, type: t.type, amount: money(t.amount),
      balanceAfter: money(t.balanceAfter), reference: t.reference, createdAt: t.createdAt,
    }));
    return paginate(data, total, page, limit);
  }
}
