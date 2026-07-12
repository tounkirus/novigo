import { Body, Controller, Get, Param, Post, Query, UseGuards, Res } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { CreateOrderDto } from "./create-order.dto";
import { OrdersService } from "./orders.service";
import { InvoiceService } from "./invoice.service";
import type { Response } from "express";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private orders: OrdersService, private invoice: InvoiceService) {}

  @Post("orders")
  @Roles("CUSTOMER")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.createForCustomer(user.id, dto);
  }

  @Get("orders")
  mine(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.orders.listMine(user.id, q.page, q.limit, q.status);
  }

  @Get("admin/orders")
  @Roles("ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT")
  listAdmin(@Query() q: PaginationQuery) {
    return this.orders.listAdmin(q.page, q.limit, q.status);
  }

  @Get("orders/:id")
  get(@Param("id") id: string) {
    return this.orders.get(id);
  }

  @Get("orders/:id/invoice")
  async getInvoice(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const data = await this.invoice.buildInvoiceData(id, user.id);
    const pdf = await this.invoice.generatePdf(data);
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${data.number}.pdf"` });
    res.send(pdf);
  }

  @Get("orders/:id/tracking")
  tracking(@Param("id") id: string) {
    return this.orders.tracking(id);
  }

  @Post("orders/:id/cancel")
  cancel(@Param("id") id: string, @Body() _body: { reason?: string }) {
    return this.orders.cancel(id);
  }
}
