import type { Money } from "./api/types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatMoney(m?: Money | null): string {
  if (!m) return "—";
  return `${fcfa.format(m.amount)} FCFA`;
}

export function formatNumber(n?: number | null): string {
  if (n === undefined || n === null) return "—";
  return fcfa.format(n);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function initials(first?: string | null, last?: string | null, phone?: string): string {
  const a = (first?.[0] ?? "").toUpperCase();
  const b = (last?.[0] ?? "").toUpperCase();
  if (a || b) return `${a}${b}`;
  return phone?.slice(-2) ?? "??";
}
