"use client";

import { useQuery } from "@tanstack/react-query";
import { Car, Clock, MapPin, Navigation, Route as RouteIcon } from "lucide-react";
import type { Trip, RideMode } from "@/types/modules";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/shared/icon";
import { Rating } from "@/components/ui/rating";
import { QueryState } from "@/components/ui/async-state";
import { EmptyState } from "@/components/ui/states";
import { ListRowSkeleton } from "@/components/ui/skeletons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { api } from "@/mock/api";
import { formatFcfa, formatDate } from "@/lib/utils";

const MODE_META: Record<RideMode, { label: string; icon: string }> = {
  MOTO: { label: "Moto Taxi", icon: "Bike" },
  TAXI: { label: "Taxi", icon: "Car" },
  EXPRESS: { label: "Express", icon: "Zap" },
};

const STATUS_META: Record<Trip["status"], { label: string; tone: "brand" | "success" | "error" }> = {
  ONGOING: { label: "En cours", tone: "brand" },
  COMPLETED: { label: "Terminé", tone: "success" },
  CANCELLED: { label: "Annulé", tone: "error" },
};

export function TripsSection() {
  const query = useQuery({ queryKey: ["trips"], queryFn: () => api.trips() });

  return (
    <QueryState
      query={query}
      isEmpty={(d) => d.length === 0}
      emptyState={
        <EmptyState
          icon={<RouteIcon className="h-8 w-8" />}
          title="Aucun trajet"
          description="Vos courses passées et en cours apparaîtront ici."
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
      {(trips) => {
        const ongoing = trips.filter((t) => t.status === "ONGOING");
        const past = trips.filter((t) => t.status !== "ONGOING");
        return (
          <div className="space-y-4">
            {ongoing.map((t) => (
              <Reveal key={t.id}>
                <OngoingTrip trip={t} />
              </Reveal>
            ))}
            <RevealGroup className="space-y-3">
              {past.map((t) => (
                <RevealItem key={t.id}>
                  <TripRow trip={t} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        );
      }}
    </QueryState>
  );
}

function OngoingTrip({ trip }: { trip: Trip }) {
  const meta = MODE_META[trip.mode];
  return (
    <Card className="overflow-hidden border-brand/40 shadow-lifted">
      <div className="flex items-center gap-2 border-b border-line bg-brand-soft px-5 py-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
        </span>
        <p className="text-[13px] font-bold text-brand">Course en cours</p>
        <span className="ml-auto text-[12px] font-semibold text-brand">
          <Icon name={meta.icon} className="mr-1 inline h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>
      <div className="p-5">
        <TripRoute from={trip.from} to={trip.to} />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Car className="h-4 w-4" />
              {trip.driverName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {trip.durationMin} min
            </span>
          </div>
          <span className="text-base font-black text-ink">{formatFcfa(trip.price)}</span>
        </div>
      </div>
    </Card>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const meta = MODE_META[trip.mode];
  const status = STATUS_META[trip.status];
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon name={meta.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-ink">
            {trip.from} → {trip.to}
          </p>
        </div>
        <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
          <span>{formatDate(trip.date)}</span>
          <span aria-hidden>·</span>
          <span>{meta.label}</span>
          {trip.rating != null && (
            <>
              <span aria-hidden>·</span>
              <Rating value={trip.rating} className="text-[12px]" />
            </>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-ink">{formatFcfa(trip.price)}</p>
        <Badge tone={status.tone} className="mt-1">
          {status.label}
        </Badge>
      </div>
    </Card>
  );
}

function TripRoute({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative pl-6">
      <span className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-line" aria-hidden />
      <div className="relative flex items-center gap-2 pb-3">
        <Navigation className="absolute -left-6 h-3.5 w-3.5 text-brand" />
        <p className="text-sm font-semibold text-ink">{from}</p>
      </div>
      <div className="relative flex items-center gap-2">
        <MapPin className="absolute -left-6 h-3.5 w-3.5 text-ink" />
        <p className="text-sm font-semibold text-ink">{to}</p>
      </div>
    </div>
  );
}
