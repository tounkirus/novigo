"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Zap, Hand } from "lucide-react";
import { api } from "@/mock/api";
import type { PayoutRequest } from "@/types/wallet";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { METHOD_LABEL } from "@/features/wallet/shared/tx-utils";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import { useAudit } from "./audit";
import { ROLE_LABEL, ROLE_TONE, PAYOUT_STATUS } from "./shared";

export function PayoutsTab() {
  const payoutsQ = useQuery({ queryKey: ["payoutRequests"], queryFn: () => api.payoutRequests() });
  const { toast } = useToast();
  const { log } = useAudit();
  const [override, setOverride] = React.useState<Record<string, PayoutRequest["status"]>>({});

  const statusOf = (p: PayoutRequest) => override[p.id] ?? p.status;

  function decide(p: PayoutRequest, approve: boolean) {
    setOverride((prev) => ({ ...prev, [p.id]: approve ? "APPROVED" : "REJECTED" }));
    toast({
      title: approve ? "Reversement approuvé" : "Reversement rejeté",
      description: `${p.ref} · ${p.ownerName} · ${formatFcfa(p.amount)}`,
      tone: approve ? "success" : "error",
    });
    log({
      action: approve ? "Reversement approuvé" : "Reversement rejeté",
      target: `${p.ownerName} (${p.ref})`,
      amount: p.amount,
      tone: approve ? "success" : "error",
    });
  }

  const columns: Column<PayoutRequest>[] = [
    { key: "ref", header: "Référence", cell: (p) => <span className="font-mono text-[13px] font-semibold text-ink">{p.ref}</span> },
    {
      key: "owner",
      header: "Bénéficiaire",
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{p.ownerName}</span>
          <Badge tone={ROLE_TONE[p.role]}>{ROLE_LABEL[p.role]}</Badge>
        </div>
      ),
    },
    { key: "amount", header: "Montant", align: "right", cell: (p) => <span className="font-bold text-ink">{formatFcfa(p.amount)}</span> },
    { key: "method", header: "Méthode", cell: (p) => <span className="text-muted">{METHOD_LABEL[p.method]}</span> },
    {
      key: "mode",
      header: "Traitement",
      cell: (p) => (
        <Badge tone={p.auto ? "info" : "neutral"}>
          {p.auto ? <Zap className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
          {p.auto ? "Auto" : "Manuel"}
        </Badge>
      ),
    },
    { key: "status", header: "Statut", cell: (p) => { const s = PAYOUT_STATUS[statusOf(p)]; return <Badge tone={s.tone}>{s.label}</Badge>; } },
    { key: "date", header: "Demandé", cell: (p) => <span className="text-muted">{timeAgo(p.createdAt, NOW)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) => {
        const pending = statusOf(p) === "PENDING";
        return (
          <div className="flex justify-end gap-2">
            <Button variant="success" size="sm" disabled={!pending} onClick={() => decide(p, true)}>
              <Check className="h-4 w-4" /> Approuver
            </Button>
            <Button variant="danger" size="sm" disabled={!pending} onClick={() => decide(p, false)}>
              <X className="h-4 w-4" /> Rejeter
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <QueryState query={payoutsQ} skeleton={<TableSkeleton rows={8} cols={8} />} isEmpty={(d) => d.length === 0}>
        {(payouts) => (
          <DataTable columns={columns} rows={payouts} getRowKey={(p) => p.id} minWidth={940} empty="Aucune demande de reversement." />
        )}
      </QueryState>
    </div>
  );
}
