import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { AuditService } from "./audit.service";

@Controller("admin/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  @Roles("ADMIN", "SUPER_ADMIN")
  list(@Query() q: PaginationQuery) {
    return this.audit.list(q.page, q.limit);
  }
}
