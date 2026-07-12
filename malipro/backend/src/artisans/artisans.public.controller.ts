import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { ArtisansService } from "./artisans.service";

/// Espace client : parcourir les artisans et leurs services, envoyer une demande.
/// Doit être enregistré APRÈS ArtisansController pour que /artisans/me prime sur /artisans/:id.
@Controller("artisans")
@UseGuards(JwtAuthGuard)
export class ArtisansPublicController {
  constructor(private artisans: ArtisansService) {}

  @Get()
  list(
    @Query() q: PaginationQuery,
    @Query("profession") profession?: string,
    @Query("serviceArea") serviceArea?: string,
  ) {
    return this.artisans.listPublic(q.page, q.limit, {
      profession,
      serviceArea,
      search: q.search,
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.artisans.getPublic(id);
  }

  @Post(":id/quotations")
  @HttpCode(201)
  request(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.artisans.requestQuotation(user.id, id, dto);
  }
}
