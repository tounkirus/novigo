"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Upload, Video, ImageIcon } from "lucide-react";
import { api } from "@/mock/api";
import type { MediaAsset } from "@/types/backoffice";
import { QueryState } from "@/components/ui/async-state";
import { GridSkeleton } from "@/components/ui/skeletons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

function MediaTile({ asset }: { asset: MediaAsset }) {
  const isVideo = asset.type === "VIDEO";
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-shell">
        <Image src={asset.url} alt={asset.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
        <Badge tone={isVideo ? "info" : "neutral"} className="absolute left-2 top-2">
          {isVideo ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          {asset.type}
        </Badge>
      </div>
      <div className="space-y-0.5 p-3">
        <p className="truncate text-[13px] font-medium text-ink">{asset.name}</p>
        <p className="text-[12px] text-muted">
          {asset.size} · {formatDate(asset.uploadedAt)}
        </p>
      </div>
    </Card>
  );
}

export function MediaTab() {
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["cmsMedia"], queryFn: () => api.cmsMedia() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Images et vidéos réutilisables dans le CMS.</p>
        <Button size="sm" onClick={() => toast({ title: "Téléversement", description: "Sélecteur de fichiers à venir", tone: "info" })}>
          <Upload className="h-4 w-4" /> Téléverser
        </Button>
      </div>

      <QueryState query={query} skeleton={<GridSkeleton count={8} card="product" />} isEmpty={(d) => d.length === 0}>
        {(media) => (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((m) => (
              <MediaTile key={m.id} asset={m} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
