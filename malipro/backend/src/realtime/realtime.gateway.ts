import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage,
  WebSocketGateway, WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

/// Namespace /realtime. Auth JWT via handshake `auth.token`.
@WebSocketGateway({ namespace: "/realtime", cors: { origin: "*" } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger("Realtime");
  @WebSocketServer() server!: Server;

  constructor(private jwt: JwtService, private config: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const payload = await this.jwt.verifyAsync(token ?? "", {
        secret: this.config.get<string>("JWT_ACCESS_SECRET") ?? "change-me-access",
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage("order:subscribe")
  onOrderSubscribe(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    client.join(`order:${orderId}`);
    return { subscribed: orderId };
  }

  @SubscribeMessage("conversation:join")
  onConversationJoin(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.join(`conversation:${conversationId}`);
    return { joined: conversationId };
  }

  @SubscribeMessage("chat:typing")
  onTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string; isTyping: boolean },
  ) {
    this.server.to(`conversation:${body.conversationId}`).emit("chat.typing", {
      conversationId: body.conversationId, userId: client.data.userId, isTyping: body.isTyping,
    });
  }

  // --- Emetteurs appelés par les services ---
  emitTracking(orderId: string, payload: unknown) {
    this.server?.to(`order:${orderId}`).emit("order.tracking", payload);
  }
  /// Émet un événement arbitraire vers la room d'une commande (ex. order.updated depuis le bus finance).
  emitToOrder(orderId: string, event: string, payload: unknown) {
    this.server?.to(`order:${orderId}`).emit(event, payload);
  }
  emitMessage(conversationId: string, message: unknown) {
    this.server?.to(`conversation:${conversationId}`).emit("chat.message", message);
  }
  notifyUser(userId: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit("notification.push", payload);
  }
  /// Émet un événement vers plusieurs utilisateurs (ex. commerçant + son staff).
  emitToUsers(userIds: string[], event: string, payload: unknown) {
    for (const id of userIds) this.server?.to(`user:${id}`).emit(event, payload);
  }
}
