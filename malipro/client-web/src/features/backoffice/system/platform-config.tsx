"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Percent, Wallet, CreditCard, Save, Minus, Plus } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import type { CommissionRule, WalletLimit, PaymentProvider } from "@/types/backoffice";
import { formatFcfa, cn } from "@/lib/utils";

export function PlatformConfigTab() {
  const commissionsQ = useQuery({ queryKey: ["commissionRules"], queryFn: () => api.commissionRules() });
  const limitsQ = useQuery({ queryKey: ["walletLimits"], queryFn: () => api.walletLimits() });
  const providersQ = useQuery({ queryKey: ["paymentProviders"], queryFn: () => api.paymentProviders() });

  return (
    <div className="space-y-6">
      <QueryState query={commissionsQ} skeleton={<Skeleton className="h-64 w-full rounded-2xl" />} isEmpty={(d) => d.length === 0}>
        {(rules) => <CommissionsCard rules={rules} />}
      </QueryState>

      <QueryState query={limitsQ} skeleton={<Skeleton className="h-56 w-full rounded-2xl" />} isEmpty={(d) => d.length === 0}>
        {(limits) => <LimitsCard limits={limits} />}
      </QueryState>

      <QueryState query={providersQ} skeleton={<Skeleton className="h-64 w-full rounded-2xl" />} isEmpty={(d) => d.length === 0}>
        {(providers) => <ProvidersCard providers={providers} />}
      </QueryState>
    </div>
  );
}

function CommissionsCard({ rules }: { rules: CommissionRule[] }) {
  const { toast } = useToast();
  const [rates, setRates] = React.useState<Record<string, number>>(() => Object.fromEntries(rules.map((r) => [r.id, r.rate])));
  const [active, setActive] = React.useState<Record<string, boolean>>(() => Object.fromEntries(rules.map((r) => [r.id, r.active])));

  const bump = (id: string, d: number) => setRates((p) => ({ ...p, [id]: Math.max(0, Math.min(40, +(p[id] + d).toFixed(1))) }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Percent className="h-4 w-4 text-brand" /> Commissions par verticale</CardTitle>
          <CardDescription>Taux prélevé par NOVIGO sur chaque transaction.</CardDescription>
        </div>
        <Button size="sm" onClick={() => toast({ title: "Commissions enregistrées", tone: "success" })}><Save className="h-4 w-4" /> Enregistrer</Button>
      </CardHeader>
      <div className="divide-y divide-line border-t border-line">
        {rules.map((r) => (
          <div key={r.id} className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", !active[r.id] && "opacity-55")}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name={r.icon} className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{r.vertical}</p>
              <p className="text-[12px] text-muted">Frais minimum : {formatFcfa(r.minFee)}</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-0.5">
              <button onClick={() => bump(r.id, -0.5)} className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-shell" aria-label="Diminuer"><Minus className="h-4 w-4" /></button>
              <span className="min-w-14 text-center text-sm font-bold tabular-nums text-ink">{rates[r.id]}%</span>
              <button onClick={() => bump(r.id, 0.5)} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark" aria-label="Augmenter"><Plus className="h-4 w-4" /></button>
            </div>
            <Switch checked={active[r.id]} onCheckedChange={(v) => setActive((p) => ({ ...p, [r.id]: v }))} aria-label={`Activer ${r.vertical}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function LimitsCard({ limits }: { limits: WalletLimit[] }) {
  const columns: Column<WalletLimit>[] = [
    { key: "role", header: "Rôle", cell: (r) => <span className="font-semibold text-ink">{r.role}</span> },
    { key: "daily", header: "Plafond / jour", align: "right", cell: (r) => <span className="tabular-nums">{formatFcfa(r.dailyMax)}</span> },
    { key: "monthly", header: "Plafond / mois", align: "right", cell: (r) => <span className="tabular-nums">{formatFcfa(r.monthlyMax)}</span> },
    { key: "payout", header: "Retrait min.", align: "right", cell: (r) => <span className="tabular-nums text-muted">{formatFcfa(r.minPayout)}</span> },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Wallet className="h-4 w-4 text-brand" />
        <h3 className="text-base font-semibold text-ink">Plafonds portefeuille</h3>
      </div>
      <DataTable columns={columns} rows={limits} getRowKey={(r) => r.id} minWidth={560} />
    </div>
  );
}

function ProvidersCard({ providers }: { providers: PaymentProvider[] }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() => Object.fromEntries(providers.map((p) => [p.id, p.enabled])));

  const toggle = (p: PaymentProvider, v: boolean) => {
    setEnabled((prev) => ({ ...prev, [p.id]: v }));
    toast({ title: v ? `${p.name} activé` : `${p.name} désactivé`, tone: v ? "success" : "info" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-brand" /> Fournisseurs de paiement</CardTitle>
        <CardDescription>Activez les passerelles et ajustez les frais applicables.</CardDescription>
      </CardHeader>
      <div className="divide-y divide-line border-t border-line">
        {providers.map((p) => (
          <div key={p.id} className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", !enabled[p.id] && "opacity-55")}>
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-shell", p.color)}><Icon name={p.icon} className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{p.name}</p>
              <p className="text-[12px] text-muted">Frais {p.fee}% · {p.successRate}% de succès</p>
            </div>
            <Badge tone={p.status === "OPERATIONAL" ? "success" : p.status === "DEGRADED" ? "warning" : "error"}>
              {p.status === "OPERATIONAL" ? "Opérationnel" : p.status === "DEGRADED" ? "Dégradé" : "HS"}
            </Badge>
            <Switch checked={enabled[p.id]} onCheckedChange={(v) => toggle(p, v)} aria-label={`Activer ${p.name}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}
