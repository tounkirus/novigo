import { AdminUsersService } from "./admin-users.service";

describe("AdminUsersService", () => {
  const rows = [{ id: "u1", phone: "+22370", email: "a@b.c", firstName: "Awa", lastName: "Koné", roles: ["CUSTOMER"], status: "ACTIVE", createdAt: new Date(0) }];

  it("list : sans filtre, mappe et pagine", async () => {
    const prisma = { user: { findMany: jest.fn().mockResolvedValue(rows), count: jest.fn().mockResolvedValue(1) } } as any;
    const res = await new AdminUsersService(prisma).list(1, 20);
    expect(res.data[0]).toMatchObject({ id: "u1", roles: ["CUSTOMER"] });
    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({});
  });

  it("list : filtre par rôle, statut et recherche", async () => {
    const prisma = { user: { findMany: jest.fn().mockResolvedValue(rows), count: jest.fn().mockResolvedValue(1) } } as any;
    await new AdminUsersService(prisma).list(1, 20, "Awa", "DRIVER", "ACTIVE");
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.roles).toEqual({ has: "DRIVER" });
    expect(where.status).toBe("ACTIVE");
    expect(where.OR).toHaveLength(3);
  });
});
