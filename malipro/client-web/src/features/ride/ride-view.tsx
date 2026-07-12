"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation, Search, Star, Clock, Users, ChevronRight, Loader2 } from "lucide-react";
import type { RideMode, RideOption, RideDriverNearby } from "@/types/modules";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/misc";
import { Icon } from "@/components/shared/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryState } from "@/components/ui/async-state";
import { Reveal } from "@/components/ui/reveal";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import { BAMAKO_DISTRICTS } from "@/constants";
import { formatFcfa, formatRating } from "@/lib/utils";
import { RideMap } from "./ride-map";
import { TripsSection } from "./trips-section";

const PAYMENTS = [
  { id: "wallet", label: "Portefeuille NOVIGO", desc: "Solde disponible", icon: "Wallet" },
  { id: "orange", label: "Orange Money", desc: "Paiement mobile", icon: "Smartphone" },
  { id: "cash", label: "Espèces", desc: "Payer au chauffeur", icon: "Banknote" },
] as const;

export function RideView() {
  const { toast } = useToast();
  const [from, setFrom] = React.useState("Ma position");
  const [to, setTo] = React.useState("");
  const [selectedMode, setSelectedMode] = React.useState<RideMode | null>(null);
  const [payment, setPayment] = React.useState<string>("wallet");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const quoteQuery = useQuery({
    queryKey: ["rideQuote", from, to],
    queryFn: () => api.rideQuote(from, to),
    enabled: !!to,
  });

  const nearbyQuery = useQuery({
    queryKey: ["nearby", selectedMode],
    queryFn: () => api.nearbyDrivers(selectedMode as RideMode),
    enabled: searchOpen && !!selectedMode,
  });

  const foundCount = nearbyQuery.data?.length ?? 0;
  React.useEffect(() => {
    if (searchOpen && foundCount > 0) {
      toast({
        title: "Chauffeur trouvé !",
        description: `${foundCount} chauffeurs disponibles près de vous.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundCount, searchOpen]);

  function selectDestination(value: string) {
    setTo(value);
    setSelectedMode(null);
  }

  function orderRide() {
    if (!selectedMode) return;
    setSearchOpen(true);
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Course</h1>
        <p className="text-[13px] text-muted">Taxi, Moto Taxi & Express à Bamako</p>
      </div>

      <Tabs defaultValue="book">
        <TabsList className="w-full">
          <TabsTrigger value="book" className="flex-1">
            Réserver
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex-1">
            Mes trajets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="space-y-5">
          <Reveal>
            <RideMap
              from={from}
              to={to}
              distanceKm={quoteQuery.data?.distanceKm}
              durationMin={quoteQuery.data?.durationMin}
            />
          </Reveal>

          {/* Itinéraire */}
          <Reveal delay={0.05}>
            <Card className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="ride-from">Départ</Label>
                <Input
                  id="ride-from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  icon={<Navigation className="h-4 w-4 text-brand" />}
                  placeholder="Votre position de départ"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Select value={to} onValueChange={selectDestination}>
                  <SelectTrigger aria-label="Choisir une destination">
                    <SelectValue placeholder="Où allez-vous ?" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAMAKO_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </Reveal>

          {/* Options */}
          {to ? (
            <QueryState query={quoteQuery} skeleton={<OptionsSkeleton />}>
              {(quote) => (
                <Reveal>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-ink">Choisissez votre course</h2>
                      <span className="text-[12px] font-semibold text-muted">
                        {quote.distanceKm.toFixed(1).replace(".", ",")} km · {quote.durationMin} min
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {quote.options.map((o) => (
                        <RideOptionCard
                          key={o.mode}
                          option={o}
                          selected={selectedMode === o.mode}
                          onSelect={() => setSelectedMode(o.mode)}
                        />
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </QueryState>
          ) : (
            <Card className="flex items-center gap-3 p-5 text-muted">
              <Search className="h-5 w-5 shrink-0" />
              <p className="text-sm">Choisissez une destination pour voir les tarifs.</p>
            </Card>
          )}

          {/* Paiement */}
          <Reveal delay={0.05}>
            <Card className="p-5">
              <h2 className="mb-3 text-base font-bold text-ink">Moyen de paiement</h2>
              <RadioGroup value={payment} onValueChange={setPayment} className="gap-2.5">
                {PAYMENTS.map((p) => {
                  const active = payment === p.id;
                  return (
                    <label
                      key={p.id}
                      htmlFor={`pay-${p.id}`}
                      className={
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition " +
                        (active ? "border-brand bg-brand-soft" : "border-line hover:bg-shell")
                      }
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand shadow-card">
                        <Icon name={p.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{p.label}</span>
                        <span className="block text-[12px] text-muted">{p.desc}</span>
                      </span>
                      <RadioGroupItem id={`pay-${p.id}`} value={p.id} />
                    </label>
                  );
                })}
              </RadioGroup>
            </Card>
          </Reveal>

          {/* Action */}
          <Button block size="lg" disabled={!selectedMode} onClick={orderRide}>
            {selectedMode
              ? `Commander la course${
                  quoteQuery.data
                    ? " · " +
                      formatFcfa(
                        quoteQuery.data.options.find((o) => o.mode === selectedMode)?.price ?? 0,
                      )
                    : ""
                }`
              : "Sélectionnez une course"}
          </Button>
        </TabsContent>

        <TabsContent value="trips">
          <TripsSection />
        </TabsContent>
      </Tabs>

      {/* Recherche de chauffeurs */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>
              {nearbyQuery.isLoading ? "Recherche de chauffeurs…" : "Chauffeurs disponibles"}
            </SheetTitle>
            <SheetDescription>
              {to ? `Trajet vers ${to}` : "Autour de votre position"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            {nearbyQuery.isLoading ? (
              <SearchingState />
            ) : (
              <div className="space-y-2.5">
                {(nearbyQuery.data ?? []).map((d) => (
                  <DriverRow
                    key={d.id}
                    driver={d}
                    onPick={() => {
                      toast({ title: "Chauffeur confirmé", description: `${d.name} arrive dans ${d.etaMin} min.` });
                      setSearchOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RideOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: RideOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition active:scale-[0.99] " +
        (selected
          ? "border-brand bg-brand-soft shadow-glow"
          : "border-line bg-surface shadow-card hover:border-brand/40")
      }
    >
      <span
        className={
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl " +
          (selected ? "brand-gradient text-white" : "bg-brand-soft text-brand")
        }
      >
        <Icon name={option.icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink">{option.label}</span>
          <Badge tone="neutral" className="gap-1">
            <Clock className="h-3 w-3" />
            {option.etaMin} min
          </Badge>
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-muted">{option.desc}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-muted">
          <Users className="h-3.5 w-3.5" />
          {option.capacity} place{option.capacity > 1 ? "s" : ""}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-base font-black text-ink">{formatFcfa(option.price)}</span>
      </span>
    </button>
  );
}

function DriverRow({ driver, onPick }: { driver: RideDriverNearby; onPick: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card">
      <Avatar src={driver.avatar} alt={driver.name} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{driver.name}</p>
        <p className="truncate text-[12px] text-muted">
          {driver.vehicle} · {driver.plate}
        </p>
        <span className="mt-0.5 inline-flex items-center gap-2 text-[12px] font-semibold text-ink">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            {formatRating(driver.rating)}
          </span>
          <span className="text-muted">· à {driver.etaMin} min</span>
        </span>
      </div>
      <Button size="sm" onClick={onPick} className="shrink-0">
        Choisir
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SearchingState() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center py-4 text-center">
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-soft" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Loader2 className="h-7 w-7 animate-spin" />
          </span>
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">Recherche des chauffeurs les plus proches…</p>
        <p className="text-[12px] text-muted">Cela ne prend que quelques secondes.</p>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
