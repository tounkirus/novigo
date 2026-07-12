/**
 * API Mock NOVIGO — simule un back-end asynchrone (latence + Promesses).
 * Permet des états de chargement/skeleton authentiques via TanStack Query.
 * Remplaçable 1:1 par de vrais appels `fetch`/axios : mêmes signatures, mêmes types.
 */
import type { Store, Product } from "@/types";
import * as db from "./db";
import { queryStores, search as searchSel, categories as catsSel, favoriteStores as favSel } from "./index";
import type { StoreQuery } from "./index";
import {
  generateWallet, generateBillers, generateBillHistory, generateOperators, generateBundles,
  generateLoyalty, generateReferral, generatePremiumPlans, generateRideQuote, generateNearbyDrivers,
  generateTrips, generateParcelQuotes, generateParcels, generateChatThreads, generateChatMessages,
  generateAiRecommendations, generateAdCampaigns,
} from "./modules";
import type { RideMode } from "@/types/modules";
import {
  generateBanners, generatePages, generateCollections, generateMedia, generateCrmCustomers,
  generateCrmSegments, generateTickets, generateInventory, generateSuppliers, generateInvoices,
  generateFinanceSummary, generateRoles, generateFeatureFlags, generateSystemServices, generateAuditLogs,
} from "./backoffice";
import {
  generateWalletAccount, generateWalletAccounts, generateDriverWalletSummary,
  generateMerchantWalletSummary, generateAdminFinanceOverview, generatePayoutRequests,
} from "./wallet";
import {
  generateCashRegister, generateCashRegisters, generateRemittances, generateReconciliations,
  generateDiscrepancies, generateCashDashboard,
} from "./cash";
import type { WalletRole } from "@/types/wallet";
import { generateKitchenTickets, generateFraudAlerts } from "./ops";
import {
  serviceCategories, queryProviders, providerBySlug, featuredProviders, generateProviderReviews,
  clientInterventions, providerInterventions, generateProviderDashboard, generateProviderKyc,
  generateServiceStats, generateAdminProviderRows, generatePendingKycRows, meProvider,
} from "./services";
import { datasetVolumes } from "./volumes";
import type { ProviderQuery } from "./services";
import { hashString } from "./rng";
import {
  generatePlatformOverview, generateCommissionRules, generateWalletLimits,
  generatePaymentProviders, generateServiceZones, generateAdminStaff,
} from "./superadmin";
import { withBackendAdapter } from "@/services/backend";

