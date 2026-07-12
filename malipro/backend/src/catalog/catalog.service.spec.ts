import { CatalogService } from "./catalog.service";

describe("CatalogService", () => {
  const rows = [{ id: "p1", name: "Riz", description: "5kg", price: 3500, imageUrl: null, inStock: true, stockQuantity: 20 }];

  it("list : sans recherche, pagine et mappe le prix", async () => {
    const prisma = { product: { findMany: jest.fn().mockResolvedValue(rows), count: jest.fn().mockResolvedValue(1) } } as any;
    const res = await new CatalogService(prisma).list(1, 10);
    expect(res.data[0]).toMatchObject({ id: "p1", price: { amount: 3500, currency: "XOF" } });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("list : avec recherche insensible à la casse", async () => {
    const prisma = { product: { findMany: jest.fn().mockResolvedValue(rows), count: jest.fn().mockResolvedValue(1) } } as any;
    await new CatalogService(prisma).list(2, 5, "riz");
    const call = prisma.product.findMany.mock.calls[0][0];
    expect(call.where.name.contains).toBe("riz");
    expect(call.skip).toBe(5);
  });
});
