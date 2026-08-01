/**
 * Restaure les sections de menu du catalogue web.
 *
 * Le seed initial écrivait la verticale (FOOD/GROCERY/…) dans `Product.category`
 * — champ qui sert au filtre du catalogue global — et perdait au passage la
 * sous-catégorie du web (« Plats », « Boissons », « Desserts »…). Les fiches
 * boutique n'affichaient donc qu'une seule section.
 *
 * Ce script recrée les `MenuCategory` par boutique depuis `catalog.json` et y
 * rattache les produits. Idempotent : une boutique déjà sectionnée est ignorée.
 *
 *   npx tsx prisma/fix-menu-categories.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).padStart(7, "0").slice(0, 9);
}
const merchantPhone = (slug: string) => `+223CAT${hash(slug)}`;

type Json = {
  stores: { slug: string; products: { name: string; category: string }[] }[];
};

async function main() {
  const data = JSON.parse(
    readFileSync(resolve(__dirname, "catalog.json"), "utf8"),
  ) as Json;

  const stores = await prisma.store.findMany({ select: { id: true, phone: true } });
  const storeIdByPhone = new Map(stores.map((s) => [s.phone ?? "", s.id]));

  let touchedStores = 0;
  let linked = 0;

  for (const s of data.stores) {
    const storeId = storeIdByPhone.get(merchantPhone(s.slug));
    if (!storeId) continue;

    // Le rattachement se fait par nom de produit. Un même nom peut apparaître
    // deux fois dans un menu généré : on retient sa PREMIÈRE section, sinon les
    // passes suivantes réécrivent le lien et un plat finit dans « Boissons ».
    const sections: string[] = [];
    const sectionOfName = new Map<string, string>();
    for (const p of s.products) {
      const section = (p.category ?? "").trim() || "Menu";
      if (!sections.includes(section)) sections.push(section);
      if (!sectionOfName.has(p.name)) sectionOfName.set(p.name, section);
    }
    if (!sections.length) continue;

    const namesBySection = new Map<string, string[]>();
    for (const [name, section] of sectionOfName) {
      if (!namesBySection.has(section)) namesBySection.set(section, []);
      namesBySection.get(section)!.push(name);
    }

    // Réutilise les sections déjà créées (le script est rejouable).
    const existing = await prisma.menuCategory.findMany({
      where: { storeId },
      select: { id: true, name: true },
    });
    const known = new Set(existing.map((c) => c.name));
    const missing = sections.filter((n) => !known.has(n));
    if (missing.length) {
      await prisma.menuCategory.createMany({
        data: missing.map((name) => ({ storeId, name, sortOrder: sections.indexOf(name) })),
      });
    }
    const created = await prisma.menuCategory.findMany({
      where: { storeId },
      select: { id: true, name: true },
    });
    const idByName = new Map(created.map((c) => [c.name, c.id]));

    for (const [section, names] of namesBySection) {
      const menuCategoryId = idByName.get(section);
      if (!menuCategoryId) continue;
      const res = await prisma.product.updateMany({
        where: { storeId, name: { in: [...new Set(names)] } },
        data: { menuCategoryId },
      });
      linked += res.count;
    }
    touchedStores++;
    if (touchedStores % 100 === 0) {
      console.log(`… ${touchedStores} boutiques, ${linked} produits rattachés`);
    }
  }

  console.log(`Boutiques sectionnées : ${touchedStores}`);
  console.log(`Produits rattachés    : ${linked}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
