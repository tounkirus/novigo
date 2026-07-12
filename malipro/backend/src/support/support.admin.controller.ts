import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { SupportService } from "./support.service";

@Controller("admin/support/tickets")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class SupportAdminController {
  constructor(private support: SupportService) {}

  @Get()
  list(@Query() q: PaginationQuery) {
    return this.support.listAll(q.page, q.limit, q.status);
  }

  @Get(":id")
  get(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.support.getOne(u.id, id, true);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: { status?: string; priority?: string }) {
    return this.support.updateTicket(id, dto);
  }

  @Post(":id/messages")
  reply(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() body: { body: string }) {
    return this.support.addMessage(u.id, id, body.body, true);
  }
}
