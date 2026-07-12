"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, MapPin, CreditCard } from "lucide-react";
import { api } from "@/mock/api";
import type { ServiceIntervention } from "@/types/services";
import { PAYMENT_LABEL } from "@/constants";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/misc";
import { InterventionCard, InterventionStatusBadge, InterventionTimeline } from "@/features/services/ui";
import { formatFcfa, formatDate } from "@/lib/utils";

type Filter = "active" | "done" | "all";
const ACTIVE_STATUSES = new Set(["REQUESTED", "QUOTED", "ACCEPTED", "SCHEDULED", "EN_ROUTE", "IN_PROGRESS"]);

export default function InterventionsPage() {
  const [filter, setFilter] = React.useState<Filter>("active");
  const [selected, setSelected] = React.useState<ServiceIntervention | null>(null);
  const query = useQuery({ queryKey: ["client-interventions"], queryFn: () => api.clientInterventions() });

  return (
    <div className="space-y-5 px-4 py-4">
      <Link href="/home-services" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Services à domicile
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl brand-gradient text-white shadow-glow">
          <ClipboardList className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Mes interventions</h1>
          <p className="text-[13px] text-muted">Suivez vos demandes de services à domicile</p>
        </div>
      </div>

      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "active", label: "En cours" },
          { value: "done", label: "Terminées" },
          { value: "all", label: "Toutes" },
        ]}
      />

      <QueryState
        query={query}
        skeleton={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>}
        isEmpty={(d) => d.length === 0}
      >
        {(all) => {
          const items = all.filter((i) =>
            filter === "all" ? true : filter === "active" ? ACTIVE_STATUSES.has(i.status) : !ACTIVE_STATUSES.has(i.status),
          );
          if (items.length === 0) {
            return (
              <EmptyState
                title="Aucune intervention"
                description="Vous n'avez pas de demande dans cette catégorie."
                action={<Button asChild><Link href="/home-services">Découvrir les services</Link></Button>}
              />
            );
          }
          return (
            <div className="space-y-3">
              {items.map((i) => (
                <button key={i.id} onClick={() => setSelected(i)} className="w-full text-left">
                  <InterventionCard intervention={i} />
                </button>
              ))}
            </div>
          );
        }}
      </QueryState>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar src={selected.providerAvatar} alt={selected.providerName} size={44} />
                  <div className="min-w-0">
                    <DialogTitle>{selected.providerName}</DialogTitle>
                    <p className="text-[12px] text-muted">{selected.categoryLabel} · {selected.ref}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                <InterventionStatusBadge status={selected.status} />
                {selected.urgent && <Badge tone="error">Urgent</Badge>}
                {selected.paid && <Badge tone="success">Payé</Badge>}
              </div>

              <p className="text-sm text-ink">{selected.description}</p>

              <div className="space-y-1.5 rounded-xl bg-shell p-3 text-sm">
                <div className="flex items-center gap-2 text-muted"><MapPin className="h-4 w-4" />{selected.address}, {selected.district}</div>
                <div className="flex items-center gap-2 text-muted"><CreditCard className="h-4 w-4" />{PAYMENT_LABEL[selected.paymentMethod].label}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted">Créée le {formatDate(selected.createdAt)}</span>
                  <span className="font-black text-ink">{formatFcfa(selected.finalAmount || selected.quoteAmount)}</span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-ink">Suivi</p>
                <InterventionTimeline intervention={selected} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
