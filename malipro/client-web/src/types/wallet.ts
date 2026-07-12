/**
 * NOVIGO — Écosystème Wallet & Cash Management (tous rôles).
 * Modèle unifié réutilisable par Client / Livreur / Commerçant / Administrateur.
 */
import type { Id, ISODate } from "./index";

export type WalletRole = "CLIENT" | "DRIVER" | "MERCHANT" | "ADMIN";

/** Moyens de paiement (superset — n'altère pas PaymentMethodType existant). */
export type WalletMethod =
  | "ORANGE_MONEY" | "MOOV_MONEY" | "WAVE" | "VISA" | "MASTERCARD"
  | "CASH" | "BANK_TRANSFER" | "WALLET" | "QR_CODE";

export type WalletTxKind =
  | "CREDIT" | "DEBIT" | "PAYMENT" | "WITHDRAWAL" | "REFUND" | "BONUS"
  | "REFERRAL" | "CASHBACK" | "COMMISSION" | "ADJUSTMENT" | "CANCELLATION"
  | "TIP" | "PAYOUT" | "TOPUP" | "TRANSFER" | "SALE" | "AD_SPEND" | "SUBSCRIPTION";

export type WalletTxStatus = "COMPLETED" | "PENDING" | "FAILED" | "REVERSED";

export interface WalletTransaction {
  id: Id;
  ref: string;
  kind: WalletTxKind;
  label: string;
  description: string;
  amount: number; // + crédit / − débit
  currency: string;
  method: WalletMethod;
  status: WalletTxStatus;
  createdAt: ISODate;
  balanceAfter: number;
  counterpart?: string;
  icon: string;
}

export type WalletStatus = "ACTIVE" | "FROZEN" | "SUSPENDED";

export interface WalletAccount {
  id: Id;
  ownerId: Id;
  ownerName: string;
  ownerAvatar: string;
  role: WalletRole;
  balance: number;
  pending: number;
  currency: string;
  status: WalletStatus;
  dailyLimit: number;
  monthlyIn: number;
  monthlyOut: number;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  createdAt: ISODate;
  transactions: WalletTransaction[];
}

/* ------------------------- Résumés par rôle ------------------------- */
export interface DriverWalletSummary {
  today: number;
  week: number;
  month: number;
  tips: number;
  bonus: number;
  commissions: number;
  adjustments: number;
  withdrawals: number;
  pendingPayout: number;
  deliveries: number;
}

export interface MerchantWalletSummary {
  available: number;
  pending: number;
  sales: number;
  payouts: number;
  refunds: number;
  commissions: number;
  ads: number;
  subscriptions: number;
  netRevenue: number;
}

export interface AdminFinanceOverview {
  totalBalance: number;
  totalPending: number;
  walletsCount: number;
  frozenCount: number;
  volume30d: number;
  flaggedCount: number;
}

export interface PayoutRequest {
  id: Id;
  ref: string;
  ownerName: string;
  role: WalletRole;
  amount: number;
  method: WalletMethod;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: ISODate;
  auto: boolean;
}

/* --------------------------- Cash Management --------------------------- */
export interface CashRegister {
  driverId: Id;
  driverName: string;
  driverAvatar: string;
  balance: number; // caisse actuelle
  collectedToday: number;
  toRemit: number;
  remittedToday: number;
  tips: number;
  commissions: number;
  limit: number; // plafond de caisse
  status: "OK" | "OVER_LIMIT" | "NEGATIVE" | "FROZEN";
}

export type RemittanceMethod = "QR_CODE" | "OTP" | "MANUAL" | "AGENT";
export type RemittanceStatus = "PENDING" | "VALIDATED" | "REJECTED" | "LATE";

export interface CashRemittance {
  id: Id;
  ref: string;
  driverId: Id;
  driverName: string;
  driverAvatar: string;
  amount: number;
  method: RemittanceMethod;
  status: RemittanceStatus;
  createdAt: ISODate;
  validatedAt?: ISODate;
  validatedBy?: string;
  receiptId?: string;
  signature?: boolean;
}

export interface CashReconciliation {
  id: Id;
  date: ISODate;
  driverName: string;
  collected: number;
  declared: number;
  remitted: number;
  electronic: number;
  gap: number; // écart
  status: "BALANCED" | "GAP" | "PENDING";
}

export interface CashDiscrepancy {
  id: Id;
  ref: string;
  driverName: string;
  amount: number;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  createdAt: ISODate;
}

export interface CashDashboard {
  collectedToday: number;
  inCirculation: number;
  remittedToday: number;
  pending: number;
  gapsTotal: number;
  cashPayments: number;
  cashRatio: number; // % cash vs électronique
}
