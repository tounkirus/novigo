import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { MerchantsService } from "./merchants.service";

/// Espace commerçant. Accès régi par les permissions RBAC (propriétaire ou staff :
/// Manager / Caissier / Préparateur), avec scoping multi-tenant côté service.
@Controller("merchants")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MerchantsController {
  constructor(private merchants: MerchantsService) {}

  @Get("me")
  @RequirePermissions("store:read")
  me(@CurrentUser() u: AuthUser) { return this.merchants.me(u.id); }

  @Post("me")
  @HttpCode(200)
  @RequirePermissions("store:write")
  onboard(@CurrentUser() u: AuthUser, @Body() dto: any) { return this.merchants.upsertProfile(u.id, dto); }

  @Get("me/staff")
  @RequirePermissions("staff:manage")
  listStaff(@CurrentUser() u: AuthUser) { return this.merchants.listStaff(u.id); }

  @Post("me/staff")
  @RequirePermissions("staff:manage")
  addStaff(@CurrentUser() u: AuthUser, @Body() dto: { phone: string; role: string }) {
    return this.merchants.addStaff(u.id, dto.phone, dto.role);
  }

  @Delete("me/staff/:userId")
  @HttpCode(204)
  @RequirePermissions("staff:manage")
  removeStaff(@CurrentUser() u: AuthUser, @Param("userId") staffUserId: string) {
    return this.merchants.removeStaff(u.id, staffUserId);
  }

  @Get("me/orders")
  @RequirePermissions("order:read")
  myOrders(@CurrentUser() u: AuthUser, @Query() q: PaginationQuery, @Query("status") status?: string) {
    return this.merchants.myOrders(u.id, q.page, q.limit, status);
  }

  // ── Wallet commerçant ──────────────────────────────────────────
  @Get("me/wallet")
  @RequirePermissions("wallet:read")
  wallet(@CurrentUser() u: AuthUser) { return this.merchants.walletView(u.id); }

  @Post("me/wallet/payout")
  @HttpCode(200)
  @RequirePermissions("wallet:payout")
  payout(@CurrentUser() u: AuthUser, @Body() body: { amount: number; method?: string }) {
    return this.merchants.payout(u.id, body.amount, body.method ?? "ORANGE_MONEY");
  }

  @Post("orders/:id/accept")
  @HttpCode(200)
  @RequirePermissions("order:manage")
  acceptOrder(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.orderAction(u.id, id, "accept");
  }

  @Post("orders/:id/refuse")
  @HttpCode(200)
  @RequirePermissions("order:manage")
  refuseOrder(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() body: { reason?: string }) {
    return this.merchants.orderAction(u.id, id, "refuse", body?.reason);
  }

  @Post("orders/:id/preparing")
  @HttpCode(200)
  @RequirePermissions("order:manage")
  prepareOrder(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.orderAction(u.id, id, "preparing");
  }

  @Post("orders/:id/ready")
  @HttpCode(200)
  @RequirePermissions("order:manage")
  readyOrder(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.orderAction(u.id, id, "ready");
  }

  @Get("me/stores")
  @RequirePermissions("store:read")
  listStores(@CurrentUser() u: AuthUser) { return this.merchants.listStores(u.id); }

  @Post("me/stores")
  @RequirePermissions("store:write")
  createStore(@CurrentUser() u: AuthUser, @Body() dto: any) { return this.merchants.createStore(u.id, dto); }

  @Patch("stores/:id")
  @RequirePermissions("store:write")
  updateStore(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: any) {
    return this.merchants.updateStore(u.id, id, dto);
  }

  // ── Rubriques de menu ──────────────────────────────────────────
  @Get("stores/:id/categories")
  @RequirePermissions("product:read")
  listCategories(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.listCategories(u.id, id);
  }

  @Post("stores/:id/categories")
  @RequirePermissions("product:write")
  createCategory(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: any) {
    return this.merchants.createCategory(u.id, id, dto);
  }

  @Patch("categories/:id")
  @RequirePermissions("product:write")
  updateCategory(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: any) {
    return this.merchants.updateCategory(u.id, id, dto);
  }

  @Delete("categories/:id")
  @HttpCode(204)
  @RequirePermissions("product:delete")
  deleteCategory(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.deleteCategory(u.id, id);
  }

  @Get("stores/:id/products")
  @RequirePermissions("product:read")
  listProducts(@CurrentUser() u: AuthUser, @Param("id") id: string, @Query() q: PaginationQuery) {
    return this.merchants.listProducts(u.id, id, q.page, q.limit);
  }

  @Post("products/:id/duplicate")
  @RequirePermissions("product:write")
  duplicateProduct(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.duplicateProduct(u.id, id);
  }

  // ── Options & suppléments ──────────────────────────────────────
  @Post("products/:id/option-groups")
  @RequirePermissions("product:write")
  createOptionGroup(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: any) {
    return this.merchants.createOptionGroup(u.id, id, dto);
  }

  @Delete("option-groups/:id")
  @HttpCode(204)
  @RequirePermissions("product:write")
  deleteOptionGroup(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.deleteOptionGroup(u.id, id);
  }

  @Post("stores/:id/products")
  @RequirePermissions("product:write")
  createProduct(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: any) {
    return this.merchants.createProduct(u.id, id, dto);
  }

  @Patch("products/:id")
  @RequirePermissions("product:write")
  updateProduct(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: any) {
    return this.merchants.updateProduct(u.id, id, dto);
  }

  @Delete("products/:id")
  @HttpCode(204)
  @RequirePermissions("product:delete")
  deleteProduct(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.deleteProduct(u.id, id);
  }

  @Patch("products/:id/inventory")
  @RequirePermissions("product:write")
  inventory(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() body: { stockQuantity: number }) {
    return this.merchants.setInventory(u.id, id, body.stockQuantity);
  }

  @Get("stores/:id/reports")
  @RequirePermissions("report:read")
  reports(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.merchants.reports(u.id, id);
  }
}
