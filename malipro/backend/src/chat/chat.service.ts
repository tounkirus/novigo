import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { RealtimeGateway } from "../realtime/realtime.gateway";

const mapConv = (c: any) => ({
  id: c.id, participantIds: c.participantIds, orderId: c.orderId,
  lastMessagePreview: c.lastMessagePreview, updatedAt: c.updatedAt,
});
const mapMsg = (m: any) => ({
  id: m.id, conversationId: m.conversationId, senderId: m.senderId,
  body: m.body, attachmentUrl: m.attachmentUrl, createdAt: m.createdAt,
});

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async listConversations(userId: string, page: number, limit: number) {
    const where = { participantIds: { has: userId } };
    const [rows, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return paginate(rows.map(mapConv), total, page, limit);
  }

  async createConversation(userId: string, participantId: string, orderId?: string) {
    const c = await this.prisma.conversation.create({
      data: { participantIds: [userId, participantId], orderId: orderId ?? null },
    });
    return mapConv(c);
  }

  private async ensureMember(userId: string, conversationId: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException("Conversation introuvable.");
    if (!c.participantIds.includes(userId)) throw new ForbiddenException("Non participant.");
    return c;
  }

  async listMessages(userId: string, conversationId: string, page: number, limit: number) {
    await this.ensureMember(userId, conversationId);
    const where = { conversationId };
    const [rows, total] = await Promise.all([
      this.prisma.message.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.message.count({ where }),
    ]);
    return paginate(rows.map(mapMsg), total, page, limit);
  }

  async sendMessage(userId: string, conversationId: string, body: string) {
    await this.ensureMember(userId, conversationId);
    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessagePreview: body.slice(0, 120) },
    });
    const dto = mapMsg(message);
    this.realtime.emitMessage(conversationId, dto);
    return dto;
  }
}
