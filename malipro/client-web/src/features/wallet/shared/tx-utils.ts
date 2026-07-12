import type { WalletTransaction, WalletTxKind, WalletTxStatus, WalletMethod } from "@/types/wallet";
import { formatFcfa, formatDate, formatTime } from "@/lib/utils";

export const KIND_LABEL: Record<WalletTxKind, string> = {
  CREDIT: "Crédit", DEBIT: "Débit", PAYMENT: "Paiement", WITHDRAWAL: "Retrait", REFUND: "Remboursement",
  BONUS: "Bonus", REFERRAL: "Parrainage", CASHBACK: "Cashback", COMMISSION: "Commission", ADJUSTMENT: "Ajustement",
  CANCELLATION: "Annulation", TIP: "Pourboire", PAYOUT: "Reversement", TOPUP: "Rechargement", TRANSFER: "Transfert",
  SALE: "Vente", AD_SPEND: "Publicité", SUBSCRIPTION: "Abonnement",
};

export const STATUS_META: Record<WalletTxStatus, { label: string; tone: "success" | "warning" | "error" | "neutral" }> = {
  COMPLETED: { label: "Réussie", tone: "success" },
  PENDING: { label: "En attente", tone: "warning" },
  FAILED: { label: "Échouée", tone: "error" },
  REVERSED: { label: "Annulée", tone: "neutral" },
};

export const METHOD_LABEL: Record<WalletMethod, string> = {
  ORANGE_MONEY: "Orange Money", MOOV_MONEY: "Moov Money", WAVE: "Wave", VISA: "Visa", MASTERCARD: "Mastercard",
  CASH: "Espèces", BANK_TRANSFER: "Virement", WALLET: "Wallet NOVIGO", QR_CODE: "QR Code",
};

/** Familles de filtres pour les transactions. */
export const TX_FILTERS: { value: "ALL" | "IN" | "OUT" | WalletTxKind; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "IN", label: "Entrées" },
  { value: "OUT", label: "Sorties" },
];

export function matchesFilter(tx: WalletTransaction, filter: string): boolean {
  if (filter === "ALL") return true;
  if (filter === "IN") return tx.amount > 0;
  if (filter === "OUT") return tx.amount < 0;
  return tx.kind === filter;
}

/** Construit un CSV à partir des transactions. */
export function transactionsToCsv(txs: WalletTransaction[]): string {
  const header = ["Référence", "Date", "Heure", "Type", "Description", "Montant (FCFA)", "Statut", "Moyen"];
  const rows = txs.map((t) => [
    t.ref,
    formatDate(t.createdAt),
    formatTime(t.createdAt),
    KIND_LABEL[t.kind],
    `"${t.description.replace(/"/g, "'")}"`,
    String(t.amount),
    STATUS_META[t.status].label,
    METHOD_LABEL[t.method],
  ]);
  return [header, ...rows].map((r) => r.join(";")).join("\n");
}

/** Déclenche le téléchargement d'un fichier texte (CSV) côté navigateur. */
export function downloadFile(content: string, filename: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Texte de reçu (aperçu / base d'un futur PDF). */
export function receiptText(tx: WalletTransaction): string {
  return [
    "NOVIGO — Reçu de transaction",
    "================================",
    `Référence : ${tx.ref}`,
    `Date : ${formatDate(tx.createdAt)} à ${formatTime(tx.createdAt)}`,
    `Type : ${KIND_LABEL[tx.kind]}`,
    `Description : ${tx.description}`,
    `Montant : ${formatFcfa(tx.amount)}`,
    `Moyen : ${METHOD_LABEL[tx.method]}`,
    `Statut : ${STATUS_META[tx.status].label}`,
    "================================",
    "Merci d'utiliser NOVIGO.",
  ].join("\n");
}
