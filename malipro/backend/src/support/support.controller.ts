import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { SupportService } from "./support.service";

@Controller("support/tickets")
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private support: SupportService) {}

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: { subject: string; category: string; body: string; orderId?: string }) {
    return this.support.create(u.id, dto);
  }

  @Get()
  mine(@CurrentUser() u: AuthUser, @Query() q: PaginationQuery) {
    return this.support.listMine(u.id, q.page, q.limit);
  }

  @Get(":id")
  get(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.support.getOne(u.id, id, false);
  }

  @Post(":id/messages")
  message(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() body: { body: string }) {
    return this.support.addMessage(u.id, id, body.body, false);
  }
}
