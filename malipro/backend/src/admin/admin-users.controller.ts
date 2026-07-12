import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { AdminUsersService } from "./admin-users.service";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private svc: AdminUsersService) {}

  @Get()
  @Roles("ADMIN", "SUPER_ADMIN")
  list(@Query() q: PaginationQuery, @Query("role") role?: string) {
    return this.svc.list(q.page, q.limit, q.search, role, q.status);
  }
}
