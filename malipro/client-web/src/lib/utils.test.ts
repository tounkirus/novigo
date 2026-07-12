import { describe, it, expect } from "vitest";
import {
  formatFcfa, formatCompact, discountPercent, slugify, clamp, sumBy, groupBy, formatDistance, formatRating,
} from "./utils";

describe("utils", () => {
  it("formatFcfa formate en entiers avec suffixe", () => {
    expect(formatFcfa(2500)).toContain("FCFA");
    expect(formatFcfa(2500.7)).toContain("2");
  });

  it("formatCompact abrège les milliers/millions", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(1500)).toBe("1.5 k");
    expect(formatCompact(2_000_000)).toBe("2 M");
  });

  it("discountPercent calcule la remise", () => {
    expect(discountPercent(1000, 800)).toBe(20);
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(0, 800)).toBe(0);
  });

  it("slugify normalise accents et espaces", () => {
    expect(slugify("Chez Fatou à Bamako")).toBe("chez-fatou-a-bamako");
    expect(slugify("Pâtisserie Dorée")).toBe("patisserie-doree");
  });

  it("clamp borne les valeurs", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("sumBy et groupBy", () => {
    const items = [{ v: 1, k: "a" }, { v: 2, k: "a" }, { v: 3, k: "b" }];
    expect(sumBy(items, (i) => i.v)).toBe(6);
    expect(groupBy(items, (i) => i.k).a).toHaveLength(2);
  });

  it("formatDistance et formatRating", () => {
    expect(formatDistance(0.4)).toContain("m");
    expect(formatDistance(2.5)).toContain("km");
    expect(formatRating(4.5)).toBe("4,5");
  });
});
