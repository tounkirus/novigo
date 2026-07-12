"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Gift, Receipt, Smartphone, Award } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { Reveal } from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/ui/skeletons";
import { WalletBalanceCard } from "@/features/wallet/balance-card";
import { WalletTransactions } from "@/features/wallet/transactions";
import { formatFcfa } from "@/lib/utils";

const QUICK_ACTIONS: { href: string; label: string; icon: string }[] = [
  { href: "/bills", label: "Factures", icon: "Receipt" },
  { href: "/recharge", label: "Recharge", icon: "Smartphone" },
  { href: "/loyalty", label: "Fidélité", icon: "Award" },
];

function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
      <div className="rounded-2xl border border-line bg-surface px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const query = useQuery({ queryKey: ["wallet"], queryFn: () => api.wallet() });

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-ink">Portefeuille</h1>

      <QueryState query={query} skeleton={<WalletSkeleton />}>
        {(wallet) => (
          <div className="space-y-6">
            <Reveal>
              <WalletBalanceCard balance={wallet.balance} />
            </Reveal>

            <Reveal delay={0.05}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard
                  label="Entrées du mois"
                  value={formatFcfa(wallet.monthlyIn)}
                  icon={<ArrowDownToLine className="h-5 w-5" />}
                  hint="Crédits reçus"
                />
                <KpiCard
                  label="Sorties du mois"
                  value={formatFcfa(wallet.monthlyOut)}
                  icon={<ArrowUpFromLine className="h-5 w-5" />}
                  hint="Dépenses"
                />
                <KpiCard
                  label="Cashback"
                  value={formatFcfa(wallet.cashback)}
                  icon={<Gift className="h-5 w-5" />}
                  hint="Gagné ce mois"
                />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3.5 text-center shadow-card transition hover:bg-shell active:scale-95"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      {a.icon === "Receipt" && <Receipt className="h-5 w-5" />}
                      {a.icon === "Smartphone" && <Smartphone className="h-5 w-5" />}
                      {a.icon === "Award" && <Award className="h-5 w-5" />}
                    </span>
                    <span className="text-[12px] font-semibold text-ink">{a.label}</span>
                  </Link>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <WalletTransactions transactions={wallet.transactions} />
            </Reveal>
          </div>
        )}
      </QueryState>
    </div>
  );
}
