"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Send, Eye, MousePointerClick } from "lucide-react";
import { api } from "@/mock/api";
import type { CmsBanner } from "@/types/backoffice";
import { QueryState } from "@/components/ui/async-state";
import { GridSkeleton } from "@/components/ui/skeletons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatCompact, formatDate } from "@/lib/utils";
import { PLACEMENT_LABEL, CMS_STATUS } from "./labels";

function BannerCard({ banner }: { banner: CmsBanner }) {
  const { toast } = useToast();
  const st = CMS_STATUS[banner.status];

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-shell">
        <Image
          src={banner.image}
          alt={banner.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="solid">{PLACEMENT_LABEL[banner.placement]}</Badge>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">{banner.title}</h3>
          <p className="line-clamp-2 text-[13px] text-muted">{banner.subtitle}</p>
        </div>

        <div className="flex items-center gap-4 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {formatCompact(banner.impressions)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MousePointerClick className="h-3.5 w-3.5" /> {formatCompact(banner.clicks)}
          </span>
        </div>

        <p className="text-[12px] text-muted">
          Du {formatDate(banner.startAt)} au {formatDate(banner.endAt)}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="flex-1">
                <Pencil className="h-4 w-4" /> Éditer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier la bannière</DialogTitle>
                <DialogDescription>Ajustez le contenu affiché aux clients.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`banner-title-${banner.id}`}>Titre</Label>
                  <Input id={`banner-title-${banner.id}`} defaultValue={banner.title} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`banner-sub-${banner.id}`}>Sous-titre</Label>
                  <Textarea id={`banner-sub-${banner.id}`} defaultValue={banner.subtitle} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="ghost">Annuler</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => toast({ title: "Bannière enregistrée", tone: "success" })}>
                    Enregistrer
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            className="flex-1"
            onClick={() =>
              toast({
                title: banner.status === "PUBLISHED" ? "Bannière dépubliée" : "Bannière publiée",
                description: banner.title,
                tone: "success",
              })
            }
          >
            <Send className="h-4 w-4" /> {banner.status === "PUBLISHED" ? "Retirer" : "Publier"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function BannersTab() {
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["cmsBanners"], queryFn: () => api.cmsBanners() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Visuels promotionnels affichés dans l'application.</p>
        <Button size="sm" onClick={() => toast({ title: "Nouvelle bannière", description: "Éditeur à venir", tone: "info" })}>
          <Plus className="h-4 w-4" /> Nouvelle bannière
        </Button>
      </div>

      <QueryState query={query} skeleton={<GridSkeleton count={6} card="store" />} isEmpty={(d) => d.length === 0}>
        {(banners) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => (
              <BannerCard key={b.id} banner={b} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
