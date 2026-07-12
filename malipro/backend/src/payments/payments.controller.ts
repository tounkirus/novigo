import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaymentsService } from "./payments.service";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post("payments/wallet")
  payWallet(@CurrentUser() user: AuthUser, @Body() body: { orderId: string }) {
    return this.payments.payWithWallet(user.id, body.orderId);
  }

  @Post("payments/mobile-money")
  initiateMobileMoney(
    @CurrentUser() user: AuthUser,
    @Body() body: { orderId: string; method: string; phone: string },
  ) {
    return this.payments.initiateMobileMoney(user.id, body.orderId, body.method, body.phone);
  }

  @Post("admin/payments/:id/refund")
  @Roles("ADMIN", "SUPER_ADMIN")
  refund(@Param("id") id: string) {
    return this.payments.refund(id);
  }

  @Get("admin/payments")
  @Roles("ADMIN", "SUPER_ADMIN")
  listAdmin(@Query() q: PaginationQuery) {
    return this.payments.listAdmin(q.page, q.limit, q.status);
  }

  @Get("payments/reconciliation")
  @Roles("ADMIN", "SUPER_ADMIN")
  reconciliation(
    @Query("provider") provider?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.payments.reconciliation(provider ?? "ORANGE_MONEY", dateFrom, dateTo);
  }
}
