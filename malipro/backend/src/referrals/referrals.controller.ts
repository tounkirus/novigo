import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { ReferralsService } from "./referrals.service";

@Controller("referrals")
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private referrals: ReferralsService) {}

  @Get("me")
  me(@CurrentUser() u: AuthUser) {
    return this.referrals.myReferral(u.id);
  }

  @Post("apply")
  apply(@CurrentUser() u: AuthUser, @Body() body: { code: string }) {
    return this.referrals.apply(u.id, body.code);
  }
}
