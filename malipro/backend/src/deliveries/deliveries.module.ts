import { Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DeliveriesService } from "./deliveries.service";
import { DeliveriesController } from "./deliveries.controller";
@Module({ imports: [RealtimeModule, NotificationsModule], controllers: [DeliveriesController], providers: [DeliveriesService] })
export class DeliveriesModule {}
