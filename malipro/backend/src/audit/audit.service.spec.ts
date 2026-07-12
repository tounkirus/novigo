import { AuditService } from "./audit.service";

describe("AuditService", () => {
  it("list : pagine les entrées d'audit par date décroissante", async () => {
    const rows = [{ id: "a1", actorId: "admin", action: "LOGIN", createdAt: new Date(0) }];
    const prisma = { auditLog: { findMany: jest.fn().mockResolvedValue(rows), count: jest.fn().mockResolvedValue(1) } } as any;
    const res = await new AuditService(prisma).list(2, 10);
    expect(res.data).toEqual(rows);
    expect(res.meta.total).toBe(1);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10, orderBy: { createdAt: "desc" } }));
  });
});
