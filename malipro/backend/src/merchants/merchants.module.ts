import { Module } from "@nestjs/common";
import { MerchantsService } from "./merchants.service";
import { MerchantsController } from "./merchants.controller";
import { MerchantsAdminController } from "./merchants.admin.controller";
import { ProductsAdminController } from "./products.admin.controller";
import { RealtimeModule } from "../realtime/realtime.module";
@Module({
  imports: [RealtimeModule],
  controllers: [MerchantsController, MerchantsAdminController, ProductsAdminController],
  providers: [MerchantsService],
})
export class MerchantsModule {}
