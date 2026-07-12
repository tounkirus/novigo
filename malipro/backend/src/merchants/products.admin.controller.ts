import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { MerchantsService } from "./merchants.service";

/// Modération des produits par l'administration (file d'attente + décision).
@Controller("admin/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class ProductsAdminController {
  constructor(private merchants: MerchantsService) {}

  @Get("pending")
  pending(@Query() q: PaginationQuery) {
    return this.merchants.adminListPendingProducts(q.page, q.limit);
  }

  @Patch(":id/moderate")
  moderate(@Param("id") id: string, @Body() body: { status: string }) {
    return this.merchants.adminModerateProduct(id, body.status);
  }
}
