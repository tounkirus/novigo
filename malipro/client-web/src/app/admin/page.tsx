"use client";

import * as React from "react";
import Image from "next/image";
import { Store as StoreIcon, Bike, Users, ShoppingBag, Wallet } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { AreaTrend, BarSeries, DonutChart, PIE_COLORS } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { topRatedStores, revenueSeries, hourlySeries, categoryShare } from "@/mock";
import { DATASET_TARGETS, STORE_CATEGORY_LABEL, ORDER_STATUS } from "@/constants";
import type { OrderStatus } from "@/types";
import { formatCompact } from "@/lib/utils";

const STATUS_COUNTS: { status: OrderStatus; count: number }[] = [
  { status: "DELIVERED", count: 24200 },
  { status: "DELIVERING", count: 1450 },
  { status: "PREPARING", count: 1100 },
  { status: "PENDING", count: 900 },
  { status: "READY", count: 800 },
  { status: "CONFIRMED", count: 700 },
  { status: "CANCELLED", count: 350 },
  { status: "REFUNDED", count: 150 },
];

export default function AdminOverviewPage() {
  const revenue = React.useMemo(() => revenueSeries(30, 2), []);
  const hourly = React.useMemo(() => hourlySeries(17), []);
  const share = React.useMemo(() => categoryShare(), []);
  const leaders = React.useMemo(() => topRatedStores(8), []);
  const maxStatus = Math.max(...STATUS_COUNTS.map((s) => s.count));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Vue d'ensemble de la plateforme</h2>
        <p className="text-sm text-muted">Indicateurs clés de NOVIGO à Bamako.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Commerçants" value={formatCompact(DATASET_TARGETS.merchants)} delta={5} hint="partenaires actifs" icon={<StoreIcon className="h-5 w-5" />} />
        <KpiCard label="Livreurs" value={formatCompact(DATASET_TARGETS.drivers)} delta={8} hint="flotte" icon={<Bike className="h-5 w-5" />} />
        <KpiCard label="Clients" value={formatCompact(DATASET_TARGETS.customers)} delta={12} hint="inscrits" icon={<Users className="h-5 w-5" />} />
        <KpiCard label="Commandes" value={formatCompact(DATASET_TARGETS.orders)} delta={9} hint="cumulées" icon={<ShoppingBag className="h-5 w-5" />} />
        <KpiCard label="Revenus estimés" value={`${formatCompact(360_000_000)} FCFA`} delta={11} hint="ce mois" icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenus plateforme (30 jours)</CardTitle>
            <CardDescription>Volume d'affaires quotidien tous commerces confondus.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <AreaTrend data={revenue} height={260} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
            <CardDescription>Commerces par famille.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-2">
            <DonutChart data={share} height={200} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pb-5">
            {share.map((s, i) => (
              <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {s.label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume horaire des commandes</CardTitle>
          <CardDescription>Activité de la plateforme sur 24 h.</CardDescription>
        </CardHeader>
        <div className="px-2 pb-4">
          <BarSeries data={hourly} height={220} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meilleurs commerces</CardTitle>
            <CardDescription>Classement par note et volume.</CardDescription>
          </CardHeader>
          <div className="divide-y divide-line border-t border-line">
            {leaders.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-5 text-center text-sm font-black text-muted">{i + 1}</span>
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-shell">
                  <Image src={s.logo} alt={s.name} fill sizes="40px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
                  <p className="text-[12px] text-muted">{STORE_CATEGORY_LABEL[s.category]} · {s.district}</p>
                </div>
                <Rating value={s.rating} />
                <span className="hidden w-24 text-right text-sm font-bold text-ink sm:block">{formatCompact(s.orderCount)} cmd</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
            <CardDescription>Répartition globale.</CardDescription>
          </CardHeader>
          <div className="space-y-3 p-5 pt-0">
            {STATUS_COUNTS.map((s) => (
              <div key={s.status}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <Badge tone={ORDER_STATUS[s.status].tone}>{ORDER_STATUS[s.status].label}</Badge>
                  <span className="font-semibold text-ink">{formatCompact(s.count)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
