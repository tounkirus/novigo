import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReferralsService } from "./referrals.service";
import { ReferralsController } from "./referrals.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
})
export class ReferralsModule {}
