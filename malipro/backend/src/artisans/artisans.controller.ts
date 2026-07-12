import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { ArtisansService } from "./artisans.service";

@Controller("artisans/me")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ARTISAN")
export class ArtisansController {
  constructor(private artisans: ArtisansService) {}

  @Get() me(@CurrentUser() u: AuthUser) { return this.artisans.me(u.id); }
  @Post() @HttpCode(200) onboard(@CurrentUser() u: AuthUser, @Body() dto: any) { return this.artisans.upsertProfile(u.id, dto); }
  @Patch() update(@CurrentUser() u: AuthUser, @Body() dto: any) { return this.artisans.update(u.id, dto); }

  @Get("services") listServices(@CurrentUser() u: AuthUser) { return this.artisans.listServices(u.id); }
  @Post("services") createService(@CurrentUser() u: AuthUser, @Body() dto: any) { return this.artisans.createService(u.id, dto); }
  @Patch("services/:id") updateService(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: any) {
    return this.artisans.updateService(u.id, id, dto);
  }
  @Delete("services/:id") @HttpCode(204) deleteService(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.artisans.deleteService(u.id, id);
  }

  @Get("quotations") listQuotations(@CurrentUser() u: AuthUser, @Query() q: PaginationQuery) {
    return this.artisans.listQuotations(u.id, q.page, q.limit);
  }
  @Post("quotations") createQuotation(@CurrentUser() u: AuthUser, @Body() dto: any) {
    return this.artisans.createQuotation(u.id, dto);
  }
  @Patch("quotations/:id") updateQuotation(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() body: { status: string; amount?: number }) {
    return this.artisans.updateQuotation(u.id, id, body.status, body.amount);
  }

  @Get("schedules") getSchedule(@CurrentUser() u: AuthUser) { return this.artisans.getSchedule(u.id); }
  @Put("schedules") setSchedule(@CurrentUser() u: AuthUser, @Body() body: { slots: unknown }) {
    return this.artisans.setSchedule(u.id, body.slots);
  }

  @Get("earnings") earnings(@CurrentUser() u: AuthUser) { return this.artisans.earnings(u.id); }
}
