"use client";

import * as React from "react";
import { Search, Snowflake } from "lucide-react";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, Progress } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn, formatFcfa, clamp } from "@/lib/utils";
import type { CashRegister } from "@/types/wallet";
import { REGISTER_STATUS_META } from "./meta";

const PAGE_SIZE = 8;

type StatusFilter = "ALL" | CashRegister["status"];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "OK", label: "Conforme" },
  { value: "OVER_LIMIT", label: "Plafond dépassé" },
  { value: "NEGATIVE", label: "Solde négatif" },
  { value: "FROZEN", label: "Gelée" },
];

export function CashRegistersTable({ registers }: { registers: CashRegister[] }) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const [page, setPage] = React.useState(0);
  const [frozen, setFrozen] = React.useState<Record<string, boolean>>({});

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return registers.filter((r) => {
      const okStatus = status === "ALL" || r.status === status;
      const okQuery = !q || r.driverName.toLowerCase().includes(q);
      return okStatus && okQuery;
    });
  }, [registers, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  React.useEffect(() => {
    setPage(0);
  }, [query, status]);

  const freeze = (r: CashRegister) => {
    setFrozen((prev) => ({ ...prev, [r.driverId]: true }));
    toast({
      title: "Caisse gelée",
      description: `La caisse de ${r.driverName} a été gelée. Les encaissements sont suspendus.`,
      tone: "info",
    });
  };

  const columns: Column<CashRegister>[] = [
    {
      key: "driver",
      header: "Livreur",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar src={r.driverAvatar} alt={r.driverName} size={36} />
          <span className="font-semibold text-ink">{r.driverName}</span>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Solde caisse",
      align: "right",
      cell: (r) => (
        <span className={cn("font-semibold", r.balance < 0 ? "text-error" : "text-ink")}>
          {formatFcfa(r.balance)}
        </span>
      ),
    },
    {
      key: "collected",
      header: "Encaissé",
      align: "right",
      cell: (r) => <span className="text-muted">{formatFcfa(r.collectedToday)}</span>,
    },
    {
      key: "toRemit",
      header: "À reverser",
      align: "right",
      cell: (r) => <span className="font-medium text-ink">{formatFcfa(r.toRemit)}</span>,
    },
    {
      key: "remitted",
      header: "Remis",
      align: "right",
      cell: (r) => <span className="text-muted">{formatFcfa(r.remittedToday)}</span>,
    },
    {
      key: "fill",
      header: "Remplissage",
      cell: (r) => {
        const pct = clamp((r.balance / r.limit) * 100, 0, 100);
        const over = r.status === "OVER_LIMIT";
        return (
          <div className="w-32">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
              <span>{Math.round(pct)}%</span>
              <span>{formatFcfa(r.limit)}</span>
            </div>
            <Progress value={pct} className={cn("h-1.5", over && "[&>div]:bg-error")} />
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      cell: (r) => {
        const m = REGISTER_STATUS_META[r.status];
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (r) => {
        const isFrozen = frozen[r.driverId] || r.status === "FROZEN";
        return (
          <Button
            size="sm"
            variant="secondary"
            disabled={isFrozen}
            onClick={() => freeze(r)}
            aria-label={`Geler la caisse de ${r.driverName}`}
          >
            <Snowflake className="h-3.5 w-3.5" /> {isFrozen ? "Gelée" : "Geler"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher un livreur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.driverId}
        minWidth={900}
        empty="Aucune caisse ne correspond à votre recherche."
      />

      {filtered.length > PAGE_SIZE && (
        <Pagination page={safePage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
      )}
    </div>
  );
}
