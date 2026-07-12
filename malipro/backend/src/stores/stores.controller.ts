import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { StoresService } from "./stores.service";

@Controller("stores")
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private stores: StoresService) {}

  @Get()
  list(@Query() q: PaginationQuery, @Query("category") category?: string) {
    return this.stores.list(q.page, q.limit, q.search, category);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.stores.detail(id);
  }
}
