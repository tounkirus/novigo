import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { InvoiceService } from "./invoice.service";
import { OrdersController } from "./orders.controller";
import { PublicOrdersController } from "./public-orders.controller";
import { RealtimeModule } from "../realtime/realtime.module";
@Module({
  imports: [RealtimeModule],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService, InvoiceService],
})
export class OrdersModule {}
