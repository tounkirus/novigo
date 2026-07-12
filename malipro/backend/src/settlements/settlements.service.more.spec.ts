import { NotFoundException } from "@nestjs/common";
import { SettlementsService } from "./settlements.service";

describe("SettlementsService (couverture complète)", () => {
  it("reconcile : classe MATCHED / MISMATCH / MISSING / ORPHAN et crée le settlement", async () => {
    const payments = [
      { id: "p1", providerRef: "R1", amount: 5000 }, // MATCHED
      { id: "p2", providerRef: "R2", amount: 3000 }, // MISMATCH (relevé 2500)
      { id: "p3", providerRef: "R3", amount: 1000 }, // MISSING (absent relevé)
      { id: "p4", providerRef: null, amount: 700 },  // MISSING (pas de ref)
    ];
    const statement = [
      { providerRef: "R1", amount: 5000 },
      { providerRef: "R2", amount: 2500 },
      { providerRef: "R9", amount: 900 }, // ORPHAN
    ];
    const prisma = {
      payment: { findMany: jest.fn().mockResolvedValue(payments) },
      settlement: {
        create: jest.fn().mockImplementation((a: any) => Promise.resolve({
          id: "s1", ...a.data, items: a.data.items.create.map((i: any, n: number) => ({ id: `i${n}`, ...i })),
        })),
      },
    } as any;
    const res = await new SettlementsService(prisma).reconcile("ORANGE_MONEY", "2026-01-01", "2026-02-01", statement);
    const statuses = res.items!.map((i: any) => i.status).sort();
    expect(statuses).toEqual(["MATCHED", "MISMATCH", "MISSING", "MISSING", "ORPHAN"].sort());
    expect(res.status).toBe("DISCREPANCY");
    expect(res.discrepancyCount).toBe(4);
    expect(res.totalExpected.amount).toBe(9700);
    expect(res.totalReceived.amount).toBe(8400);
  });

  it("reconcile : tout rapproché -> RECONCILED", async () => {
    const prisma = {
      payment: { findMany: jest.fn().mockResolvedValue([{ id: "p1", providerRef: "R1", amount: 100 }]) },
      settlement: { create: jest.fn().mockImplementation((a: any) => Promise.resolve({ id: "s1", ...a.data, items: [] })) },
    } as any;
    const res = await new SettlementsService(prisma).reconcile("WAVE", "2026-01-01", "2026-02-01", [{ providerRef: "R1", amount: 100 }]);
    expect(res.status).toBe("RECONCILED");
    expect(res.discrepancyCount).toBe(0);
  });

  it("list : pagine", async () => {
    const prisma = { settlement: { findMany: jest.fn().mockResolvedValue([{ id: "s1", items: [] }]), count: jest.fn().mockResolvedValue(1) } } as any;
    expect((await new SettlementsService(prisma).list(1, 10)).data).toHaveLength(1);
  });

  it("get : introuvable -> NotFound ; trouvé -> mappe", async () => {
    const prisma = { settlement: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new SettlementsService(prisma).get("s1")).rejects.toThrow(NotFoundException);
    prisma.settlement.findUnique.mockResolvedValue({ id: "s1", provider: "WAVE", totalExpected: 1, totalReceived: 1, discrepancyCount: 0, items: [{ id: "i1", providerRef: "R1", expectedAmount: 1, receivedAmount: 1, status: "MATCHED" }] });
    const res = await new SettlementsService(prisma).get("s1");
    expect(res.items![0].status).toBe("MATCHED");
  });
});
