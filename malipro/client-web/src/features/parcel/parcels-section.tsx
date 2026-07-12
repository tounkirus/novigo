"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, User, Clock, Navigation, MapPin } from "lucide-react";
import type { Parcel } from "@/types/modules";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { QueryState } from "@/components/ui/async-state";
import { EmptyState } from "@/components/ui/states";
import { ListRowSkeleton } from "@/components/ui/skeletons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { api } from "@/mock/api";
import { formatFcfa, formatDate } from "@/lib/utils";

const STEPS = ["En attente", "Récupéré", "En transit", "Livré"];

const STATUS_META: Record<
  Parcel["status"],
  { label: string; tone: NonNullable<BadgeProps["tone"]>; step: number }
> = {
  PENDING: { label: "En attente", tone: "warning", step: 0 },
  PICKED_UP: { label: "Récupéré", tone: "info", step: 1 },
  IN_TRANSIT: { label: "En transit", tone: "brand", step: 2 },
  DELIVERED: { label: "Livré", tone: "success", step: 3 },
};

export function ParcelsSection() {
  const query = useQuery({ queryKey: ["parcels"], queryFn: () => api.parcels() });

  return (
    <QueryState
      query={query}
      isEmpty={(d) => d.length === 0}
      emptyState={
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Aucun colis"
          description="Vos envois de colis apparaîtront ici avec leur suivi en temps réel."
        />
      }
      skeleton={
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="px-4">
              <ListRowSkeleton />
            </Card>
          ))}
        </div>
      }
    >
      {(parcels) => {
        const transit = parcels.filter((p) => p.status === "IN_TRANSIT");
        const rest = parcels.filter((p) => p.status !== "IN_TRANSIT");
        return (
          <div className="space-y-4">
            {transit.map((p) => (
              <Reveal key={p.id}>
                <ParcelHighlight parcel={p} />
              </Reveal>
            ))}
            <RevealGroup className="space-y-3">
              {rest.map((p) => (
                <RevealItem key={p.id}>
                  <ParcelRow parcel={p} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        );
      }}
    </QueryState>
  );
}

function ParcelHighlight({ parcel }: { parcel: Parcel }) {
  const meta = STATUS_META[parcel.status];
  return (
    <Card className="overflow-hidden border-brand/40 shadow-lifted">
      <div className="flex items-center gap-2 border-b border-line bg-brand-soft px-5 py-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
        </span>
        <p className="text-[13px] font-bold text-brand">Colis en transit</p>
        <span className="ml-auto text-[12px] font-semibold text-brand">{parcel.ref}</span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="relative pl-6">
            <span className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-line" aria-hidden />
            <div className="relative flex items-center gap-2 pb-3">
              <Navigation className="absolute -left-6 h-3.5 w-3.5 text-brand" />
              <p className="text-sm font-semibold text-ink">{parcel.from}</p>
            </div>
            <div className="relative flex items-center gap-2">
              <MapPin className="absolute -left-6 h-3.5 w-3.5 text-ink" />
              <p className="text-sm font-semibold text-ink">{parcel.to}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-black text-ink">{formatFcfa(parcel.price)}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand">
              <Clock className="h-3.5 w-3.5" /> {parcel.eta}
            </p>
          </div>
        </div>
        <Timeline step={meta.step} />
        <p className="flex items-center gap-1.5 text-[12px] text-muted">
          <User className="h-3.5 w-3.5" /> Destinataire : {parcel.recipient}
        </p>
      </div>
    </Card>
  );
}

function ParcelRow({ parcel }: { parcel: Parcel }) {
  const meta = STATUS_META[parcel.status];
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Package className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-ink">
            {parcel.from} → {parcel.to}
          </p>
        </div>
        <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
          <span>{parcel.ref}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{parcel.recipient}</span>
        </p>
        <p className="mt-0.5 text-[12px] text-muted">
          {formatDate(parcel.createdAt)} · ETA {parcel.eta}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-ink">{formatFcfa(parcel.price)}</p>
        <Badge tone={meta.tone} className="mt-1">
          {meta.label}
        </Badge>
      </div>
    </Card>
  );
}

function Timeline({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const done = i <= step;
        return (
          <div key={label} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={
                  "z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition " +
                  (done ? "border-brand bg-brand" : "border-line bg-surface")
                }
              >
                {done && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              {i < STEPS.length - 1 && (
                <span className={"h-0.5 flex-1 " + (i < step ? "bg-brand" : "bg-line")} />
              )}
            </div>
            <span
              className={
                "mt-1.5 text-[10px] font-medium " + (done ? "text-ink" : "text-muted")
              }
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
