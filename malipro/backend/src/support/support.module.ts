import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { SupportService } from "./support.service";
import { SupportController } from "./support.controller";
import { SupportAdminController } from "./support.admin.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [SupportController, SupportAdminController],
  providers: [SupportService],
})
export class SupportModule {}
