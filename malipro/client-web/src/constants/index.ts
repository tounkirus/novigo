import type { StoreCategory, Vertical, OrderStatus, PaymentMethodType } from "@/types";

export const BRAND = {
  name: "NOVIGO",
  tagline: "La Super App du Mali",
  city: "Bamako",
  currency: "FCFA",
};

/** Date de référence figée : garantit un rendu déterministe (SSR = client). */
export const NOW = new Date("2026-07-08T12:00:00+00:00").getTime();

export interface VerticalDef {
  key: Vertical;
  label: string;
  icon: string;
  accent: string; // gradient tailwind
  desc: string;
}

// Palette officielle NOVIGO : Rouge / Noir / Blanc / Gris uniquement.
// FOOD porte l'accent rouge de marque ; les autres verticales adoptent des dégradés
// graphite (nuances de gris neutres) pour un rendu monochrome premium — aucune zone verte/violette.
export const VERTICALS: VerticalDef[] = [
  { key: "FOOD", label: "Repas", icon: "UtensilsCrossed", accent: "from-brand to-brand-dark", desc: "Restaurants & fast-food" },
  { key: "GROCERY", label: "Supermarché", icon: "ShoppingCart", accent: "from-neutral-700 to-neutral-900", desc: "Courses livrées" },
  { key: "PHARMACY", label: "Pharmacie", icon: "Cross", accent: "from-zinc-700 to-zinc-900", desc: "Santé & bien-être" },
  { key: "MARKET", label: "Marché", icon: "Store", accent: "from-stone-600 to-stone-800", desc: "Produits frais locaux" },
  { key: "PARCEL", label: "Colis", icon: "Package", accent: "from-neutral-800 to-neutral-950", desc: "Envois express" },
  { key: "TAXI", label: "Taxi", icon: "Car", accent: "from-zinc-600 to-zinc-800", desc: "Courses en ville" },
  { key: "SERVICES", label: "Services", icon: "Wrench", accent: "from-slate-600 to-slate-800", desc: "Artisans & pros" },
];

export const STORE_CATEGORY_LABEL: Record<StoreCategory, string> = {
  RESTAURANT: "Restaurant",
  SUPERMARKET: "Supermarché",
  PHARMACY: "Pharmacie",
  BAKERY: "Boulangerie",
  BUTCHER: "Boucherie",
  MARKET: "Marché",
  SHOP: "Boutique",
};

export const STORE_CATEGORY_VERTICAL: Record<StoreCategory, Vertical> = {
  RESTAURANT: "FOOD",
  SUPERMARKET: "GROCERY",
  PHARMACY: "PHARMACY",
  BAKERY: "FOOD",
  BUTCHER: "MARKET",
  MARKET: "MARKET",
  SHOP: "SERVICES",
};

export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; tone: "info" | "warning" | "success" | "error" | "brand"; step: number }
> = {
  PENDING: { label: "En attente", tone: "warning", step: 0 },
  CONFIRMED: { label: "Confirmée", tone: "info", step: 1 },
  PREPARING: { label: "En préparation", tone: "info", step: 2 },
  READY: { label: "Prête", tone: "info", step: 3 },
  ASSIGNED: { label: "Livreur assigné", tone: "brand", step: 4 },
  DELIVERING: { label: "En livraison", tone: "brand", step: 5 },
  DELIVERED: { label: "Livrée", tone: "success", step: 6 },
  CANCELLED: { label: "Annulée", tone: "error", step: -1 },
  REFUNDED: { label: "Remboursée", tone: "error", step: -1 },
};

export const ORDER_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "DELIVERING",
  "DELIVERED",
];

export const PAYMENT_LABEL: Record<PaymentMethodType, { label: string; icon: string; color: string }> = {
  ORANGE_MONEY: { label: "Orange Money", icon: "Smartphone", color: "text-orange-500" },
  MOOV_MONEY: { label: "Moov Money", icon: "Smartphone", color: "text-sky-500" },
  WAVE: { label: "Wave", icon: "Waves", color: "text-blue-500" },
  CARD: { label: "Carte bancaire", icon: "CreditCard", color: "text-ink" },
  CASH: { label: "Espèces à la livraison", icon: "Banknote", color: "text-success" },
  WALLET: { label: "Portefeuille NOVIGO", icon: "Wallet", color: "text-brand" },
};

// Deux familles seulement, cohérentes avec la charte Rouge/Noir/Blanc/Gris :
//  · accent ROUGE de marque pour la mise en avant (promo, livraison offerte, express, premium, top)
//  · GRAPHITE neutre pour les attributs de confiance (vérifié, nouveau, local)
const BADGE_BRAND = "bg-brand-soft text-brand";
const BADGE_NEUTRAL = "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/90";
export const BADGE_LABEL: Record<string, { label: string; icon: string; className: string }> = {
  PREMIUM: { label: "Premium", icon: "Crown", className: BADGE_BRAND },
  VERIFIED: { label: "Vérifié", icon: "BadgeCheck", className: BADGE_NEUTRAL },
  TOP_SELLER: { label: "Top vendeur", icon: "TrendingUp", className: BADGE_BRAND },
  FREE_DELIVERY: { label: "Livraison offerte", icon: "Truck", className: BADGE_BRAND },
  NEW: { label: "Nouveau", icon: "Sparkles", className: BADGE_NEUTRAL },
  FAST: { label: "Express", icon: "Zap", className: BADGE_BRAND },
  LOCAL: { label: "Local", icon: "MapPin", className: BADGE_NEUTRAL },
  PROMO: { label: "Promo", icon: "Tag", className: BADGE_BRAND },
};

/** Quartiers de Bamako pour des adresses réalistes. */
export const BAMAKO_DISTRICTS = [
  "Hamdallaye ACI 2000",
  "Badalabougou",
  "Hippodrome",
  "Magnambougou",
  "Faladié",
  "Kalaban Coura",
  "Sébénikoro",
  "Djélibougou",
  "Lafiabougou",
  "Sogoniko",
  "Niaréla",
  "Quinzambougou",
  "Missira",
  "Bacodjicoroni",
  "Torokorobougou",
  "Sotuba",
  "Banankabougou",
  "Yirimadio",
  "Kati",
  "Baco Djicoroni ACI",
];

export const CITY_CENTER = { lat: 12.6392, lng: -8.0029 };

/** Cibles de volumétrie du jeu de démonstration (voir src/mock). */
export const DATASET_TARGETS = {
  restaurants: 500,
  supermarkets: 200,
  pharmacies: 100,
  bakeries: 150,
  butchers: 100,
  markets: 100,
  shops: 300,
  drivers: 500,
  merchants: 1000,
  customers: 5000,
  admins: 50,
  orders: 30000,
  reviews: 100000,
  products: 20000,
  coupons: 500,
  promotions: 1000,
  notifications: 5000,
  addresses: 10000,
  payments: 30000,
};
