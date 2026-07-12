/**
 * Seeder NOVIGO — régénère un instantané JSON du jeu de démonstration.
 * Usage : `npm run seed`  (écrit dans src/data/generated/).
 *
 * Le runtime de l'app génère déjà les données à la volée (voir src/mock/db.ts).
 * Ce script produit des fichiers JSON exportables pour brancher un back-end,
 * peupler une base, ou inspecter la donnée. Déterministe : même sortie à chaque run.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DATASET_TARGETS } from "@/constants";
import {
  generateStores, generateMenu, generateReviews, generateCoupons, generatePromotions,
  generateNotifications, generateDrivers, generateOrdersForUser, generateUser,
} from "./generators";
import type { StoreCategory } from "@/types";

const OUT = join(process.cwd(), "src", "data", "generated");
mkdirSync(OUT, { recursive: true });

const counts: Record<StoreCategory, number> = {
  RESTAURANT: DATASET_TARGETS.restaurants,
  SUPERMARKET: DATASET_TARGETS.supermarkets,
  PHARMACY: DATASET_TARGETS.pharmacies,
  BAKERY: DATASET_TARGETS.bakeries,
  BUTCHER: DATASET_TARGETS.butchers,
  MARKET: DATASET_TARGETS.markets,
  SHOP: DATASET_TARGETS.shops,
};

function write(name: string, data: unknown) {
  const path = join(OUT, name);
  writeFileSync(path, JSON.stringify(data, null, 0));
  return path;
}

console.log("🌱 Génération du jeu de démonstration NOVIGO…\n");

const stores = generateStores(counts);
console.log(`  • ${stores.length} commerces`);

// Menus + produits (échantillon complet des catalogues)
let productCount = 0;
let reviewCount = 0;
const menus: Record<string, ReturnType<typeof generateMenu>> = {};
const reviews: Record<string, ReturnType<typeof generateReviews>> = {};
for (const s of stores) {
  const m = generateMenu(s);
  menus[s.id] = m;
  productCount += m.reduce((n, sec) => n + sec.products.length, 0);
  // Un échantillon d'avis par commerce (12) — extrapolé aux volumes cibles.
  const r = generateReviews(s, 12);
  reviews[s.id] = r;
  reviewCount += r.length;
}
console.log(`  • ${productCount.toLocaleString("fr-FR")} produits`);
console.log(`  • ${reviewCount.toLocaleString("fr-FR")} avis (échantillon)`);

const user = generateUser(stores);
const orders = generateOrdersForUser(user, stores, 40);
const coupons = generateCoupons(DATASET_TARGETS.coupons);
const promotions = generatePromotions(stores, 200);
const notifications = generateNotifications(200);
const drivers = generateDrivers(DATASET_TARGETS.drivers);

write("stores.json", stores);
write("menus.json", menus);
write("reviews.json", reviews);
write("orders.json", orders);
write("coupons.json", coupons);
write("promotions.json", promotions);
write("notifications.json", notifications);
write("drivers.json", drivers);
write("user.json", user);
write("targets.json", DATASET_TARGETS);

console.log(`  • ${drivers.length} livreurs`);
console.log(`  • ${coupons.length} coupons, ${promotions.length} promotions`);
console.log(`\n✅ Instantané écrit dans src/data/generated/`);
console.log("   Cibles de volumétrie (production) :", DATASET_TARGETS);
