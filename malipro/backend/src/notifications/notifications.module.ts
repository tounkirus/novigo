import { Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsAdminController } from "./notifications.admin.controller";

@Module({
  imports: [RealtimeModule],
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
