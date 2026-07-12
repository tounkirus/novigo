"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardCheck, Star, ShieldAlert, Wallet, Check, X, Eye } from "lucide-react";
import { api } from "@/mock/api";
import type { AdminProviderRow, KycStatus, ServiceIntervention } from "@/types/services";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { QueryState } from "@/components/ui/async-state";
import { KpiRowSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/components/ui/toast";
import { InterventionStatusBadge } from "@/features/services/ui";
import { formatFcfa, formatCompact, formatDate } from "@/lib/utils";

const KYC_TONE: Record<KycStatus, "success" | "warning" | "error" | "neutral"> = {
  VERIFIED: "success", PENDING: "warning", REJECTED: "error", EXPIRED: "neutral",
};
const KYC_LABEL: Record<KycStatus, string> = {
  VERIFIED: "Vérifié", PENDING: "En attente", REJECTED: "Rejeté", EXPIRED: "Expiré",
};

const PAGE_SIZE = 15;

export default function AdminServicesPage() {
  const [page, setPage] = React.useState(0);
  const statsQuery = useQuery({ queryKey: ["service-stats"], queryFn: () => api.serviceStats() });
  const providersQuery = useQuery({ queryKey: ["admin-providers", page], queryFn: () => api.adminProviders(page, PAGE_SIZE) });
  const pendingQuery = useQuery({ queryKey: ["pending-kyc"], queryFn: () => api.pendingKycProviders(24) });
  const intvQuery = useQuery({ queryKey: ["provider-interventions"], queryFn: () => api.providerInterventions() });
  const { toast } = useToast();

  const kycAction = (name: string, approve: boolean) =>
    toast({ title: approve ? `${name} validé` : `${name} rejeté`, description: "Le prestataire a été notifié.", tone: approve ? "success" : "error" });

  const providerColumns: Column<AdminProviderRow>[] = [
    {
      key: "name", header: "Prestataire",
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={r.avatar} alt={r.name} size={34} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[12px] text-muted">{r.district}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Métier", cell: (r) => <span className="text-muted">{r.categoryLabel}</span> },
    { key: "rating", header: "Note", cell: (r) => <Rating value={r.rating} /> },
    { key: "jobs", header: "Missions", align: "right", cell: (r) => <span className="tabular-nums">{r.jobsCompleted}</span> },
    { key: "gmv", header: "Volume", align: "right", cell: (r) => <span className="tabular-nums font-medium text-ink">{formatFcfa(r.gmv)}</span> },
    { key: "kyc", header: "KYC", cell: (r) => <Badge tone={KYC_TONE[r.kycStatus]}>{KYC_LABEL[r.kycStatus]}</Badge> },
    {
      key: "actions", header: "", align: "right",
      cell: (r) => (
        <Button size="icon-sm" variant="ghost" asChild aria-label="Voir">
          <a href={`/home-services/provider/${r.slug}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Services à domicile</h2>
        <p className="text-sm text-muted">Pilotez la marketplace des prestataires : prestataires, KYC, interventions.</p>
      </div>

      <QueryState query={statsQuery} skeleton={<KpiRowSkeleton count={4} />} isEmpty={() => false}>
        {(s) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Prestataires" value={String(s.providers)} hint={`${s.activeProviders} actifs`} icon={<Users className="h-5 w-5" />} />
            <KpiCard label="Interventions" value={formatCompact(s.interventions)} hint={`${formatCompact(s.completedInterventions)} terminées`} icon={<ClipboardCheck className="h-5 w-5" />} tone="success" />
            <KpiCard label="Note moyenne" value={s.avgRating.toFixed(2)} hint={`${formatCompact(s.reviews)} avis`} icon={<Star className="h-5 w-5" />} tone="info" />
            <KpiCard label="Volume (GMV)" value={formatFcfa(s.gmv)} hint="cumulé" icon={<Wallet className="h-5 w-5" />} tone="warning" />
          </div>
        )}
      </QueryState>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
          <TabsTrigger value="kyc">KYC en attente</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <QueryState query={providersQuery} skeleton={<TableSkeleton rows={8} cols={7} />} isEmpty={(d) => d.items.length === 0}>
            {(data) => (
              <div className="space-y-4">
                <DataTable columns={providerColumns} rows={data.items} getRowKey={(r) => r.id} minWidth={860} />
                <Pagination page={page} pageCount={Math.ceil(data.total / PAGE_SIZE)} total={data.total} onPage={setPage} />
              </div>
            )}
          </QueryState>
        </TabsContent>

        <TabsContent value="kyc">
          <QueryState query={pendingQuery} skeleton={<TableSkeleton rows={6} cols={3} />} isEmpty={() => false}>
            {(pending) => {
              if (pending.length === 0) {
                return (
                  <Card className="p-10 text-center">
                    <ShieldAlert className="mx-auto h-8 w-8 text-success" />
                    <p className="mt-2 font-semibold text-ink">Aucune vérification en attente</p>
                    <p className="text-sm text-muted">Tous les dossiers KYC sont à jour.</p>
                  </Card>
                );
              }
              return (
                <div className="space-y-3">
                  {pending.map((r) => (
                    <Card key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                      <Avatar src={r.avatar} alt={r.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{r.name}</p>
                        <p className="truncate text-[12px] text-muted">{r.categoryLabel} · {r.district} · inscrit le {formatDate(r.joinedAt)}</p>
                      </div>
                      <Badge tone="warning">KYC à vérifier</Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => kycAction(r.name, true)}><Check className="h-4 w-4" /> Valider</Button>
                        <Button size="sm" variant="danger" onClick={() => kycAction(r.name, false)}><X className="h-4 w-4" /> Rejeter</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              );
            }}
          </QueryState>
        </TabsContent>

        <TabsContent value="interventions">
          <Card>
            <CardHeader>
              <CardTitle>Interventions récentes</CardTitle>
              <CardDescription>Suivi des prestations sur la plateforme.</CardDescription>
            </CardHeader>
            <QueryState query={intvQuery} skeleton={<div className="p-4"><TableSkeleton rows={6} cols={4} /></div>} isEmpty={(d) => d.length === 0}>
              {(list: ServiceIntervention[]) => (
                <div className="divide-y divide-line border-t border-line">
                  {list.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar src={i.providerAvatar} alt={i.providerName} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{i.providerName} <span className="font-normal text-muted">→ {i.clientName}</span></p>
                        <p className="truncate text-[12px] text-muted">{i.categoryLabel} · {i.ref} · {formatDate(i.createdAt)}</p>
                      </div>
                      <InterventionStatusBadge status={i.status} />
                      <span className="w-24 text-right text-sm font-bold text-ink">{formatFcfa(i.finalAmount || i.quoteAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </QueryState>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
