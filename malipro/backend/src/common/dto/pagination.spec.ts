import { paginate } from "./pagination.dto";

describe("paginate", () => {
  it("calcule correctement les métadonnées", () => {
    const r = paginate([1, 2, 3], 25, 2, 10);
    expect(r.data).toHaveLength(3);
    expect(r.meta).toEqual({
      page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true,
    });
  });

  it("gère une page unique", () => {
    const r = paginate([], 0, 1, 20);
    expect(r.meta.totalPages).toBe(1);
    expect(r.meta.hasNext).toBe(false);
    expect(r.meta.hasPrev).toBe(false);
  });
});
