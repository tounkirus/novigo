/**
 * Exporte le catalogue déterministe de l'app web (commerces, produits, métiers,
 * prestataires) vers un JSON consommé par le seed backend.
 *
 * But : le backend devient la source unique, donc l'app mobile et l'app web
 * affichent exactement le même catalogue et restent synchronisées.
 *
 *   npx tsx scripts/export-catalog.ts [chemin-de-sortie]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { stores, menuOf } from "@/mock/db";
import { generateProviders, SERVICE_CATEGORIES, CATEGORY_BY_ID } from "@/mock/services";
import { STORE_CATEGORY_LABEL } from "@/constants";
import type { Store, Product } from "@/types";

const out = resolve(process.argv[2] ?? "catalog.json");

/** Nombre de prestataires exportés (le web en génère 2 000 au total). */
const PROVIDER_COUNT = Number(process.env.PROVIDERS ?? 2000);

type ExportedProduct = {
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  imageUrl: string;
  images: string[];
  stockQuantity: number;
  inStock: boolean;
};

const mapProduct = (p: Product): ExportedProduct => ({
  name: p.name,
  description: p.description,
  price: p.price,
  oldPrice: p.oldPrice,
  category: p.category,
  imageUrl: p.image,
  images: p.gallery ?? [],
  stockQuantity: p.stock,
  inStock: p.available && p.stock > 0,
});

const mapStore = (s: Store) => ({
  slug: s.slug,
  name: s.name,
  category: s.category,
  categoryLabel: STORE_CATEGORY_LABEL[s.category],
  description: s.description,
  address: `${s.address}, ${s.city}`,
  district: s.district,
  phone: s.phone,
  logoUrl: s.logo,
  coverUrl: s.cover,
  lat: s.location?.lat,
  lng: s.location?.lng,
  rating: s.rating,
  isOpen: s.isOpen,
  deliveryFee: s.deliveryFee,
  products: menuOf(s).flatMap((section) => section.products).map(mapProduct),
});

const allStores = stores();
console.log(`Commerces : ${allStores.length}`);

const exportedStores = allStores.map(mapStore);
const productCount = exportedStores.reduce((n, s) => n + s.products.length, 0);
console.log(`Produits  : ${productCount}`);

const providers = generateProviders(PROVIDER_COUNT).map((p) => ({
  slug: p.slug,
  name: p.name,
  phone: p.phone,
  categoryId: p.categoryId,
  profession: p.categoryLabel,
  group: p.group,
  bio: p.bio,
  rating: p.rating,
  serviceArea: p.district,
  avatarUrl: p.avatar,
  coverUrl: p.coverImage,
  startingPrice: p.startingPrice,
  unit: p.unit,
  // Prestations facturables : le portfolio du web sert de catalogue de services.
  services: p.portfolio.slice(0, 4).map((item, i) => ({
    title: item.title,
    // `PortfolioItem` ne porte pas de description : on compose celle du seed à
    // partir du métier et du secteur du prestataire (le contrat de seed exige
    // une description non nulle). Corrige une compilation cassée du script.
    description: `${item.title} — ${p.categoryLabel} à ${p.district}.`,
    price: Math.round((p.startingPrice * (1 + i * 0.35)) / 500) * 500,
    durationMinutes: [60, 120, 180, 240][i % 4],
    imageUrl: item.image,
  })),
}));
console.log(`Prestataires : ${providers.length}`);

const payload = {
  generatedFrom: "client-web/src/mock (déterministe)",
  serviceCategories: SERVICE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    group: c.group,
    unit: c.unit,
  })),
  serviceGroups: [...new Set(SERVICE_CATEGORIES.map((c) => c.group))],
  stores: exportedStores,
  providers,
};

writeFileSync(out, JSON.stringify(payload));
console.log(`→ ${out}`);
console.log(`Catégories de services : ${Object.keys(CATEGORY_BY_ID).length}`);
