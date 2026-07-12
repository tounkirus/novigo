import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const BONUS = 500; // FCFA crédités au parrain

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private genCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  /// Mon code de parrainage (généré au besoin) + statistiques.
  async myReferral(userId: string) {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Utilisateur introuvable.");
    if (!user.referralCode) {
      user = await this.prisma.user.update({ where: { id: userId }, data: { referralCode: this.genCode() } });
    }
    const [referredCount, rewarded] = await Promise.all([
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.referral.findMany({ where: { referrerId: userId, status: "REWARDED" } }),
    ]);
    const totalEarned = rewarded.reduce((s: number, r: any) => s + r.rewardAmount, 0);
    return { code: user.referralCode, referredCount, totalEarned: { amount: totalEarned, currency: "XOF" } };
  }

  /// Applique un code de parrainage pour l'utilisateur courant (nouvel inscrit).
  async apply(userId: string, code: string) {
    const already = await this.prisma.referral.findUnique({ where: { referredId: userId } });
    if (already) throw new BadRequestException("Vous avez déjà utilisé un code de parrainage.");
    const referrer = await this.prisma.user.findUnique({ where: { referralCode: code } });
    if (!referrer) throw new NotFoundException("Code de parrainage invalide.");
    if (referrer.id === userId) throw new BadRequestException("Vous ne pouvez pas vous parrainer vous-même.");

    await this.prisma.$transaction([
      this.prisma.referral.create({
        data: { referrerId: referrer.id, referredId: userId, code, rewardAmount: BONUS, status: "REWARDED", rewardedAt: new Date() },
      }),
      this.prisma.wallet.upsert({
        where: { userId: referrer.id },
        update: { balance: { increment: BONUS } },
        create: { userId: referrer.id, balance: BONUS },
      }),
    ]);
    await this.notifications.create(referrer.id, "REFERRAL", "Parrainage réussi",
      `Vous avez gagné ${BONUS} FCFA grâce à un filleul.`, {});
    return { rewarded: true, bonus: { amount: BONUS, currency: "XOF" } };
  }
}
