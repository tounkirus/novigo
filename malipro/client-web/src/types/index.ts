/**
 * NOVIGO — Modèle de domaine (types partagés).
 * Ces types décrivent la donnée manipulée par toute l'app cliente.
 * Ils sont volontairement alignés sur ce qu'une API REST renverrait,
 * afin que le mock puisse être remplacé sans toucher aux composants.
 */

export type Id = string;
export type ISODate = string;

/** Familles de commerces de la Super App. */
export type StoreCategory =
  | "RESTAURANT"
  | "SUPERMARKET"
  | "PHARMACY"
  | "BAKERY"
  | "BUTCHER"
  | "MARKET"
  | "SHOP";

/** Verticales de haut niveau proposées sur la home. */
export type Vertical =
  | "FOOD"
  | "GROCERY"
  | "PHARMACY"
  | "MARKET"
  | "PARCEL"
  | "TAXI"
  | "SERVICES";

export type Badge =
  | "PREMIUM"
  | "VERIFIED"
  | "TOP_SELLER"
  | "FREE_DELIVERY"
  | "NEW"
  | "FAST"
  | "LOCAL"
  | "PROMO";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface OpeningHour {
  day: number; // 0 = dimanche
  open: string; // "08:00"
  close: string; // "22:00"
  closed?: boolean;
}

export interface Review {
  id: Id;
  storeId: Id;
  productId?: Id;
  authorName: string;
  authorAvatar: string;
  rating: number; // 1..5
  comment: string;
  createdAt: ISODate;
  likes: number;
  images?: string[];
  reply?: { text: string; createdAt: ISODate };
}

export interface ProductOptionChoice {
  id: Id;
  label: string;
  price: number; // supplément
}

export interface ProductOptionGroup {
  id: Id;
  name: string; // "Taille", "Suppléments"
  required: boolean;
  multiple: boolean;
  min?: number;
  max?: number;
  choices: ProductOptionChoice[];
}

export interface Product {
  id: Id;
  storeId: Id;
  name: string;
  description: string;
  image: string;
  gallery?: string[];
  price: number;
  oldPrice?: number;
  category: string; // sous-catégorie interne (ex: "Plats", "Boissons")
  subCategory?: string;
  stock: number;
  available: boolean;
  weight?: string; // "500 g"
  unit?: string; // "pièce", "kg", "L"
  variants?: string[];
  options?: ProductOptionGroup[];
  ingredients?: string[];
  allergens?: string[];
  calories?: number;
  popularity: number; // 0..100
  rating: number;
  reviewCount: number;
  tags?: Badge[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
}

export interface MenuSection {
  id: Id;
  name: string;
  products: Product[];
}

export interface StorePromotion {
  id: Id;
  title: string;
  subtitle?: string;
  type: "FLASH" | "DISCOUNT" | "FREE_DELIVERY" | "COUPON" | "HAPPY_HOUR" | "PACK";
  value?: number; // % ou montant
  image?: string;
  endsAt?: ISODate;
  code?: string;
}

export interface StoreFaq {
  q: string;
  a: string;
}

export interface Store {
  id: Id;
  slug: string;
  name: string;
  slogan?: string;
  description: string;
  category: StoreCategory;
  subCategories: string[];
  logo: string;
  cover: string;
  gallery: string[];
  videoUrl?: string;
  district: string;
  city: string;
  address: string;
  location: GeoPoint;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  openingHours: OpeningHour[];
  isOpen: boolean;
  deliveryTimeMin: number;
  prepTimeMin: number;
  distanceKm: number;
  deliveryFee: number;
  minOrder: number;
  avgPrice: number;
  rating: number;
  reviewCount: number;
  orderCount: number;
  badges: Badge[];
  promotions: StorePromotion[];
  menu: MenuSection[];
  faq: StoreFaq[];
  cover_color?: string;
  featuredProductIds: Id[];
}

export interface Category {
  id: Id;
  label: string;
  icon: string; // clé Lucide
  vertical: Vertical;
  color: string; // classe tailwind d'accent
  count: number;
}

export interface Coupon {
  id: Id;
  code: string;
  title: string;
  description: string;
  type: "PERCENT" | "AMOUNT" | "FREE_DELIVERY";
  value: number;
  minOrder?: number;
  expiresAt: ISODate;
  storeId?: Id;
  used?: boolean;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "ASSIGNED"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface CartLine {
  productId: Id;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  options?: { groupName: string; choiceLabel: string; price: number }[];
  note?: string;
}

export interface OrderItem {
  productId: Id;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: Id;
  ref: string;
  storeId: Id;
  storeName: string;
  storeLogo: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethodType;
  address: Address;
  createdAt: ISODate;
  etaMinutes: number;
  driver?: Driver;
  rating?: number;
  timeline: { status: OrderStatus; at: ISODate }[];
}

export interface Address {
  id: Id;
  label: string; // "Maison", "Bureau"
  line: string;
  district: string;
  city: string;
  location: GeoPoint;
  isDefault?: boolean;
  note?: string;
}

export type PaymentMethodType = "ORANGE_MONEY" | "MOOV_MONEY" | "WAVE" | "CARD" | "CASH" | "WALLET";

export interface PaymentMethod {
  id: Id;
  type: PaymentMethodType;
  label: string;
  detail: string; // numéro masqué
  isDefault?: boolean;
}

export interface Driver {
  id: Id;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  vehicle: string;
  plate: string;
  location?: GeoPoint;
  deliveries: number;
}

export interface Notification {
  id: Id;
  type: "ORDER" | "PROMO" | "SYSTEM" | "WALLET";
  title: string;
  body: string;
  createdAt: ISODate;
  read: boolean;
  icon?: string;
}

export interface UserProfile {
  id: Id;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  avatar: string;
  walletBalance: number;
  loyaltyPoints: number;
  memberSince: ISODate;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  favoriteStoreIds: Id[];
}

export interface Promotion {
  id: Id;
  title: string;
  subtitle: string;
  image: string;
  storeId?: Id;
  vertical?: Vertical;
  cta: string;
  accent: string; // gradient tailwind
}

/** Point de statistique pour les dashboards. */
export interface SeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}
