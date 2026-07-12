import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get("conversations")
  list(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.chat.listConversations(user.id, q.page, q.limit);
  }

  @Post("conversations")
  create(@CurrentUser() user: AuthUser, @Body() body: { participantId: string; orderId?: string }) {
    return this.chat.createConversation(user.id, body.participantId, body.orderId);
  }

  @Get("conversations/:id/messages")
  messages(@CurrentUser() user: AuthUser, @Param("id") id: string, @Query() q: PaginationQuery) {
    return this.chat.listMessages(user.id, id, q.page, q.limit);
  }

  @Post("conversations/:id/messages")
  send(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: { body: string }) {
    return this.chat.sendMessage(user.id, id, body.body);
  }
}
