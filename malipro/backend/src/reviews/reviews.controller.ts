import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { ReviewsService } from "./reviews.service";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Post("orders/:id/rating")
  @Roles("CUSTOMER")
  rate(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.reviews.rateOrder(user.id, id, body.rating, body.comment);
  }

  @Get("reviews")
  list(
    @Query() q: PaginationQuery,
    @Query("targetType") targetType?: string,
    @Query("targetId") targetId?: string,
  ) {
    return this.reviews.list(q.page, q.limit, targetType, targetId);
  }
}
