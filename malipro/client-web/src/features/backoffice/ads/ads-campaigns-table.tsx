"use client";

import * as React from "react";
import { Pause, Play, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/misc";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/components/ui/toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/mock/api";
import { formatFcfa, formatCompact, formatDate } from "@/lib/utils";
import type { AdCampaign } from "@/types/modules";
import { AD_STATUS, AD_STATUS_FILTERS } from "./ads-helpers";

const PAGE_SIZE = 8;

export function AdsCampaignsTable() {
  const q = useQuery({ queryKey: ["adCampaigns"], queryFn: () => api.adCampaigns() });
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(0);
  const [overrides, setOverrides] = React.useState<Record<string, AdCampaign["status"]>>({});

  React.useEffect(() => setPage(0), [query, status]);

  function setCampaignStatus(c: AdCampaign, next: AdCampaign["status"]) {
    setOverrides((prev) => ({ ...prev, [c.id]: next }));
    toast({
      title: next === "PAUSED" ? "Campagne mise en pause" : "Campagne activée",
      description: `« ${c.title} » — ${c.advertiser}`,
      tone: next === "PAUSED" ? "info" : "success",
    });
  }

  const columns: Column<AdCampaign>[] = [
    {
      key: "campaign",
      header: "Campagne",
      cell: (c) => (
        <div className="min-w-0">
          <p className="max-w-[220px] truncate font-semibold text-ink">{c.title}</p>
          <p className="text-[12px] text-muted">{c.advertiser}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (c) => <Badge tone={AD_STATUS[c.status].tone}>{AD_STATUS[c.status].label}</Badge>,
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      cell: (c) => <span className="tabular-nums text-ink">{formatFcfa(c.budget)}</span>,
    },
    {
      key: "spent",
      header: "Dépensé",
      cell: (c) => {
        const pct = c.budget ? Math.round((c.spent / c.budget) * 100) : 0;
        return (
          <div className="min-w-[140px] space-y-1">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-ink">{formatFcfa(c.spent)}</span>
              <span className="text-muted">{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>
        );
      },
    },
    {
      key: "impressions",
      header: "Impressions",
      align: "right",
      cell: (c) => <span className="tabular-nums text-ink">{formatCompact(c.impressions)}</span>,
    },
    {
      key: "clicks",
      header: "Clics",
      align: "right",
      cell: (c) => <span className="tabular-nums text-muted">{formatCompact(c.clicks)}</span>,
    },
    { key: "ctr", header: "CTR", align: "right", cell: (c) => <span className="tabular-nums">{c.ctr}%</span> },
    {
      key: "period",
      header: "Période",
      cell: (c) => (
        <span className="whitespace-nowrap text-[12px] text-muted">
          {formatDate(c.startAt)} → {formatDate(c.endAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (c) =>
        c.status === "ACTIVE" ? (
          <Button size="sm" variant="ghost" onClick={() => setCampaignStatus(c, "PAUSED")}>
            <Pause className="h-4 w-4" /> Pause
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setCampaignStatus(c, "ACTIVE")}>
            <Play className="h-4 w-4" /> Activer
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher une campagne, un annonceur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm flex-1"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {AD_STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState query={q} skeleton={<TableSkeleton rows={8} cols={7} />}>
        {(data) => {
          const campaigns = data.map((c) => (overrides[c.id] ? { ...c, status: overrides[c.id] } : c));
          const term = query.trim().toLowerCase();
          const filtered = campaigns.filter(
            (c) =>
              (status === "ALL" || c.status === status) &&
              (term === "" ||
                c.title.toLowerCase().includes(term) ||
                c.advertiser.toLowerCase().includes(term)),
          );
          const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          const current = Math.min(page, pageCount - 1);
          const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

          return (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(c) => c.id}
                minWidth={1080}
                empty="Aucune campagne trouvée."
              />
              <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
