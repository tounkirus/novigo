import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { SettlementsService } from "./settlements.service";

@Controller("admin/settlements")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class SettlementsController {
  constructor(private settlements: SettlementsService) {}

  @Post("reconcile")
  reconcile(@Body() body: {
    provider: string; periodStart: string; periodEnd: string;
    statement: Array<{ providerRef: string; amount: number }>;
  }) {
    return this.settlements.reconcile(body.provider, body.periodStart, body.periodEnd, body.statement ?? []);
  }

  @Get()
  list(@Query() q: PaginationQuery) {
    return this.settlements.list(q.page, q.limit);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.settlements.get(id);
  }
}
