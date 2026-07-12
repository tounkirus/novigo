import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { NotificationsService } from "../notifications/notifications.service";

const mapTicket = (t: any) => ({
  id: t.id, userId: t.userId, subject: t.subject, category: t.category, orderId: t.orderId,
  status: t.status, priority: t.priority, createdAt: t.createdAt, updatedAt: t.updatedAt,
  messages: t.messages?.map(mapMessage),
});
const mapMessage = (m: any) => ({
  id: m.id, ticketId: m.ticketId, senderId: m.senderId, body: m.body, isStaff: m.isStaff, createdAt: m.createdAt,
});

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  async create(userId: string, dto: { subject: string; category: string; body: string; orderId?: string }) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId, subject: dto.subject, category: dto.category, orderId: dto.orderId ?? null,
        messages: { create: { senderId: userId, body: dto.body, isStaff: false } },
      },
      include: { messages: true },
    });
    return mapTicket(ticket);
  }

  async listMine(userId: string, page: number, limit: number) {
    const where = { userId };
    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return paginate(rows.map(mapTicket), total, page, limit);
  }

  async getOne(userId: string, id: string, isStaff: boolean) {
    const t = await this.prisma.supportTicket.findUnique({
      where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!t) throw new NotFoundException("Ticket introuvable.");
    if (!isStaff && t.userId !== userId) throw new ForbiddenException("Ticket d'un autre utilisateur.");
    return mapTicket(t);
  }

  async addMessage(userId: string, id: string, body: string, isStaff: boolean) {
    const t = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!t) throw new NotFoundException("Ticket introuvable.");
    if (!isStaff && t.userId !== userId) throw new ForbiddenException("Ticket d'un autre utilisateur.");
    const message = await this.prisma.supportMessage.create({
      data: { ticketId: id, senderId: userId, body, isStaff },
    });
    // Bump updatedAt ; si l'agent répond à un ticket ouvert, passe en PENDING.
    await this.prisma.supportTicket.update({
      where: { id }, data: { status: isStaff && t.status === "OPEN" ? "PENDING" : t.status },
    });
    if (isStaff) {
      await this.notifications.create(t.userId, "SUPPORT_REPLY", "Réponse du support",
        "Un agent a répondu à votre ticket.", { ticketId: id });
    }
    return mapMessage(message);
  }

  // --- Agent / admin ---
  async listAll(page: number, limit: number, status?: string) {
    const where = status ? { status } : {};
    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return paginate(rows.map(mapTicket), total, page, limit);
  }

  async updateTicket(id: string, dto: { status?: string; priority?: string }) {
    const t = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!t) throw new NotFoundException("Ticket introuvable.");
    const upd = await this.prisma.supportTicket.update({
      where: { id }, data: { status: dto.status ?? t.status, priority: dto.priority ?? t.priority },
    });
    if (dto.status && dto.status !== t.status) {
      await this.notifications.create(t.userId, "SUPPORT_STATUS", "Ticket mis à jour",
        `Votre ticket est maintenant : ${dto.status}.`, { ticketId: id });
    }
    return mapTicket(upd);
  }
}
