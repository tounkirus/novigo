import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { CatalogService } from "./catalog.service";

@Controller("products")
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get()
  list(@Query() q: PaginationQuery, @Query("category") category?: string) {
    return this.catalog.list(q.page, q.limit, q.search, category);
  }
}
