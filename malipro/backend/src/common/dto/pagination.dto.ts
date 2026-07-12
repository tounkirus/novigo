import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PaginationQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 20;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  sort?: string;
}

export function paginate<T>(data: T[], total: number, page: number, limit: number) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}
