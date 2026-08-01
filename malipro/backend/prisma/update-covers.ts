/**
 * Met à jour uniquement les visuels des boutiques depuis `catalog.json`.
 *
 * Utile quand la médiathèque du web change (ex. diversification des couvertures)
 * sans qu'il faille rejouer tout le seed du catalogue.
 *
 *   npx tsx prisma/update-covers.ts
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

async function main() {
  const data = JSON.parse(
    readFileSync(resolve(__dirname, "catalog.json"), "utf8"),
  ) as { stores: { slug: string; coverUrl: string; logoUrl: string }[] };

  const byPhone = new Map(data.stores.map((s) => [merchantPhone(s.slug), s]));
  const rows = await prisma.store.findMany({ select: { id: true, phone: true, coverUrl: true } });

  let updated = 0;
  for (const row of rows) {
    const src = byPhone.get(row.phone ?? "");
    if (!src || src.coverUrl === row.coverUrl) continue;
    await prisma.store.update({
      where: { id: row.id },
      data: { coverUrl: src.coverUrl, logoUrl: src.logoUrl },
    });
    updated++;
  }
  console.log(`Visuels mis à jour : ${updated} / ${rows.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
