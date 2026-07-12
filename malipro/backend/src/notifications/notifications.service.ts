import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { PushService } from "../common/push/push.service";

const mapN = (n: any) => ({
  id: n.id, type: n.type, title: n.title, body: n.body, data: n.data,
  read: n.readAt != null, createdAt: n.createdAt,
});

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private push: PushService,
  ) {}

  /// Persiste ET pousse en temps réel (WS). Passerelles push/SMS réelles = TODO (FCM/APNs).
  async create(userId: string, type: string, title: string, body: string, data?: unknown) {
    const prefs = await this.prefs(userId);
    // Notification marketing (broadcast) : respect de l'opt-out.
    if (type === "BROADCAST" && !prefs.marketing) return { skipped: true } as any;

    const n = await this.prisma.notification.create({
      data: { userId, type, title, body, data: (data ?? null) as any },
    });
    const dto = mapN(n);
    if (prefs.inApp) this.realtime.notifyUser(userId, dto);
    if (prefs.push) {
      const devices = await this.prisma.deviceToken.findMany({ where: { userId } });
      if (devices.length) await this.push.sendToTokens(devices.map((d) => d.token), title, body);
    }
    return dto;
  }

  private static readonly DEFAULTS = { push: true, email: true, sms: true, inApp: true, marketing: true };

  private async prefs(userId: string) {
    const p = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    return { ...NotificationsService.DEFAULTS, ...(p ?? {}) };
  }

  async getPreferences(userId: string) {
    return this.prefs(userId);
  }

  async updatePreferences(userId: string, dto: Record<string, boolean | undefined>) {
    const data = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    const p = await this.prisma.notificationPreference.upsert({
      where: { userId }, update: data, create: { userId, ...data },
    });
    return { push: p.push, email: p.email, sms: p.sms, inApp: p.inApp, marketing: p.marketing };
  }

  async list(userId: string, page: number, limit: number) {
    const where = { userId };
    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(rows.map(mapN), total, page, limit);
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException("Notification introuvable.");
    if (n.userId !== userId) throw new ForbiddenException("Notification d'un autre utilisateur.");
    await this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    return { id, read: true };
  }

  /// Diffusion à tous les utilisateurs (ou à un rôle). Le batching/queue à grande
  /// échelle relève du jalon P10 ; ici on itère (persiste + push par utilisateur).
  async broadcast(title: string, body: string, targetRole?: string) {
    const where = targetRole ? { roles: { has: targetRole as any } } : {};
    const users = await this.prisma.user.findMany({ where, select: { id: true } });
    for (const u of users) {
      await this.create(u.id, "BROADCAST", title, body);
    }
    return { sent: users.length };
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null }, data: { readAt: new Date() },
    });
    return { updated: res.count };
  }
}
