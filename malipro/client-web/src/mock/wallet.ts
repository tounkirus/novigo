import type {
  WalletAccount, WalletTransaction, WalletTxKind, WalletMethod, WalletRole, WalletStatus,
  DriverWalletSummary, MerchantWalletSummary, AdminFinanceOverview, PayoutRequest,
} from "@/types/wallet";
import { NOW } from "@/constants";
import { Rng, seededRng, hashString } from "./rng";
import { avatar } from "./images";
import { fullName } from "./generators";

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

const METHODS: WalletMethod[] = ["ORANGE_MONEY", "MOOV_MONEY", "WAVE", "VISA", "MASTERCARD", "CASH", "BANK_TRANSFER", "WALLET", "QR_CODE"];

const KIND_META: Record<WalletTxKind, { icon: string; sign: 1 | -1; label: string }> = {
  CREDIT: { icon: "Plus", sign: 1, label: "Crédit" },
  DEBIT: { icon: "Minus", sign: -1, label: "Débit" },
  PAYMENT: { icon: "ShoppingBag", sign: -1, label: "Paiement commande" },
  WITHDRAWAL: { icon: "ArrowUpFromLine", sign: -1, label: "Retrait" },
  REFUND: { icon: "Undo2", sign: 1, label: "Remboursement" },
  BONUS: { icon: "Gift", sign: 1, label: "Bonus" },
  REFERRAL: { icon: "Users", sign: 1, label: "Parrainage" },
  CASHBACK: { icon: "BadgePercent", sign: 1, label: "Cashback" },
  COMMISSION: { icon: "Percent", sign: -1, label: "Commission NOVIGO" },
  ADJUSTMENT: { icon: "Sliders", sign: 1, label: "Ajustement" },
  CANCELLATION: { icon: "XCircle", sign: 1, label: "Annulation" },
  TIP: { icon: "HandCoins", sign: 1, label: "Pourboire" },
  PAYOUT: { icon: "Banknote", sign: -1, label: "Reversement" },
  TOPUP: { icon: "ArrowDownToLine", sign: 1, label: "Rechargement" },
  TRANSFER: { icon: "ArrowLeftRight", sign: -1, label: "Transfert" },
  SALE: { icon: "Receipt", sign: 1, label: "Vente" },
  AD_SPEND: { icon: "Megaphone", sign: -1, label: "Publicité" },
  SUBSCRIPTION: { icon: "Crown", sign: -1, label: "Abonnement" },
};

const ROLE_KINDS: Record<WalletRole, WalletTxKind[]> = {
  CLIENT: ["TOPUP", "PAYMENT", "REFUND", "CASHBACK", "BONUS", "REFERRAL", "TRANSFER", "WITHDRAWAL"],
  DRIVER: ["PAYOUT", "TIP", "BONUS", "COMMISSION", "ADJUSTMENT", "WITHDRAWAL", "CREDIT"],
  MERCHANT: ["SALE", "PAYOUT", "COMMISSION", "REFUND", "AD_SPEND", "SUBSCRIPTION", "ADJUSTMENT"],
  ADMIN: ["CREDIT", "DEBIT", "REFUND", "ADJUSTMENT", "PAYOUT", "COMMISSION"],
};

function amountFor(kind: WalletTxKind, role: WalletRole, rng: Rng): number {
  const ranges: Partial<Record<WalletTxKind, [number, number]>> = {
    SALE: [1500, 45000], PAYOUT: [10000, 250000], PAYMENT: [1000, 25000],
    TIP: [200, 3000], BONUS: [500, 10000], COMMISSION: [200, 8000],
    TOPUP: [1000, 50000], WITHDRAWAL: [5000, 150000], REFUND: [1000, 20000],
    CASHBACK: [100, 2500], AD_SPEND: [5000, 100000], SUBSCRIPTION: [2500, 24000],
  };
  const [lo, hi] = ranges[kind] ?? (role === "ADMIN" ? [10000, 500000] : [500, 20000]);
  return Math.round(rng.int(lo, hi) / 50) * 50;
}

export function generateTransactions(
  seed: number, role: WalletRole, count: number, startBalance: number,
): WalletTransaction[] {
  const rng = seededRng(seed, 91);
  const kinds = ROLE_KINDS[role];
  let balance = startBalance;
  const txs: WalletTransaction[] = [];
  for (let i = 0; i < count; i++) {
    const kind = rng.pick(kinds);
    const meta = KIND_META[kind];
    const amount = meta.sign * amountFor(kind, role, rng);
    const status = i === 0 && rng.bool(0.15) ? "PENDING" : rng.bool(0.02) ? "FAILED" : "COMPLETED";
    txs.push({
      id: `wtx_${role.toLowerCase()}_${seed}_${i}`,
      ref: `TX-${(hashString(`${seed}-${i}`) % 1_000_000).toString().padStart(6, "0")}`,
      kind,
      label: meta.label,
      description: describeTx(kind, rng),
      amount,
      currency: "FCFA",
      method: kind === "TIP" || kind === "PAYMENT" ? rng.pick(METHODS) : rng.pick(METHODS),
      status,
      createdAt: iso(i * 5_400_000 + rng.int(0, 3_000_000)),
      balanceAfter: balance,
      counterpart: counterpartFor(kind, rng),
      icon: meta.icon,
    });
    if (status === "COMPLETED") balance -= amount;
  }
  return txs;
}

