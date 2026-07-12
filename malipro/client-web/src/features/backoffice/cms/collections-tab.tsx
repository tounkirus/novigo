"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Plus, Star, Layers } from "lucide-react";
import { api } from "@/mock/api";
import type { CmsCollection } from "@/types/backoffice";
import { QueryState } from "@/components/ui/async-state";
import { GridSkeleton } from "@/components/ui/skeletons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

function CollectionCard({ collection }: { collection: CmsCollection }) {
  const { toast } = useToast();
  const [published, setPublished] = React.useState(collection.status === "PUBLISHED");

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-shell">
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
        {collection.featured && (
          <Badge tone="gold" className="absolute left-3 top-3">
            <Star className="h-3 w-3" /> En avant
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="truncate text-sm font-semibold text-ink">{collection.name}</h3>
        <p className="line-clamp-2 text-[13px] text-muted">{collection.description}</p>
        <span className="inline-flex w-fit items-center gap-1 text-[12px] text-muted">
          <Layers className="h-3.5 w-3.5" /> {collection.itemCount} articles
        </span>

        <div className="mt-auto flex items-center justify-between pt-2">
          <Badge tone={published ? "success" : "neutral"}>{published ? "Publiée" : "Brouillon"}</Badge>
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Publier
            <Switch
              checked={published}
              onCheckedChange={(v) => {
                setPublished(v);
                toast({ title: v ? "Collection publiée" : "Collection masquée", description: collection.name, tone: "success" });
              }}
              aria-label={`Publier ${collection.name}`}
            />
          </label>
        </div>
      </div>
    </Card>
  );
}

export function CollectionsTab() {
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["cmsCollections"], queryFn: () => api.cmsCollections() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Regroupements thématiques de commerces et produits.</p>
        <Button size="sm" onClick={() => toast({ title: "Nouvelle collection", description: "Éditeur à venir", tone: "info" })}>
          <Plus className="h-4 w-4" /> Nouvelle collection
        </Button>
      </div>

      <QueryState query={query} skeleton={<GridSkeleton count={6} card="store" />} isEmpty={(d) => d.length === 0}>
        {(collections) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