const LATENCY = 380;
function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const mockApi = {
  /* Catalogue */
  stores: (query?: StoreQuery) => delay(queryStores(query ?? {})),
  storeBySlug: (slug: string) => delay(db.storeBySlug(slug) ?? null),
  categories: () => delay(catsSel()),
  search: (q: string) => delay(searchSel(q), 260),
  favorites: () => delay(favSel()),
  popular: (n = 10) => delay([...db.stores()].sort((a, b) => b.orderCount - a.orderCount).slice(0, n)),
  recommendations: () => {
    const ids = [...db.stores()].sort((a, b) => b.rating - a.rating).slice(0, 8).map((s) => s.id);
    const recs = generateAiRecommendations(ids);
    const byId = new Map(db.stores().map((s) => [s.id, s] as const));
    return delay(recs.map((r) => ({ ...r, store: byId.get(r.storeId) as Store })));
  },

  /* Portefeuille */
  wallet: () => delay(generateWallet()),

  /* Factures & recharge */
  billers: () => delay(generateBillers()),
  billHistory: () => delay(generateBillHistory()),
  operators: () => delay(generateOperators()),
  bundles: (operatorId: string) => delay(generateBundles(operatorId)),

  /* Fidélité & parrainage & premium */
  loyalty: () => delay(generateLoyalty()),
  referral: () => delay(generateReferral()),
  premiumPlans: () => delay(generatePremiumPlans()),

  /* Mobilité */
  rideQuote: (from: string, to: string) => delay(generateRideQuote(from, to), 600),
  nearbyDrivers: (mode: RideMode) => delay(generateNearbyDrivers(mode)),
  trips: () => delay(generateTrips()),

  /* Colis */
  parcelQuotes: () => delay(generateParcelQuotes()),
  parcels: () => delay(generateParcels()),

  /* Chat */
  chatThreads: () => delay(generateChatThreads()),
  chatMessages: (threadId: string) => delay(generateChatMessages(threadId), 300),

  /* Publicité (back-office) */
  adCampaigns: () => delay(generateAdCampaigns()),

  /* Back-office — CMS */
  cmsBanners: () => delay(generateBanners()),
  cmsPages: () => delay(generatePages()),
  cmsCollections: () => delay(generateCollections()),
  cmsMedia: () => delay(generateMedia()),

  /* Back-office — CRM */
  crmCustomers: (count?: number) => delay(generateCrmCustomers(count)),
  crmSegments: () => delay(generateCrmSegments()),
  supportTickets: () => delay(generateTickets()),

  /* Back-office — ERP */
  inventory: () => delay(generateInventory()),
  suppliers: () => delay(generateSuppliers()),
  invoices: () => delay(generateInvoices()),
  financeSummary: () => delay(generateFinanceSummary()),

  /* Back-office — Super Admin */
  roles: () => delay(generateRoles()),
  featureFlags: () => delay(generateFeatureFlags()),
  systemServices: () => delay(generateSystemServices()),
  auditLogs: () => delay(generateAuditLogs()),

  /* Super Admin — command center & configuration */
  platformOverview: () => delay(generatePlatformOverview()),
  datasetVolumes: () => delay(datasetVolumes()),
  commissionRules: () => delay(generateCommissionRules()),
  walletLimits: () => delay(generateWalletLimits()),
  paymentProviders: () => delay(generatePaymentProviders()),
  serviceZones: () => delay(generateServiceZones()),
  adminStaff: (count?: number) => delay(generateAdminStaff(count)),

  /* Wallet — écosystème (tous rôles) */
  walletAccount: (role: WalletRole, ownerId = `${role.toLowerCase()}_me`, ownerName = "Seydou Tounkara") =>
    delay(generateWalletAccount(role, ownerId, ownerName)),
  walletAccounts: (count?: number) => delay(generateWalletAccounts(count)),
  driverWalletSummary: () => delay(generateDriverWalletSummary()),
  merchantWalletSummary: () => delay(generateMerchantWalletSummary()),
  adminFinanceOverview: () => delay(generateAdminFinanceOverview()),
  payoutRequests: () => delay(generatePayoutRequests()),

  /* Opérations commerçant */
  kitchenTickets: () => delay(generateKitchenTickets()),

  /* Sécurité financière */
  fraudAlerts: () => delay(generateFraudAlerts()),

  /* Cash Management */
  cashRegister: () => delay(generateCashRegister()),
  cashRegisters: (count?: number) => delay(generateCashRegisters(count)),
  cashRemittances: () => delay(generateRemittances()),
  cashReconciliations: () => delay(generateReconciliations()),
  cashDiscrepancies: () => delay(generateDiscrepancies()),
  cashDashboard: () => delay(generateCashDashboard()),

  /* Services à Domicile */
  serviceCategories: () => delay(serviceCategories()),
  serviceProviders: (query?: ProviderQuery) => delay(queryProviders(query ?? {})),
  serviceProvider: (slug: string) => delay(providerBySlug(slug)),
  featuredProviders: (n?: number) => delay(featuredProviders(n)),
  serviceReviews: (providerId: string) => delay(generateProviderReviews(providerId)),
  meProvider: () => delay(meProvider()),
  clientInterventions: () => delay(clientInterventions()),
  providerInterventions: () => delay(providerInterventions()),
  providerDashboard: () => delay(generateProviderDashboard()),
  providerKyc: () => delay(generateProviderKyc()),
  serviceStats: () => delay(generateServiceStats()),
  adminProviders: (page?: number, pageSize?: number) => delay(generateAdminProviderRows(page, pageSize)),
  pendingKycProviders: (limit?: number) => delay(generatePendingKycRows(limit)),
  bookIntervention: (providerId: string, amount: number) =>
    delay({ ok: true as const, ref: `SRV-${(hashString(providerId) % 1_000_000).toString().padStart(6, "0")}`, amount, status: "REQUESTED" as const }, 900),

  /* Mutations simulées */
  pay: (amount: number) => delay({ ok: true, amount, ref: `TX-${amount}` }, 900),
  topUp: (amount: number) => delay({ ok: true, balance: 24500 + amount }, 900),
  requestPayout: (amount: number) => delay({ ok: true, ref: `PO-${amount}`, status: "PENDING" as const }, 900),
  declareRemittance: (amount: number) => delay({ ok: true, ref: `RM-${amount}`, receiptId: `REC-${amount}` }, 900),
};

/**
 * API consommée par toute l'app. En mode mock (défaut) c'est `mockApi` tel quel ;
 * en mode live (`NEXT_PUBLIC_API_MODE=live`) un sous-ensemble est branché sur le
 * backend Spring avec repli mock automatique. Voir `@/services/backend`.
 */
export const api = withBackendAdapter(mockApi);

export type Api = typeof mockApi;
export type RecommendationWithStore = { id: string; reason: string; storeId: string; score: number; store: Store };
export type { Product };
