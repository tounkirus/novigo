"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Wallet } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Reveal } from "@/components/ui/reveal";
import { WalletBalanceCard, StatTiles, type StatTile } from "@/features/wallet/shared/wallet-ui";
import { cn, formatFcfa, clamp } from "@/lib/utils";
import type { CashRegister } from "@/types/wallet";
import { RemittanceFlow } from "@/features/cash/driver/remittance-flow";
import { RemittanceHistory } from "@/features/cash/driver/remittance-history";

const STATUS_ALERT: Record<
  Exclude<CashRegister["status"], "OK">,
  { label: string; tone: "error" | "warning" | "neutral"; message: string }
> = {
  OVER_LIMIT: {
    label: "Plafond dépassé",
    tone: "error",
    message: "Votre caisse dépasse le plafond autorisé. Effectuez une remise sans délai.",
  },
  NEGATIVE: {
    label: "Solde négatif",
    tone: "error",
    message: "Votre solde de caisse est négatif. Contactez le support NOVIGO.",
  },
  FROZEN: {
    label: "Caisse gelée",
    tone: "neutral",
    message: "Votre caisse est temporairement gelée. Les remises sont suspendues.",
  },
};

function CashSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

function CashOverview({ register }: { register: CashRegister }) {
  const progress = clamp((register.balance / register.limit) * 100, 0, 100);
  const alert = register.status !== "OK" ? STATUS_ALERT[register.status] : null;

  const tiles: StatTile[] = [
    { label: "Encaissé aujourd'hui", value: register.collectedToday, icon: "Banknote", tone: "success", money: true },
    { label: "Remis aujourd'hui", value: register.remittedToday, icon: "Undo2", tone: "info", money: true },
    { label: "À reverser", value: register.toRemit, icon: "Wallet", tone: "warning", money: true },
    { label: "Pourboires", value: register.tips, icon: "Gift", tone: "brand", money: true },
    { label: "Commissions", value: register.commissions, icon: "Percent", tone: "neutral", money: true },
    { label: "Plafond de caisse", value: register.limit, icon: "Gauge", tone: "info", money: true },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <WalletBalanceCard
          label="Espèces en caisse"
          balance={register.balance}
          pending={register.toRemit}
          pendingLabel="À reverser"
          gradient="premium-gradient"
          actions={<RemittanceFlow toRemit={register.toRemit} />}
        />
      </Reveal>

      {alert && (
        <Reveal>
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 shadow-card",
              alert.tone === "error"
                ? "border-error/30 bg-error-soft"
                : "border-line bg-shell",
            )}
          >
            <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", alert.tone === "error" ? "text-error" : "text-muted")} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={alert.tone}>{alert.label}</Badge>
              </div>
              <p className="mt-1.5 text-[13px] text-ink">{alert.message}</p>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <StatTiles items={tiles} cols={3} />
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-ink">Remplissage de la caisse</span>
            </div>
            <span className="text-[13px] text-muted">
              {formatFcfa(register.balance)} / {formatFcfa(register.limit)}
            </span>
          </div>
          <Progress
            value={progress}
            className={cn("mt-3 h-2.5", register.status === "OVER_LIMIT" && "[&>div]:bg-error")}
          />
          <p className="mt-2 text-[12px] text-muted">
            {register.status === "OK"
              ? `Il reste ${formatFcfa(Math.max(0, register.limit - register.balance))} avant le plafond.`
              : "Plafond atteint — reversez vos espèces pour continuer à encaisser."}
          </p>
        </Card>
      </Reveal>
    </div>
  );
}

export default function DriverCashPage() {
  const registerQuery = useQuery({ queryKey: ["cashRegister"], queryFn: () => api.cashRegister() });
  const remittancesQuery = useQuery({ queryKey: ["cashRemittances"], queryFn: () => api.cashRemittances() });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Ma caisse</h2>
        <p className="text-sm text-muted">Gérez vos espèces encaissées et vos reversements à NOVIGO.</p>
      </div>

      <QueryState query={registerQuery} skeleton={<CashSkeleton />}>
        {(register) => <CashOverview register={register} />}
      </QueryState>

      <div className="flex items-start gap-3 rounded-2xl border border-info/30 bg-info-soft p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-info" />
        <p className="text-[13px] text-ink">
          <span className="font-semibold">Reversez vos espèces sous 48h</span> pour éviter les écarts de caisse et les
          pénalités.
        </p>
      </div>

      <QueryState
        query={remittancesQuery}
        skeleton={<TableSkeleton rows={6} cols={7} />}
        isEmpty={(d) => d.length === 0}
      >
        {(remittances) => <RemittanceHistory remittances={remittances} />}
      </QueryState>
    </div>
  );
}
