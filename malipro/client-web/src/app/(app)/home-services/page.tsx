"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Wrench, ShieldCheck, Star, Clock, ClipboardList } from "lucide-react";
import { api } from "@/mock/api";
import { SERVICE_GROUPS } from "@/mock/services";
import type { ServiceGroup } from "@/types/services";
import { Icon } from "@/components/shared/icon";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { QueryState } from "@/components/ui/async-state";
import { GridSkeleton } from "@/components/ui/skeletons";
import { NoResults } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { CategoryTile, ProviderCard } from "@/features/services/ui";

export default function HomeServicesPage() {
  const [group, setGroup] = React.useState<ServiceGroup | "ALL">("ALL");
  const [q, setQ] = React.useState("");

  const catsQuery = useQuery({ queryKey: ["service-categories"], queryFn: () => api.serviceCategories() });
  const featuredQuery = useQuery({ queryKey: ["service-featured"], queryFn: () => api.featuredProviders(8) });

  return (
    <div className="space-y-6 px-4 py-4">
      {/* Hero */}
      <Reveal>
        <div className="premium-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-lifted sm:p-8">
          <Wrench className="absolute -right-6 -top-6 h-32 w-32 opacity-15" />
          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Pros vérifiés & assurés
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Services à domicile</h1>
            <p className="mt-1.5 text-[14px] font-medium text-white/90">
              Plombiers, électriciens, coiffeurs, traiteurs… 50 métiers de confiance à Bamako, réservés en 2 minutes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/home-services/interventions"><ClipboardList className="h-4 w-4" /> Mes interventions</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Recherche */}
      <Input
        icon={<Search className="h-5 w-5" />}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un métier (plomberie, tresses, traiteur…)"
        aria-label="Rechercher un métier"
        className="h-12 rounded-2xl shadow-card"
      />

      {/* Filtres par famille */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={group === "ALL"} onClick={() => setGroup("ALL")} icon={<Icon name="LayoutGrid" className="h-4 w-4" />}>
          Tous
        </Chip>
        {SERVICE_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)} icon={<Icon name={g.icon} className="h-4 w-4" />}>
            {g.label}
          </Chip>
        ))}
      </div>

      {/* Catégories */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-ink">Explorer les métiers</h2>
        <QueryState
          query={catsQuery}
          skeleton={<GridSkeleton count={12} />}
          isEmpty={(d) => d.length === 0}
        >
          {(cats) => {
            const filtered = cats
              .filter((c) => group === "ALL" || c.group === group)
              .filter((c) => !q || c.label.toLowerCase().includes(q.toLowerCase()));
            if (filtered.length === 0) return <NoResults query={q} />;
            return (
              <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((c) => (
                  <RevealItem key={c.id}>
                    <CategoryTile category={c} count={c.count} />
                  </RevealItem>
                ))}
              </RevealGroup>
            );
          }}
        </QueryState>
      </section>

      {/* Prestataires en vedette */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-bold tracking-tight text-ink">Pros les mieux notés</h2>
        </div>
        <QueryState
          query={featuredQuery}
          skeleton={<GridSkeleton count={4} />}
          isEmpty={(d) => d.length === 0}
        >
          {(providers) => (
            <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {providers.map((p) => (
                <RevealItem key={p.id}>
                  <ProviderCard provider={p} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </QueryState>
      </section>

      {/* Réassurance */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Pros vérifiés", desc: "Identité & compétences contrôlées (KYC)." },
          { icon: Star, title: "Avis authentiques", desc: "Notes laissées par de vrais clients." },
          { icon: Clock, title: "Réservation express", desc: "Devis et planification en quelques clics." },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <f.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-ink">{f.title}</p>
              <p className="text-[12px] text-muted">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
