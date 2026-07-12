import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async list(page: number, limit: number, search?: string, role?: string, status?: string) {
    const where: any = {};
    if (role) where.roles = { has: role };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    const data = rows.map((u) => ({
      id: u.id, phone: u.phone, email: u.email, firstName: u.firstName, lastName: u.lastName,
      roles: u.roles, status: u.status, createdAt: u.createdAt,
    }));
    return paginate(data, total, page, limit);
  }
}
