/**
 * Seed du catalogue complet depuis l'app web.
 *
 * Lit `prisma/catalog.json` (produit par `client-web/scripts/export-catalog.ts`)
 * et le charge en base : commerçants + boutiques + produits, artisans + prestations.
 * Le backend devient la source unique — l'app mobile et l'app web affichent
 * dès lors exactement le même catalogue.
 *
 * Idempotent : les boutiques sont identifiées par leur slug (stocké dans le
 * numéro de téléphone technique du commerçant), une seconde exécution met à
 * jour au lieu de dupliquer.
 *
 *   npx tsx prisma/seed-catalog.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Json = {
  serviceCategories: { id: string; label: string; group: string; unit: string }[];
  stores: {
    slug: string; name: string; category: string; categoryLabel: string; description: string;
    address: string; district: string; phone: string; logoUrl: string; coverUrl: string;
    lat?: number; lng?: number; rating: number; isOpen: boolean; deliveryFee: number;
    products: {
      name: string; description: string; price: number; oldPrice?: number; category: string;
      imageUrl: string; images: string[]; stockQuantity: number; inStock: boolean;
    }[];
  }[];
  providers: {
    slug: string; name: string; phone: string; categoryId: string; profession: string;
    bio: string; rating: number; serviceArea: string; avatarUrl: string;
    services: { title: string; description: string; price: number; durationMinutes: number; imageUrl: string }[];
  }[];
};

/** Catégorie produit du catalogue global, dérivée du type de commerce. */
const VERTICAL: Record<string, string> = {
  RESTAURANT: "FOOD",
  BAKERY: "FOOD",
  SUPERMARKET: "GROCERY",
  PHARMACY: "PHARMACY",
  BUTCHER: "MARKET",
  MARKET: "MARKET",
  SHOP: "SHOP",
};

/** Téléphone technique déterministe : sert de clé d'idempotence. */
const merchantPhone = (slug: string) => `+223CAT${hash(slug)}`;
const artisanPhone = (slug: string) => `+223PRO${hash(slug)}`;

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).padStart(7, "0").slice(0, 9);
}

const CHUNK = 1000;
async function inChunks<T>(rows: T[], fn: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += CHUNK) await fn(rows.slice(i, i + CHUNK));
}

