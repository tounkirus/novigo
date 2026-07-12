/**
 * NOVIGO V2 — Modèle de domaine des nouveaux modules Super App.
 * (Mobilité, paiements, portefeuille, fidélité, parrainage, premium, chat…)
 */
import type { Id, ISODate, GeoPoint } from "./index";

/* ----------------------------- Portefeuille ----------------------------- */
export type WalletTxType = "TOPUP" | "PAYMENT" | "TRANSFER_IN" | "TRANSFER_OUT" | "REFUND" | "CASHBACK" | "BILL" | "AIRTIME" | "REWARD";

export interface WalletTx {
  id: Id;
  type: WalletTxType;
  label: string;
  counterpart?: string;
  amount: number; // positif = crédit, négatif = débit
  balanceAfter: number;
  createdAt: ISODate;
  status: "COMPLETED" | "PENDING" | "FAILED";
  method?: string;
  icon: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  monthlyIn: number;
  monthlyOut: number;
  cashback: number;
  transactions: WalletTx[];
}

/* -------------------------- Paiement de factures ------------------------- */
export interface Biller {
  id: Id;
  name: string;
  category: "WATER" | "ELECTRICITY" | "TV" | "INTERNET" | "SCHOOL" | "INSURANCE" | "TAX";
  logo: string;
  color: string;
  fieldLabel: string; // "N° de compteur", "N° d'abonné"
  placeholder: string;
}

export interface BillHistory {
  id: Id;
  billerId: Id;
  billerName: string;
  reference: string;
  amount: number;
  createdAt: ISODate;
  status: "PAID" | "PENDING" | "FAILED";
}

/* ------------------------- Recharge téléphonique ------------------------- */
export interface Operator {
  id: Id;
  name: string;
  logo: string;
  color: string;
  prefixes: string[];
}

export interface AirtimeBundle {
  id: Id;
  operatorId: Id;
  type: "AIRTIME" | "DATA" | "COMBO";
  label: string;
  detail: string;
  price: number;
  validity: string;
  bonus?: string;
  popular?: boolean;
}

/* ------------------------------- Fidélité ------------------------------- */
export interface LoyaltyTier {
  id: Id;
  name: string;
  minPoints: number;
  color: string;
  perks: string[];
}

export interface Reward {
  id: Id;
  title: string;
  description: string;
  cost: number; // points
  image: string;
  category: string;
  available: boolean;
}

export interface LoyaltyState {
  points: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  nextTier?: LoyaltyTier;
  history: { id: Id; label: string; points: number; createdAt: ISODate }[];
  rewards: Reward[];
}

/* ------------------------------ Parrainage ------------------------------ */
export interface Referral {
  code: string;
  invited: number;
  completed: number;
  earned: number;
  pending: number;
  rewardPerFriend: number;
  friends: { id: Id; name: string; avatar: string; status: "JOINED" | "ORDERED" | "PENDING"; reward: number; joinedAt: ISODate }[];
}

/* --------------------------- Premium (abonnement) ------------------------ */
export interface PremiumPlan {
  id: Id;
  name: string;
  price: number;
  period: "MONTH" | "YEAR";
  highlight?: boolean;
  badge?: string;
  perks: string[];
}

/* ------------------------------ Mobilité -------------------------------- */
export type RideMode = "TAXI" | "MOTO" | "EXPRESS";

export interface RideOption {
  mode: RideMode;
  label: string;
  icon: string;
  etaMin: number;
  price: number;
  capacity: number;
  desc: string;
}

export interface RideQuote {
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  options: RideOption[];
}

export interface RideDriverNearby {
  id: Id;
  name: string;
  avatar: string;
  rating: number;
  vehicle: string;
  plate: string;
  etaMin: number;
  location: GeoPoint;
}

export interface Trip {
  id: Id;
  mode: RideMode;
  from: string;
  to: string;
  date: ISODate;
  price: number;
  distanceKm: number;
  durationMin: number;
  status: "COMPLETED" | "CANCELLED" | "ONGOING";
  driverName: string;
  rating?: number;
}

/* -------------------------------- Colis --------------------------------- */
export type ParcelSize = "SMALL" | "MEDIUM" | "LARGE";

export interface ParcelQuote {
  size: ParcelSize;
  label: string;
  icon: string;
  maxWeight: string;
  price: number;
  etaMin: number;
}

export interface Parcel {
  id: Id;
  ref: string;
  from: string;
  to: string;
  recipient: string;
  size: ParcelSize;
  price: number;
  status: "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";
  createdAt: ISODate;
  eta: string;
}

/* -------------------------------- Chat ---------------------------------- */
export interface ChatThread {
  id: Id;
  name: string;
  avatar: string;
  kind: "SUPPORT" | "DRIVER" | "MERCHANT";
  lastMessage: string;
  lastAt: ISODate;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: Id;
  threadId: Id;
  from: "me" | "them";
  text: string;
  at: ISODate;
  status?: "sent" | "delivered" | "read";
}

/* --------------------------- Recommandations IA -------------------------- */
export interface AiRecommendation {
  id: Id;
  reason: string;
  storeId: Id;
  score: number;
}

/* -------------------------------- Publicité ------------------------------ */
export interface AdCampaign {
  id: Id;
  advertiser: string;
  title: string;
  status: "ACTIVE" | "PAUSED" | "ENDED" | "REVIEW";
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  startAt: ISODate;
  endAt: ISODate;
}
