"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { api } from "@/mock/api";
import { CATEGORY_BY_ID } from "@/mock/services";
import type { ProviderQuery } from "@/mock/services";
import { Icon } from "@/components/shared/icon";
import { QueryState } from "@/components/ui/async-state";
import { GridSkeleton } from "@/components/ui/skeletons";
import { NoResults } from "@/components/ui/states";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Segmented } from "@/components/ui/misc";
import { Chip } from "@/components/ui/chip";
import { ProviderCard } from "@/features/services/ui";
import { cn } from "@/lib/utils";

type Sort = NonNullable<ProviderQuery["sort"]>;

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const categoryId = params.category;
  const cat = CATEGORY_BY_ID[categoryId];

  const [sort, setSort] = React.useState<Sort>("rating");
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [onlineOnly, setOnlineOnly] = React.useState(false);

  const query = useQuery({
    queryKey: ["service-providers", categoryId, sort, verifiedOnly, onlineOnly],
    queryFn: () => api.serviceProviders({ category: categoryId, sort, verifiedOnly, onlineOnly, pageSize: 48 }),
  });

  if (!cat) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink">Métier introuvable</p>
        <Link href="/home-services" className="mt-2 inline-block text-sm font-medium text-brand">← Retour aux services</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <Link href="/home-services" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Tous les services
      </Link>

      {/* En-tête catégorie */}
      <div className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lifted", cat.gradient)}>
        <Icon name={cat.icon} className="absolute -right-4 -top-4 h-28 w-28 opacity-20" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Icon name={cat.icon} className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{cat.label}</h1>
            <p className="text-[13px] font-medium text-white/85">Prestataires disponibles près de vous à Bamako</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
          <SlidersHorizontal className="h-4 w-4" /> Trier
        </span>
        <Segmented<Sort>
          value={sort}
          onChange={setSort}
          options={[
            { value: "rating", label: "Mieux notés" },
            { value: "price", label: "Prix" },
            { value: "distance", label: "Proximité" },
            { value: "jobs", label: "Expérience" },
          ]}
        />
        <div className="ml-auto flex gap-2">
          <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>Vérifiés</Chip>
          <Chip active={onlineOnly} onClick={() => setOnlineOnly((v) => !v)}>En ligne</Chip>
        </div>
      </div>

      <QueryState query={query} skeleton={<GridSkeleton count={8} />} isEmpty={(d) => d.items.length === 0} emptyState={<NoResults />}>
        {(data) => (
          <>
            <p className="text-[13px] text-muted">{data.total} prestataire(s)</p>
            <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((p) => (
                <RevealItem key={p.id}>
                  <ProviderCard provider={p} />
                </RevealItem>
              ))}
            </RevealGroup>
          </>
        )}
      </QueryState>
    </div>
  );
}
