"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users, Store, Bike, Wrench, Wallet, ShoppingBag, Activity, ShieldAlert, MapPin, Database,
} from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/mock/api";
import type { ServiceZone, PaymentProvider } from "@/types/backoffice";
import { formatFcfa, formatCompact, cn } from "@/lib/utils";

const ZONE_META: Record<ServiceZone["status"], { label: string; tone: "success" | "warning" | "neutral" }> = {
  ACTIVE: { label: "Active", tone: "success" },
  PILOT: { label: "Pilote", tone: "warning" },
  PAUSED: { label: "En pause", tone: "neutral" },
};
const PROV_META: Record<PaymentProvider["status"], { tone: "success" | "warning" | "error"; dot: string }> = {
  OPERATIONAL: { tone: "success", dot: "bg-success" },
  DEGRADED: { tone: "warning", dot: "bg-warning" },
  DOWN: { tone: "error", dot: "bg-error" },
};

export function CommandCenterTab() {
  const overviewQ = useQuery({ queryKey: ["platformOverview"], queryFn: () => api.platformOverview() });
  const zonesQ = useQuery({ queryKey: ["serviceZones"], queryFn: () => api.serviceZones() });
  const providersQ = useQuery({ queryKey: ["paymentProviders"], queryFn: () => api.paymentProviders() });
  const volumesQ = useQuery({ queryKey: ["datasetVolumes"], queryFn: () => api.datasetVolumes() });

  return (
    <div className="space-y-6">
      <QueryState query={overviewQ} skeleton={<KpiRowSkeleton count={4} />} isEmpty={() => false}>
        {(o) => (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <KpiCard label="Utilisateurs" value={formatCompact(o.users)} hint="comptes actifs" icon={<Users className="h-5 w-5" />} />
              <KpiCard label="GMV (30 j)" value={formatFcfa(o.gmv30d)} delta={9} hint="volume plateforme" icon={<Wallet className="h-5 w-5" />} tone="success" />
              <KpiCard label="Commandes du jour" value={formatCompact(o.ordersToday)} delta={4} hint={`${formatCompact(o.txToday)} transactions`} icon={<ShoppingBag className="h-5 w-5" />} tone="info" />
              <KpiCard label="Disponibilité" value={`${o.uptime}%`} hint={o.openIncidents ? `${o.openIncidents} incident(s)` : "aucun incident"} icon={<Activity className="h-5 w-5" />} tone={o.openIncidents ? "warning" : "success"} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <MiniStat icon={Store} label="Commerçants" value={formatCompact(o.merchants)} />
              <MiniStat icon={Bike} label="Livreurs" value={formatCompact(o.drivers)} />
              <MiniStat icon={Wrench} label="Prestataires" value={formatCompact(o.providers)} />
              <MiniStat icon={ShieldAlert} label="KYC en attente" value={String(o.pendingKyc)} tone="warning" />
            </div>
          </>
        )}
      </QueryState>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" /> Zones de service</CardTitle>
            <CardDescription>Couverture opérationnelle par quartier de Bamako.</CardDescription>
          </CardHeader>
          <QueryState query={zonesQ} skeleton={<div className="p-4"><Skeleton className="h-40 w-full rounded-xl" /></div>} isEmpty={(d) => d.length === 0}>
            {(zones) => (
              <div className="max-h-80 divide-y divide-line overflow-y-auto border-t border-line">
                {zones.map((z) => (
                  <div key={z.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{z.name}</p>
                      <p className="text-[12px] text-muted">{z.drivers} livreurs · {z.merchants} commerçants · {formatCompact(z.orders30d)} cmd/30j</p>
                    </div>
                    <div className="hidden w-24 items-center gap-2 sm:flex">
                      <Progress value={z.coverage} />
                    </div>
                    <Badge tone={ZONE_META[z.status].tone}>{ZONE_META[z.status].label}</Badge>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4 text-brand" /> Fournisseurs de paiement</CardTitle>
            <CardDescription>Santé et volume des passerelles branchées.</CardDescription>
          </CardHeader>
          <QueryState query={providersQ} skeleton={<div className="p-4"><Skeleton className="h-40 w-full rounded-xl" /></div>} isEmpty={(d) => d.length === 0}>
            {(providers) => (
              <div className="divide-y divide-line border-t border-line">
                {providers.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-shell", p.color)}>
                      <Icon name={p.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-[12px] text-muted">{p.successRate}% succès · {formatFcfa(p.volume30d)}/30j</p>
                    </div>
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", PROV_META[p.status].dot)} />
                      {!p.enabled && <Badge tone="neutral">Off</Badge>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4 text-brand" /> Volumétrie du jeu de démonstration</CardTitle>
          <CardDescription>Échelle des données de démo générées (déterministes, paginées).</CardDescription>
        </CardHeader>
        <QueryState query={volumesQ} skeleton={<div className="p-4"><Skeleton className="h-40 w-full rounded-xl" /></div>} isEmpty={(d) => d.length === 0}>
          {(groups) => (
            <div className="grid grid-cols-1 gap-4 border-t border-line p-5 sm:grid-cols-3">
              {groups.map((g) => (
                <div key={g.group}>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Icon name={g.icon} className="h-4 w-4 text-brand" /> {g.group}
                  </p>
                  <div className="space-y-1.5">
                    {g.items.map((it) => (
                      <div key={it.label} className="flex items-center justify-between text-[13px]">
                        <span className="text-muted">{it.label}</span>
                        <span className="font-bold tabular-nums text-ink">{it.value.toLocaleString("fr-FR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </Card>
    </div>
  );
}

function MiniStat({ icon: Ico, label, value, tone = "brand" }: { icon: typeof Users; label: string; value: string; tone?: "brand" | "warning" }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone === "warning" ? "bg-warning-soft text-warning" : "bg-brand-soft text-brand")}>
        <Ico className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-bold tracking-tight text-ink">{value}</p>
        <p className="text-[12px] text-muted">{label}</p>
      </div>
    </Card>
  );
}
