import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { CustomersService } from "./customers.service";

@Controller("customers/me")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("CUSTOMER")
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get("dashboard")
  dashboard(@CurrentUser() user: AuthUser) {
    return this.customers.dashboard(user.id);
  }

  @Get("orders")
  orders(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.customers.orders(user.id, q.page, q.limit, q.status);
  }

  @Get("quotations")
  quotations(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.customers.quotations(user.id, q.page, q.limit);
  }

  @Patch("quotations/:id")
  respondQuotation(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { status: string },
  ) {
    return this.customers.respondQuotation(user.id, id, body.status);
  }

  @Get("wallet")
  wallet(@CurrentUser() user: AuthUser) {
    return this.customers.walletView(user.id);
  }

  @Get("loyalty")
  loyalty(@CurrentUser() user: AuthUser) {
    return this.customers.loyalty(user.id);
  }
}
