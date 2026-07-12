"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Wallet, Repeat, Smile } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DonutChart, BarSeries, PIE_COLORS } from "@/components/ui/charts";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton, ChartSkeleton } from "@/components/ui/skeletons";
import { api } from "@/mock/api";
import { formatFcfa, formatCompact } from "@/lib/utils";
import { SEGMENT_META } from "./crm-helpers";

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <KpiRowSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton height={280} />
        <ChartSkeleton height={280} />
      </div>
    </div>
  );
}

export function CrmOverview() {
  const q = useQuery({
    queryKey: ["crmOverview"],
    queryFn: async () => {
      const [segments, customers] = await Promise.all([api.crmSegments(), api.crmCustomers(200)]);
      return { segments, customers };
    },
  });

  return (
    <QueryState query={q} skeleton={<OverviewSkeleton />}>
      {({ segments, customers }) => {
        const totalClients = segments.reduce((s, seg) => s + seg.count, 0);
        const totalRevenue = segments.reduce((s, seg) => s + seg.revenue, 0);
        const avgLtv = totalClients ? Math.round(totalRevenue / totalClients) : 0;
        const active = customers.filter((c) => c.status === "ACTIVE").length;
        const retention = customers.length ? Math.round((active / customers.length) * 100) : 0;
        const satisfaction = customers.length
          ? Math.round(customers.reduce((s, c) => s + c.satisfaction, 0) / customers.length)
          : 0;
        const avgTrend = segments.length
          ? Math.round(segments.reduce((s, seg) => s + seg.trend, 0) / segments.length)
          : 0;

        const donut = segments.map((s) => ({ label: SEGMENT_META[s.name].short, value: s.count }));
        const revenue = segments.map((s) => ({ label: SEGMENT_META[s.name].short, value: s.revenue }));

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                label="Clients totaux"
                value={formatCompact(totalClients)}
                delta={avgTrend}
                hint="base clients"
                icon={<Users className="h-5 w-5" />}
              />
              <KpiCard
                label="LTV moyenne"
                value={formatFcfa(avgLtv)}
                delta={9}
                hint="valeur vie client"
                icon={<Wallet className="h-5 w-5" />}
              />
              <KpiCard
                label="Taux de rétention"
                value={`${retention}%`}
                delta={4}
                hint="clients actifs"
                icon={<Repeat className="h-5 w-5" />}
              />
              <KpiCard
                label="Satisfaction moyenne"
                value={`${satisfaction}%`}
                delta={3}
                hint="score moyen"
                icon={<Smile className="h-5 w-5" />}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par segment</CardTitle>
                  <CardDescription>Nombre de clients par famille.</CardDescription>
                </CardHeader>
                <div className="px-2 pb-2">
                  <DonutChart data={donut} height={220} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pb-5">
                  {donut.map((s, i) => (
                    <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-muted">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      {s.label} · {formatCompact(s.value)}
                    </span>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenu par segment</CardTitle>
                  <CardDescription>Chiffre d'affaires cumulé (FCFA).</CardDescription>
                </CardHeader>
                <div className="px-2 pb-4">
                  <BarSeries data={revenue} height={240} />
                </div>
              </Card>
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
