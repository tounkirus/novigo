"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, CreditCard, Check, FileText, Phone } from "lucide-react";
import { api } from "@/mock/api";
import type { ServiceIntervention } from "@/types/services";
import { PAYMENT_LABEL } from "@/constants";
import { QueryState } from "@/components/ui/async-state";
import { ListRowSkeleton } from "@/components/ui/skeletons";
import { Segmented } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { InterventionStatusBadge, InterventionTimeline } from "@/features/services/ui";
import { formatFcfa, formatDate } from "@/lib/utils";

type Filter = "new" | "ongoing" | "done" | "all";
const NEW = new Set(["REQUESTED", "QUOTED"]);
const ONGOING = new Set(["ACCEPTED", "SCHEDULED", "EN_ROUTE", "IN_PROGRESS"]);

export default function ProInterventionsPage() {
  const [filter, setFilter] = React.useState<Filter>("new");
  const [selected, setSelected] = React.useState<ServiceIntervention | null>(null);
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["provider-interventions"], queryFn: () => api.providerInterventions() });

  const act = (label: string) => {
    toast({ title: label, description: "Le client a été notifié.", tone: "success" });
    setSelected(null);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Interventions</h2>
        <p className="text-sm text-muted">Gérez vos demandes : devis, planification, réalisation.</p>
      </div>

      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "new", label: "Nouvelles" },
          { value: "ongoing", label: "En cours" },
          { value: "done", label: "Terminées" },
          { value: "all", label: "Toutes" },
        ]}
      />

      <QueryState query={query} skeleton={<Card className="p-4"><ListRowSkeleton /></Card>} isEmpty={(d) => d.length === 0}>
        {(all) => {
          const items = all.filter((i) =>
            filter === "all" ? true :
            filter === "new" ? NEW.has(i.status) :
            filter === "ongoing" ? ONGOING.has(i.status) :
            !NEW.has(i.status) && !ONGOING.has(i.status),
          );
          if (items.length === 0) return <EmptyState title="Rien ici" description="Aucune intervention dans cette catégorie." />;
          return (
            <div className="space-y-3">
              {items.map((i) => (
                <Card key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                  <Avatar src={i.clientAvatar} alt={i.clientName} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-ink">{i.clientName}</p>
                      {i.urgent && <Badge tone="error">Urgent</Badge>}
                    </div>
                    <p className="truncate text-[12px] text-muted">{i.categoryLabel} · {i.ref} · {i.district}</p>
                    <p className="line-clamp-1 text-[12px] text-muted">{i.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <InterventionStatusBadge status={i.status} />
                    <span className="text-sm font-bold text-ink">{formatFcfa(i.finalAmount || i.quoteAmount)}</span>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button size="sm" variant="secondary" onClick={() => setSelected(i)} block>Détails</Button>
                    {NEW.has(i.status) && <Button size="sm" onClick={() => act("Devis envoyé")} block><FileText className="h-4 w-4" />Devis</Button>}
                    {ONGOING.has(i.status) && <Button size="sm" variant="success" onClick={() => act("Intervention terminée")} block><Check className="h-4 w-4" />Terminer</Button>}
                  </div>
                </Card>
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
                  <Avatar src={selected.clientAvatar} alt={selected.clientName} size={44} />
                  <div className="min-w-0">
                    <DialogTitle>{selected.clientName}</DialogTitle>
                    <p className="text-[12px] text-muted">{selected.categoryLabel} · {selected.ref}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <InterventionStatusBadge status={selected.status} />
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
              <div className="flex gap-2">
                <Button variant="secondary" block><Phone className="h-4 w-4" />Appeler</Button>
                {NEW.has(selected.status) && <Button block onClick={() => act("Devis envoyé")}>Envoyer un devis</Button>}
                {ONGOING.has(selected.status) && <Button variant="success" block onClick={() => act("Intervention terminée")}>Marquer terminée</Button>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
