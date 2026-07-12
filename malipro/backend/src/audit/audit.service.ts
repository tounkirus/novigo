import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async list(page: number, limit: number) {
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);
    return paginate(rows, total, page, limit);
  }
}
