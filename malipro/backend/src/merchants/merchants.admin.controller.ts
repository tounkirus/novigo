import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { MerchantsService } from "./merchants.service";

@Controller("admin/merchants")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class MerchantsAdminController {
  constructor(private merchants: MerchantsService) {}

  @Get()
  list(@Query() q: PaginationQuery, @Query("status") status?: string) {
    return this.merchants.adminList(q.page, q.limit, status);
  }

  @Get(":id")
  get(@Param("id") id: string) { return this.merchants.adminGet(id); }

  @Patch(":id")
  setActive(@Param("id") id: string, @Body() body: { isActive: boolean }) {
    return this.merchants.adminSetActive(id, body.isActive);
  }

  /// Validation : approve / reject / suspend / reactivate (status = PENDING|APPROVED|REJECTED|SUSPENDED).
  @Patch(":id/status")
  setStatus(@Param("id") id: string, @Body() body: { status: string; reason?: string }) {
    return this.merchants.adminSetStatus(id, body.status, body.reason);
  }

  /// Autorise (ou non) la publication automatique des produits du commerçant.
  @Patch(":id/auto-publish")
  setAutoPublish(@Param("id") id: string, @Body() body: { autoPublish: boolean }) {
    return this.merchants.adminSetAutoPublish(id, body.autoPublish);
  }

  /// Vérification d'un document légal (status = PENDING|VERIFIED|REJECTED).
  @Patch("documents/:docId")
  verifyDocument(@Param("docId") docId: string, @Body() body: { status: string }) {
    return this.merchants.adminVerifyDocument(docId, body.status);
  }
}
