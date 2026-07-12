/** NOVIGO V2 — Modèle de domaine du back-office (CMS, CRM, ERP, Super Admin). */
import type { Id, ISODate } from "./index";

/* --------------------------------- CMS --------------------------------- */
export interface CmsBanner {
  id: Id;
  title: string;
  subtitle: string;
  image: string;
  placement: "HOME_HERO" | "HOME_STRIP" | "CATEGORY" | "CHECKOUT";
  status: "PUBLISHED" | "DRAFT" | "SCHEDULED";
  clicks: number;
  impressions: number;
  startAt: ISODate;
  endAt: ISODate;
}

export interface CmsPage {
  id: Id;
  title: string;
  slug: string;
  type: "LEGAL" | "HELP" | "MARKETING" | "BLOG";
  status: "PUBLISHED" | "DRAFT";
  updatedAt: ISODate;
  author: string;
  views: number;
}

export interface CmsCollection {
  id: Id;
  name: string;
  description: string;
  image: string;
  itemCount: number;
  status: "PUBLISHED" | "DRAFT";
  featured: boolean;
}

export interface MediaAsset {
  id: Id;
  name: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  size: string;
  uploadedAt: ISODate;
}

/* --------------------------------- CRM --------------------------------- */
export type CustomerSegment = "VIP" | "FIDELE" | "NOUVEAU" | "INACTIF" | "A_RISQUE";

export interface CrmCustomer {
  id: Id;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  district: string;
  segment: CustomerSegment;
  orders: number;
  ltv: number; // valeur vie client
  lastOrderAt: ISODate;
  joinedAt: ISODate;
  status: "ACTIVE" | "CHURN_RISK" | "INACTIVE";
  satisfaction: number; // 0..100
}

export interface CrmSegment {
  id: Id;
  name: CustomerSegment;
  label: string;
  count: number;
  revenue: number;
  color: string;
  trend: number;
}

export interface SupportTicket {
  id: Id;
  ref: string;
  customer: string;
  avatar: string;
  subject: string;
  channel: "CHAT" | "EMAIL" | "PHONE" | "APP";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "PENDING" | "RESOLVED";
  createdAt: ISODate;
  agent?: string;
}

/* --------------------------------- ERP --------------------------------- */
export interface InventoryItem {
  id: Id;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  stock: number;
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
  status: "IN_STOCK" | "LOW" | "OUT";
}

export interface Supplier {
  id: Id;
  name: string;
  contact: string;
  phone: string;
  category: string;
  items: number;
  reliability: number; // 0..100
  balance: number;
}

export interface Invoice {
  id: Id;
  ref: string;
  party: string;
  type: "PAYOUT" | "INVOICE" | "COMMISSION";
  amount: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  dueAt: ISODate;
}

export interface FinanceSummary {
  revenue: number;
  commissions: number;
  payouts: number;
  pending: number;
  netProfit: number;
}

/* ------------------------------ Super Admin ---------------------------- */
export interface Role {
  id: Id;
  name: string;
  users: number;
  permissions: number;
  color: string;
  description: string;
}

export interface FeatureFlag {
  id: Id;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rollout: number; // %
  env: "PROD" | "STAGING";
}

export interface SystemService {
  id: Id;
  name: string;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN";
  uptime: number;
  latencyMs: number;
}

export interface AuditLog {
  id: Id;
  actor: string;
  action: string;
  target: string;
  at: ISODate;
  ip: string;
  level: "INFO" | "WARNING" | "CRITICAL";
}

/* ---------------------- Super Admin — command & config ---------------------- */

/** Vue d'ensemble globale de la plateforme (command center). */
export interface PlatformOverview {
  users: number;
  merchants: number;
  drivers: number;
  providers: number;
  gmv30d: number;
  ordersToday: number;
  txToday: number;
  uptime: number;
  openIncidents: number;
  pendingKyc: number;
}

/** Règle de commission par verticale. */
export interface CommissionRule {
  id: Id;
  vertical: string;
  icon: string;
  rate: number; // %
  minFee: number; // FCFA
  active: boolean;
}

/** Plafonds & règles wallet par rôle. */
export interface WalletLimit {
  id: Id;
  role: string;
  dailyMax: number;
  monthlyMax: number;
  minPayout: number;
}

/** Fournisseur de paiement branché à la plateforme. */
export interface PaymentProvider {
  id: Id;
  name: string;
  icon: string;
  color: string;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN";
  successRate: number; // %
  volume30d: number; // FCFA
  fee: number; // %
  enabled: boolean;
}

/** Zone géographique de service (quartier/ville). */
export interface ServiceZone {
  id: Id;
  name: string;
  status: "ACTIVE" | "PILOT" | "PAUSED";
  drivers: number;
  merchants: number;
  orders30d: number;
  coverage: number; // %
}

/** Compte de l'équipe d'administration. */
export interface AdminStaff {
  id: Id;
  name: string;
  avatar: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  twoFactor: boolean;
  lastActiveAt: ISODate;
}
