"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Eye } from "lucide-react";
import { api } from "@/mock/api";
import type { CmsPage } from "@/types/backoffice";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCompact, formatDate } from "@/lib/utils";
import { PAGE_TYPE } from "./labels";

export function PagesTab() {
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["cmsPages"], queryFn: () => api.cmsPages() });

  const columns: Column<CmsPage>[] = [
    { key: "title", header: "Titre", cell: (p) => <span className="font-semibold text-ink">{p.title}</span> },
    { key: "slug", header: "Slug", cell: (p) => <span className="font-mono text-[12px] text-muted">/{p.slug}</span> },
    { key: "type", header: "Type", cell: (p) => <Badge tone={PAGE_TYPE[p.type].tone}>{PAGE_TYPE[p.type].label}</Badge> },
    {
      key: "status",
      header: "Statut",
      cell: (p) => (
        <Badge tone={p.status === "PUBLISHED" ? "success" : "neutral"}>
          {p.status === "PUBLISHED" ? "Publiée" : "Brouillon"}
        </Badge>
      ),
    },
    { key: "author", header: "Auteur", cell: (p) => <span className="text-muted">{p.author}</span> },
    { key: "views", header: "Vues", align: "right", cell: (p) => formatCompact(p.views) },
    { key: "updated", header: "Mise à jour", cell: (p) => <span className="text-muted">{formatDate(p.updatedAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Éditer" onClick={() => toast({ title: "Édition", description: p.title, tone: "info" })}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Voir" onClick={() => toast({ title: "Aperçu", description: `/${p.slug}`, tone: "info" })}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Pages éditoriales, légales et d'aide.</p>
        <Button size="sm" onClick={() => toast({ title: "Nouvelle page", description: "Éditeur à venir", tone: "info" })}>
          <Plus className="h-4 w-4" /> Nouvelle page
        </Button>
      </div>

      <QueryState query={query} skeleton={<TableSkeleton rows={8} cols={7} />} isEmpty={(d) => d.length === 0}>
        {(pages) => (
          <DataTable columns={columns} rows={pages} getRowKey={(p) => p.id} minWidth={880} empty="Aucune page." />
        )}
      </QueryState>
    </div>
  );
}
