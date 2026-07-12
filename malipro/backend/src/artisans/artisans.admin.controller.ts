import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { ArtisansService } from "./artisans.service";

@Controller("admin/artisans")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class ArtisansAdminController {
  constructor(private artisans: ArtisansService) {}

  @Get()
  list(@Query() q: PaginationQuery) { return this.artisans.adminList(q.page, q.limit); }

  @Get(":id")
  get(@Param("id") id: string) { return this.artisans.adminGet(id); }

  @Patch(":id")
  setAvailability(@Param("id") id: string, @Body() body: { isAvailable: boolean }) {
    return this.artisans.adminSetAvailability(id, body.isAvailable);
  }
}
