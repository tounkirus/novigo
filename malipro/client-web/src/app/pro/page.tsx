"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Wallet, CalendarCheck, FileText, Star, Clock, Repeat, TrendingUp, ArrowRight } from "lucide-react";
import { api } from "@/mock/api";
import { KpiCard } from "@/components/ui/kpi-card";
import { AreaTrend } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton, ChartSkeleton, ListRowSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/misc";
import { InterventionStatusBadge } from "@/features/services/ui";
import { formatFcfa, formatRating, formatDate } from "@/lib/utils";

export default function ProDashboardPage() {
  const meQuery = useQuery({ queryKey: ["me-provider"], queryFn: () => api.meProvider() });
  const dashQuery = useQuery({ queryKey: ["provider-dashboard"], queryFn: () => api.providerDashboard() });
  const intvQuery = useQuery({ queryKey: ["provider-interventions"], queryFn: () => api.providerInterventions() });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <QueryState query={meQuery} skeleton={<Skeleton className="h-16 w-full rounded-2xl" />} isEmpty={(d) => d == null}>
        {(me) => (
          <div className="flex flex-wrap items-center gap-3">
            <Avatar src={me!.avatar} alt={me!.name} size={52} />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink">{me!.name}</h2>
              <p className="text-sm text-muted">{me!.categoryLabel} · {me!.district} · Prestataire NOVIGO</p>
            </div>
            <Button asChild variant="secondary" size="sm" className="ml-auto">
              <Link href={`/home-services/provider/${me!.slug}`}>Voir mon profil public <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        )}
      </QueryState>

      <QueryState query={dashQuery} skeleton={<DashSkeleton />} isEmpty={() => false}>
        {(d) => (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Revenus du mois" value={formatFcfa(d.monthRevenue)} delta={12} hint="vs mois dernier" icon={<Wallet className="h-5 w-5" />} />
              <KpiCard label="Missions cette semaine" value={String(d.weekJobs)} delta={5} hint={`${d.todayJobs} aujourd'hui`} icon={<CalendarCheck className="h-5 w-5" />} tone="success" />
              <KpiCard label="Devis en attente" value={String(d.pendingQuotes)} hint="à traiter" icon={<FileText className="h-5 w-5" />} tone="warning" />
              <KpiCard label="Note moyenne" value={formatRating(d.rating)} hint={`${d.reviewCount} avis`} icon={<Star className="h-5 w-5" />} tone="info" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Gains (14 jours)</CardTitle>
                  <CardDescription>Vos revenus quotidiens sur NOVIGO.</CardDescription>
                </CardHeader>
                <div className="px-2 pb-4"><AreaTrend data={d.earningsSeries} /></div>
              </Card>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                <MetricCard icon={Clock} label="Temps de réponse" value={`${d.responseTimeMin} min`} />
                <MetricCard icon={TrendingUp} label="Taux de réussite" value={`${d.completionRate}%`} />
                <MetricCard icon={Repeat} label="Clients fidèles" value={`${d.repeatRate}%`} />
                <MetricCard icon={CalendarCheck} label="RDV à venir" value={String(d.upcomingCount)} />
              </div>
            </div>
          </>
        )}
      </QueryState>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Demandes récentes</CardTitle>
            <CardDescription>Interventions à confirmer ou en cours.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm"><Link href="/pro/interventions">Tout voir</Link></Button>
        </CardHeader>
        <QueryState query={intvQuery} skeleton={<div className="p-4"><ListRowSkeleton /></div>} isEmpty={(d) => d.length === 0}>
          {(list) => (
            <div className="divide-y divide-line border-t border-line">
              {list.slice(0, 6).map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar src={i.clientAvatar} alt={i.clientName} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{i.clientName}</p>
                    <p className="truncate text-[12px] text-muted">{i.categoryLabel} · {formatDate(i.createdAt)}</p>
                  </div>
                  <InterventionStatusBadge status={i.status} />
                  <span className="w-24 text-right text-sm font-bold text-ink">{formatFcfa(i.finalAmount || i.quoteAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Ico, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <Card className="p-4">
      <Ico className="h-5 w-5 text-brand" />
      <p className="mt-2 text-xl font-bold tracking-tight text-ink">{value}</p>
      <p className="text-[12px] text-muted">{label}</p>
    </Card>
  );
}

function DashSkeleton() {
  return (
    <div className="space-y-6">
      <KpiRowSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartSkeleton /></div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