async function main() {
  const file = resolve(__dirname, "catalog.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as Json;
  console.log(`Catalogue : ${data.stores.length} commerces, ${data.providers.length} prestataires`);

  const passwordHash = await bcrypt.hash("admin123", 10);

  // ── 1. Commerçants (1 compte par boutique) ───────────────────────────────
  const merchantUsers = data.stores.map((s) => ({
    phone: merchantPhone(s.slug),
    firstName: s.name.split(" ")[0],
    lastName: "NOVIGO",
    passwordHash,
    roles: ["MERCHANT"] as any,
  }));
  await inChunks(merchantUsers, (batch) =>
    prisma.user.createMany({ data: batch, skipDuplicates: true }),
  );
  const users = await prisma.user.findMany({
    where: { phone: { in: merchantUsers.map((u) => u.phone) } },
    select: { id: true, phone: true },
  });
  const userIdByPhone = new Map(users.map((u) => [u.phone, u.id]));
  console.log(`Comptes commerçants : ${users.length}`);

  await inChunks(
    data.stores.map((s) => ({
      userId: userIdByPhone.get(merchantPhone(s.slug))!,
      businessName: s.name,
      category: s.category,
      isActive: true,
      status: "APPROVED" as any,
    })),
    (batch) => prisma.merchant.createMany({ data: batch, skipDuplicates: true }),
  );
  const merchants = await prisma.merchant.findMany({ select: { id: true, userId: true } });
  const merchantIdByUser = new Map(merchants.map((m) => [m.userId, m.id]));
  console.log(`Commerçants : ${merchants.length}`);

  // ── 2. Boutiques ─────────────────────────────────────────────────────────
  // `phone` porte le slug web : c'est la clé de rapprochement entre deux runs.
  const existing = await prisma.store.findMany({ select: { id: true, phone: true } });
  const storeIdByPhone = new Map(existing.map((s) => [s.phone ?? "", s.id]));
  const toCreate = data.stores.filter((s) => !storeIdByPhone.has(merchantPhone(s.slug)));

  await inChunks(
    toCreate.map((s) => ({
      merchantId: merchantIdByUser.get(userIdByPhone.get(merchantPhone(s.slug))!)!,
      name: s.name,
      category: s.category,
      description: s.description,
      phone: merchantPhone(s.slug),
      address: s.address,
      logoUrl: s.logoUrl,
      coverUrl: s.coverUrl,
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      isOpen: s.isOpen,
      rating: s.rating,
      deliveryFee: s.deliveryFee,
    })),
    (batch) => prisma.store.createMany({ data: batch, skipDuplicates: true }),
  );
  const allStores = await prisma.store.findMany({ select: { id: true, phone: true } });
  const storeId = new Map(allStores.map((s) => [s.phone ?? "", s.id]));
  console.log(`Boutiques : ${allStores.length}`);

  // ── 3. Produits ──────────────────────────────────────────────────────────
  const withProducts = new Set(
    (await prisma.product.groupBy({ by: ["storeId"], where: { storeId: { not: null } } }))
      .map((r) => r.storeId as string),
  );
  const products: Prisma.ProductCreateManyInput[] = [];
  for (const s of data.stores) {
    const id = storeId.get(merchantPhone(s.slug));
    if (!id || withProducts.has(id)) continue; // déjà peuplée
    for (const p of s.products) {
      // Ancien prix -> remise commerçant, comme sur le web.
      const promo = p.oldPrice && p.oldPrice > p.price
        ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
        : null;
      products.push({
        storeId: id,
        name: p.name,
        description: p.description,
        category: VERTICAL[s.category] ?? "SHOP",
        price: p.oldPrice && promo ? p.oldPrice : p.price,
        promoPercent: promo,
        imageUrl: p.imageUrl,
        images: p.images,
        inStock: p.inStock,
        stockQuantity: p.stockQuantity,
        status: "PUBLISHED" as any,
      });
    }
  }
  await inChunks(products, (batch) => prisma.product.createMany({ data: batch, skipDuplicates: true }));
  console.log(`Produits insérés : ${products.length}`);

  // ── 4. Prestataires de services à domicile ───────────────────────────────
  const artisanUsers = data.providers.map((p) => ({
    phone: artisanPhone(p.slug),
    firstName: p.name.split(" ")[0],
    lastName: p.name.split(" ").slice(1).join(" ") || "NOVIGO",
    photoUrl: p.avatarUrl,
    passwordHash,
    roles: ["ARTISAN"] as any,
  }));
  await inChunks(artisanUsers, (batch) => prisma.user.createMany({ data: batch, skipDuplicates: true }));
  const proUsers = await prisma.user.findMany({
    where: { phone: { in: artisanUsers.map((u) => u.phone) } },
    select: { id: true, phone: true },
  });
  const proIdByPhone = new Map(proUsers.map((u) => [u.phone, u.id]));

  await inChunks(
    data.providers.map((p) => ({
      userId: proIdByPhone.get(artisanPhone(p.slug))!,
      profession: p.profession,
      bio: p.bio,
      rating: p.rating,
      isAvailable: true,
      serviceArea: p.serviceArea,
    })),
    (batch) => prisma.artisan.createMany({ data: batch, skipDuplicates: true }),
  );
  const artisans = await prisma.artisan.findMany({ select: { id: true, userId: true } });
  const artisanIdByUser = new Map(artisans.map((a) => [a.userId, a.id]));
  console.log(`Prestataires : ${artisans.length}`);

  const withServices = new Set(
    (await prisma.artisanService.groupBy({ by: ["artisanId"] })).map((r) => r.artisanId),
  );
  const services: Prisma.ArtisanServiceCreateManyInput[] = [];
  for (const p of data.providers) {
    const aid = artisanIdByUser.get(proIdByPhone.get(artisanPhone(p.slug))!);
    if (!aid || withServices.has(aid)) continue;
    for (const s of p.services) {
      services.push({
        artisanId: aid,
        title: s.title,
        description: s.description,
        price: s.price,
        durationMinutes: s.durationMinutes,
        imageUrl: s.imageUrl,
      });
    }
  }
  await inChunks(services, (batch) => prisma.artisanService.createMany({ data: batch, skipDuplicates: true }));
  console.log(`Prestations insérées : ${services.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
