import { SettlementsService } from "./settlements.service";

describe("SettlementsService.reconcile", () => {
  it("classe MATCHED / MISMATCH / MISSING / ORPHAN", async () => {
    const prisma = {
      payment: {
        findMany: jest.fn().mockResolvedValue([
          { id: "p1", providerRef: "OM-1", amount: 5000 },
          { id: "p2", providerRef: "OM-2", amount: 3000 },
          { id: "p3", providerRef: "OM-3", amount: 2000 },
        ]),
      },
      settlement: {
        create: jest.fn().mockImplementation(({ data }: any) => ({
          id: "s1", ...data,
          items: data.items.create.map((i: any, idx: number) => ({ id: `i${idx}`, ...i })),
        })),
      },
    } as any;

    const statement = [
      { providerRef: "OM-1", amount: 5000 }, // MATCHED
      { providerRef: "OM-2", amount: 2500 }, // MISMATCH
      { providerRef: "OM-9", amount: 1000 }, // ORPHAN
    ];
    const res = await new SettlementsService(prisma).reconcile("ORANGE_MONEY", "2026-01-01", "2026-01-31", statement);

    const byStatus = (s: string) => res.items!.filter((i: any) => i.status === s).map((i: any) => i.providerRef);
    expect(byStatus("MATCHED")).toEqual(["OM-1"]);
    expect(byStatus("MISMATCH")).toEqual(["OM-2"]);
    expect(byStatus("MISSING")).toEqual(["OM-3"]);
    expect(byStatus("ORPHAN")).toEqual(["OM-9"]);
    expect(res.discrepancyCount).toBe(3);
    expect(res.status).toBe("DISCREPANCY");
    expect(res.totalExpected.amount).toBe(10000);
    expect(res.totalReceived.amount).toBe(8500);
  });

  it("RECONCILED si tout correspond", async () => {
    const prisma = {
      payment: { findMany: jest.fn().mockResolvedValue([{ id: "p1", providerRef: "W-1", amount: 4000 }]) },
      settlement: { create: jest.fn().mockImplementation(({ data }: any) => ({ id: "s2", ...data, items: data.items.create })) },
    } as any;
    const res = await new SettlementsService(prisma).reconcile("WAVE", "2026-01-01", "2026-01-31", [{ providerRef: "W-1", amount: 4000 }]);
    expect(res.status).toBe("RECONCILED");
    expect(res.discrepancyCount).toBe(0);
  });
});
