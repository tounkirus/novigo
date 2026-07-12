import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { DriversService } from "./drivers.service";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private drivers: DriversService) {}

  @Get("drivers/me")
  @Roles("DRIVER")
  me(@CurrentUser() user: AuthUser) {
    return this.drivers.me(user.id);
  }

  @Post("drivers/me")
  @Roles("DRIVER")
  @HttpCode(200)
  onboard(@CurrentUser() user: AuthUser, @Body() dto: any) {
    return this.drivers.upsertProfile(user.id, dto);
  }

  @Patch("drivers/me/availability")
  @Roles("DRIVER")
  availability(
    @CurrentUser() user: AuthUser,
    @Body() body: { isAvailable: boolean; location?: { lat: number; lng: number } },
  ) {
    return this.drivers.setAvailability(user.id, body.isAvailable, body.location?.lat, body.location?.lng);
  }

  @Get("drivers/me/deliveries")
  @Roles("DRIVER")
  myDeliveries(@CurrentUser() user: AuthUser) {
    return this.drivers.myDeliveries(user.id);
  }

  @Get("admin/drivers")
  @Roles("ADMIN", "SUPER_ADMIN")
  list(@Query() q: PaginationQuery, @Query("kycStatus") kycStatus?: string) {
    return this.drivers.listAdmin(q.page, q.limit, kycStatus, q.search);
  }

  @Get("admin/drivers/:id")
  @Roles("ADMIN", "SUPER_ADMIN")
  get(@Param("id") id: string) {
    return this.drivers.get(id);
  }

  @Post("drivers/:id/validate")
  @Roles("ADMIN", "SUPER_ADMIN")
  validate(
    @Param("id") id: string,
    @Body() body: { decision: "APPROVED" | "REJECTED"; reason?: string },
    @CurrentUser() user: AuthUser
  ) {
    return this.drivers.validate(id, body.decision, user.id, body.reason);
  }
}
