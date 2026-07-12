import { Controller, Get, Param } from "@nestjs/common";
import { OrdersService } from "./orders.service";

/// Suivi de commande public (sans authentification), via le code de suivi.
@Controller("public/orders")
export class PublicOrdersController {
  constructor(private orders: OrdersService) {}

  @Get("track/:code")
  track(@Param("code") code: string) {
    return this.orders.trackByCode(code);
  }
}
