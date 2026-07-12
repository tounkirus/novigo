"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { WalletBalanceCard, StatTiles, type StatTile } from "@/features/wallet/shared/wallet-ui";
import { TransactionList } from "@/features/wallet/shared/transaction-list";

export default function ProWalletPage() {
  const { toast } = useToast();
  const accountQuery = useQuery({ queryKey: ["pro-wallet"], queryFn: () => api.walletAccount("DRIVER", "pro_me", "Prestataire NOVIGO") });
  const dashQuery = useQuery({ queryKey: ["provider-dashboard"], queryFn: () => api.providerDashboard() });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Portefeuille</h2>
        <p className="text-sm text-muted">Vos gains, retraits et l'historique de vos transactions.</p>
      </div>

      <QueryState query={accountQuery} skeleton={<Skeleton className="h-48 w-full rounded-3xl" />} isEmpty={() => false}>
        {(account) => (
          <WalletBalanceCard
            label="Solde disponible"
            balance={account.balance}
            pending={account.pending}
            pendingLabel="En attente de versement"
            gradient="premium-gradient"
            actions={
              <>
                <Button variant="secondary" size="sm" onClick={() => toast({ title: "Retrait demandé", description: "Vous recevrez votre versement sous 24h.", tone: "success" })}>
                  <ArrowUpFromLine className="h-4 w-4" /> Retirer
                </Button>
                <Button variant="secondary" size="sm" onClick={() => toast({ title: "Rechargement", description: "Choisissez un moyen de paiement.", tone: "info" })}>
                  <ArrowDownToLine className="h-4 w-4" /> Recharger
                </Button>
              </>
            }
          />
        )}
      </QueryState>

      <QueryState query={dashQuery} skeleton={<Skeleton className="h-24 w-full rounded-2xl" />} isEmpty={() => false}>
        {(d) => {
          const tiles: StatTile[] = [
            { label: "Revenus du mois", value: d.monthRevenue, money: true, icon: "TrendingUp", tone: "success" },
            { label: "Cette semaine", value: d.weekRevenue, money: true, icon: "Wallet", tone: "brand" },
            { label: "Missions", value: d.weekJobs, icon: "Briefcase", tone: "info" },
            { label: "Clients fidèles", value: `${d.repeatRate}%`, icon: "Repeat", tone: "warning" },
          ];
          return <StatTiles items={tiles} />;
        }}
      </QueryState>

      <QueryState query={accountQuery} skeleton={<Skeleton className="h-96 w-full rounded-2xl" />} isEmpty={() => false}>
        {(account) => <TransactionList transactions={account.transactions} title="Mes transactions" />}
      </QueryState>
    </div>
  );
}
