"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MoreHorizontal, Eye, Archive, ShieldX } from "lucide-react";
import { api } from "@/mock/api";
import type { FraudAlert, FraudStatus } from "@/types/ops";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import { useAudit } from "./audit";
import { ROLE_LABEL, ROLE_TONE, FRAUD_TYPE_LABEL, FRAUD_RISK, FRAUD_STATUS } from "./shared";

const ACTIONS: { key: FraudStatus; label: string; verb: string; tone: "info" | "neutral" | "error"; icon: React.ReactNode }[] = [
  { key: "REVIEWING", label: "Examiner", verb: "Alerte mise en examen", tone: "info", icon: <Eye className="h-4 w-4" /> },
  { key: "CLEARED", label: "Classer", verb: "Alerte classée", tone: "neutral", icon: <Archive className="h-4 w-4" /> },
  { key: "CONFIRMED", label: "Confirmer la fraude", verb: "Fraude confirmée", tone: "error", icon: <ShieldX className="h-4 w-4" /> },
];

export function FraudTab() {
  const fraudQ = useQuery({ queryKey: ["fraudAlerts"], queryFn: () => api.fraudAlerts() });
  const { toast } = useToast();
  const { log } = useAudit();
  const [override, setOverride] = React.useState<Record<string, FraudStatus>>({});

  const statusOf = React.useCallback((a: FraudAlert) => override[a.id] ?? a.status, [override]);

  function apply(a: FraudAlert, action: (typeof ACTIONS)[number]) {
    setOverride((prev) => ({ ...prev, [a.id]: action.key }));
    toast({ title: action.verb, description: `${a.ref} · ${a.subject}`, tone: action.tone === "neutral" ? "info" : action.tone });
    log({ action: action.verb, target: `${a.subject} (${a.ref})`, amount: a.amount, tone: FRAUD_RISK[a.risk].tone });
  }

  const highOpen = React.useMemo(
    () => (fraudQ.data ?? []).filter((a) => a.risk === "HIGH" && statusOf(a) === "OPEN").length,
    [fraudQ.data, statusOf],
  );

  const columns: Column<FraudAlert>[] = [
    { key: "ref", header: "Réf.", cell: (a) => <span className="font-mono text-[13px] font-semibold text-ink">{a.ref}</span> },
    { key: "type", header: "Type", cell: (a) => <Badge tone="neutral">{FRAUD_TYPE_LABEL[a.type]}</Badge> },
    {
      key: "subject",
      header: "Sujet",
      cell: (a) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{a.subject}</span>
          <Badge tone={ROLE_TONE[a.subjectRole]}>{ROLE_LABEL[a.subjectRole]}</Badge>
        </div>
      ),
    },
    { key: "amount", header: "Montant", align: "right", cell: (a) => <span className="font-bold text-ink">{formatFcfa(a.amount)}</span> },
    { key: "risk", header: "Risque", cell: (a) => { const r = FRAUD_RISK[a.risk]; return <Badge tone={r.tone}>{r.label}</Badge>; } },
    { key: "status", header: "Statut", cell: (a) => { const s = FRAUD_STATUS[statusOf(a)]; return <Badge tone={s.tone}>{s.label}</Badge>; } },
    { key: "reason", header: "Raison", cell: (a) => <span className="text-muted">{a.reason}</span> },
    { key: "date", header: "Détectée", cell: (a) => <span className="text-muted">{timeAgo(a.createdAt, NOW)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions pour l'alerte ${a.ref}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{a.ref}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ACTIONS.map((action) => (
              <DropdownMenuItem key={action.key} disabled={statusOf(a) === action.key} onSelect={() => apply(a, action)}>
                {action.icon} {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {highOpen > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error-soft px-4 py-3.5 text-error">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">
              {highOpen} alerte{highOpen > 1 ? "s" : ""} à risque élevé en attente de traitement
            </p>
            <p className="text-[13px] opacity-90">Examinez ces cas en priorité pour limiter l&apos;exposition financière.</p>
          </div>
        </div>
      )}

      <QueryState query={fraudQ} skeleton={<TableSkeleton rows={8} cols={9} />} isEmpty={(d) => d.length === 0}>
        {(alerts) => (
          <DataTable columns={columns} rows={alerts} getRowKey={(a) => a.id} minWidth={1040} empty="Aucune alerte de fraude." />
        )}
      </QueryState>
    </div>
  );
}
