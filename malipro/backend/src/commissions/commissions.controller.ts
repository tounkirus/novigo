import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { CommissionsService } from "./commissions.service";
import { CommissionsDto } from "./commissions.dto";

@Controller("admin/commissions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private svc: CommissionsService) {}

  @Get()
  @Roles("ADMIN", "SUPER_ADMIN")
  get() {
    return this.svc.get();
  }

  @Patch()
  @Roles("SUPER_ADMIN")
  update(@Body() dto: CommissionsDto, @CurrentUser() user: AuthUser) {
    return this.svc.update(dto, user.id);
  }
}
