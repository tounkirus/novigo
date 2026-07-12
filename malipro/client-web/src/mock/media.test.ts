import { describe, it, expect } from "vitest";
import { productKeywords, productImage, storeImage, themedImage } from "./media";
import { productsOf, stores } from "./index";

describe("médiathèque — mots-clés cohérents", () => {
  it("mappe les plats maliens vers des mots-clés alimentaires", () => {
    expect(productKeywords("RESTAURANT", "Tiéboudienne")).toContain("rice");
    expect(productKeywords("RESTAURANT", "Poulet Yassa")).toContain("chicken");
    expect(productKeywords("RESTAURANT", "Pizza Margherita")).toContain("pizza");
    expect(productKeywords("BAKERY", "Croissant au beurre")).toContain("croissant");
    expect(productKeywords("PHARMACY", "Paracétamol 500mg")).toContain("medicine");
    expect(productKeywords("SHOP", "Écouteurs sans fil")).toContain("headphones");
  });

  it("retombe sur la catégorie par défaut si inconnu", () => {
    expect(productKeywords("MARKET", "Truc inconnu xyz")).toContain("market");
  });

  const HD_HOST = /^https:\/\/(images\.unsplash\.com|loremflickr\.com)\//;

  it("génère des URLs déterministes et valides", () => {
    const a = productImage("RESTAURANT", "Pizza", "seed-1", 600, 400);
    const b = productImage("RESTAURANT", "Pizza", "seed-1", 600, 400);
    expect(a).toBe(b); // déterminisme
    // Concept curé (pizza) → photo HD Unsplash ; couverture commerce → storefront HD.
    expect(a).toContain("images.unsplash.com");
    expect(storeImage("BAKERY", "s1", 800, 400)).toMatch(HD_HOST);
    // Mot-clé non curé → repli loremflickr (photo réelle par mot-clé).
    expect(themedImage("gift", "r1", 400, 300)).toContain("gift");
  });

  it("les produits générés ont des images HD de la médiathèque", () => {
    const p = productsOf(stores()[0])[0];
    expect(p.image).toMatch(HD_HOST);
    expect(stores()[0].cover).toMatch(HD_HOST);
  });
});
