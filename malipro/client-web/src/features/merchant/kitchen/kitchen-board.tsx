"use client";

import * as React from "react";
import { Clock3, ListChecks, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import type { KitchenTicket, KitchenStatus } from "@/types/ops";
import { TicketCard } from "./ticket-card";

const COLUMNS: { status: KitchenStatus; label: string; accent: string }[] = [
  { status: "WAITING", label: "En attente", accent: "bg-info" },
  { status: "PREPARING", label: "En préparation", accent: "bg-warning" },
  { status: "READY", label: "Prêtes", accent: "bg-success" },
  { status: "LATE", label: "En retard", accent: "bg-error" },
];

function advanceStatus(status: KitchenStatus): KitchenStatus {
  switch (status) {
    case "WAITING":
      return "PREPARING";
    case "LATE":
      return "PREPARING";
    default:
      return "READY";
  }
}

export function KitchenBoard({ initialTickets }: { initialTickets: KitchenTicket[] }) {
  const { toast } = useToast();
  const [tickets, setTickets] = React.useState<KitchenTicket[]>(initialTickets);

  // Recharge la liste si les données de la requête changent (refetch).
  React.useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const advance = (t: KitchenTicket) => {
    const next = advanceStatus(t.status);
    setTickets((list) => list.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    toast({
      title: t.ref,
      description: next === "PREPARING" ? "Préparation lancée" : "Commande prête",
      tone: "success",
    });
  };

  const complete = (t: KitchenTicket) => {
    setTickets((list) => list.filter((x) => x.id !== t.id));
    toast({ title: t.ref, description: "Commande clôturée", tone: "info" });
  };

  const active = tickets.filter((t) => t.status !== "READY");
  const lateCount = tickets.filter((t) => t.status === "LATE").length;
  const avgEta = active.length
    ? Math.round(active.reduce((sum, t) => sum + t.etaMin, 0) / active.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* Stats live */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          Temps réel
        </span>
        <Stat icon={<ListChecks className="h-4 w-4" />} label="Commandes actives" value={String(active.length)} />
        <Stat icon={<Clock3 className="h-4 w-4" />} label="Temps moyen" value={`${avgEta} min`} />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="En retard" value={String(lateCount)} tone={lateCount > 0 ? "error" : "neutral"} />
      </div>

      {/* Kanban : scroll horizontal sur mobile, 4 colonnes sur desktop */}
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.status);
          return (
            <section key={col.status} className="flex w-[80vw] shrink-0 flex-col sm:w-[340px] lg:w-auto">
              <header className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                  <h2 className="font-semibold text-ink">{col.label}</h2>
                </div>
                <Badge tone="neutral">{colTickets.length}</Badge>
              </header>

              <div className="flex max-h-[calc(100vh-19rem)] flex-col gap-3 overflow-y-auto rounded-2xl bg-shell p-2">
                {colTickets.length === 0 ? (
                  <EmptyState title="Aucune commande" description="Rien dans cette colonne." className="py-10" />
                ) : (
                  colTickets.map((t) => (
                    <TicketCard key={t.id} ticket={t} onAdvance={advance} onComplete={complete} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  icon, label, value, tone = "neutral",
}: {
  icon: React.ReactNode; label: string; value: string; tone?: "neutral" | "error";
}) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 py-1.5">
      <span className={tone === "error" ? "text-error" : "text-brand"}>{icon}</span>
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`text-[13px] font-bold ${tone === "error" ? "text-error" : "text-ink"}`}>{value}</span>
    </div>
  );
}
