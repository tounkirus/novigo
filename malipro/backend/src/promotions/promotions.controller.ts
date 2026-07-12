import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PromotionsService } from "./promotions.service";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionsController {
  constructor(private promotions: PromotionsService) {}

  @Post("promotions/coupons/validate")
  validate(@Body() body: { code: string; amount: number }) {
    return this.promotions.validate(body.code, body.amount);
  }

  @Post("admin/coupons")
  @Roles("ADMIN", "SUPER_ADMIN")
  create(@Body() dto: any) {
    return this.promotions.createCoupon(dto);
  }

  @Get("admin/coupons")
  @Roles("ADMIN", "SUPER_ADMIN")
  list() {
    return this.promotions.listCoupons();
  }
}