function describeTx(kind: WalletTxKind, rng: Rng): string {
  const map: Partial<Record<WalletTxKind, string[]>> = {
    SALE: ["Vente en ligne", "Commande livrée", "Vente au comptoir"],
    PAYOUT: ["Reversement hebdomadaire", "Virement Orange Money", "Reversement bancaire"],
    PAYMENT: ["Commande Chez Fatou", "Commande Supermarché Fasokan", "Course taxi"],
    TIP: ["Pourboire client", "Pourboire livraison rapide"],
    COMMISSION: ["Commission plateforme 15%", "Frais de service"],
    BONUS: ["Bonus de performance", "Bonus week-end", "Objectif atteint"],
    WITHDRAWAL: ["Retrait Orange Money", "Retrait Wave", "Retrait bancaire"],
    REFUND: ["Remboursement commande annulée", "Geste commercial"],
    AD_SPEND: ["Campagne Menu du midi", "Produit sponsorisé"],
    SUBSCRIPTION: ["Abonnement Premium", "Boost vitrine"],
  };
  return rng.pick(map[kind] ?? ["Opération portefeuille"]);
}

function counterpartFor(kind: WalletTxKind, rng: Rng): string | undefined {
  if (["TRANSFER", "TIP", "REFERRAL"].includes(kind)) return fullName(rng).name;
  if (["SALE", "PAYMENT"].includes(kind)) return rng.pick(["Chez Fatou", "Le Balafon", "Supermarché Fasokan", "Pharmacie Centrale"]);
  return undefined;
}

export function generateWalletAccount(
  role: WalletRole, ownerId: string, ownerName: string, opts?: { balance?: number; status?: WalletStatus },
): WalletAccount {
  const seed = hashString(ownerId);
  const rng = seededRng(seed, 3);
  const balance = opts?.balance ?? (role === "MERCHANT" ? rng.int(50000, 2_500_000) : role === "DRIVER" ? rng.int(5000, 350000) : rng.int(2000, 120000));
  const txs = generateTransactions(seed, role, 30, balance);
  return {
    id: `wallet_${ownerId}`,
    ownerId,
    ownerName,
    ownerAvatar: avatar(ownerName),
    role,
    balance,
    pending: rng.int(0, role === "MERCHANT" ? 400000 : 40000),
    currency: "FCFA",
    status: opts?.status ?? (rng.bool(0.04) ? "FROZEN" : "ACTIVE"),
    dailyLimit: role === "MERCHANT" ? 5_000_000 : 1_000_000,
    monthlyIn: txs.filter((t) => t.amount > 0 && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0),
    monthlyOut: txs.filter((t) => t.amount < 0 && t.status === "COMPLETED").reduce((s, t) => s - t.amount, 0),
    pinEnabled: rng.bool(0.7),
    biometricEnabled: rng.bool(0.4),
    createdAt: iso(rng.int(60, 720) * 86_400_000),
    transactions: txs,
  };
}

export function generateDriverWalletSummary(seed = 7): DriverWalletSummary {
  const rng = seededRng(seed, 21);
  const today = rng.int(8000, 45000);
  return {
    today,
    week: today * rng.int(5, 7),
    month: today * rng.int(22, 28),
    tips: rng.int(3000, 25000),
    bonus: rng.int(5000, 40000),
    commissions: rng.int(15000, 90000),
    adjustments: rng.int(-5000, 8000),
    withdrawals: rng.int(50000, 300000),
    pendingPayout: rng.int(0, 60000),
    deliveries: rng.int(120, 620),
  };
}

export function generateMerchantWalletSummary(seed = 11): MerchantWalletSummary {
  const rng = seededRng(seed, 31);
  const sales = rng.int(800000, 6_500_000);
  const commissions = Math.round(sales * 0.15);
  const ads = rng.int(20000, 250000);
  const subscriptions = rng.pick([0, 2500, 24000]);
  const refunds = rng.int(10000, 180000);
  return {
    available: rng.int(150000, 2_800_000),
    pending: rng.int(50000, 900000),
    sales,
    payouts: rng.int(400000, 4_000_000),
    refunds,
    commissions,
    ads,
    subscriptions,
    netRevenue: sales - commissions - refunds - ads - subscriptions,
  };
}

export function generateAdminFinanceOverview(): AdminFinanceOverview {
  return {
    totalBalance: 486_500_000,
    totalPending: 42_300_000,
    walletsCount: 6600,
    frozenCount: 37,
    volume30d: 1_284_000_000,
    flaggedCount: 12,
  };
}

/** Comptes wallet pour l'administration (liste paginable). */
export function generateWalletAccounts(count = 60): WalletAccount[] {
  const roles: WalletRole[] = ["CLIENT", "CLIENT", "CLIENT", "DRIVER", "MERCHANT"];
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(20240, i);
    const p = fullName(rng);
    const role = rng.pick(roles);
    return generateWalletAccount(role, `owner_${i}`, p.name, {
      status: i % 17 === 0 ? "FROZEN" : "ACTIVE",
    });
  });
}

export function generatePayoutRequests(count = 24): PayoutRequest[] {
  const roles: WalletRole[] = ["DRIVER", "MERCHANT"];
  const methods: WalletMethod[] = ["ORANGE_MONEY", "WAVE", "MOOV_MONEY", "BANK_TRANSFER"];
  const st = ["PENDING", "APPROVED", "PAID", "REJECTED"] as const;
  return Array.from({ length: count }, (_, i) => {
    const rng = seededRng(50501, i);
    const p = fullName(rng);
    const role = rng.pick(roles);
    return {
      id: `payout_${i}`,
      ref: `PO-${rng.int(10000, 99999)}`,
      ownerName: p.name,
      role,
      amount: role === "MERCHANT" ? rng.int(100000, 3_000_000) : rng.int(20000, 300000),
      method: rng.pick(methods),
      status: i < 5 ? "PENDING" : rng.pick(st),
      createdAt: iso(i * 3_600_000 + rng.int(0, 2_000_000)),
      auto: rng.bool(0.5),
    };
  });
}

export { KIND_META, METHODS };
