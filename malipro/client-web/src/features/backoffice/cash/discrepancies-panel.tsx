"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ArrowUpCircle } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import type { CashDiscrepancy } from "@/types/wallet";
import { SEVERITY_META, DISCREPANCY_STATUS_META } from "./meta";

type Action = "RESOLVED" | "ESCALATED";

export function DiscrepanciesPanel({ discrepancies }: { discrepancies: CashDiscrepancy[] }) {
  const { toast } = useToast();
  const [actions, setActions] = React.useState<Record<string, Action>>({});

  const effectiveStatus = (d: CashDiscrepancy): CashDiscrepancy["status"] =>
    actions[d.id] === "RESOLVED" ? "RESOLVED" : d.status;

  const highOpen = discrepancies.filter((d) => d.severity === "HIGH" && effectiveStatus(d) === "OPEN").length;

  const resolve = (d: CashDiscrepancy) => {
    setActions((prev) => ({ ...prev, [d.id]: "RESOLVED" }));
    toast({
      title: "Écart résolu",
      description: `L'écart ${d.ref} (${formatFcfa(d.amount)}) a été marqué comme résolu.`,
      tone: "success",
    });
  };

  const escalate = (d: CashDiscrepancy) => {
    setActions((prev) => ({ ...prev, [d.id]: "ESCALATED" }));
    toast({
      title: "Écart escaladé",
      description: `L'écart ${d.ref} a été transmis à l'équipe fraude & conformité.`,
      tone: "info",
    });
  };

  const columns: Column<CashDiscrepancy>[] = [
    {
      key: "ref",
      header: "Référence",
      cell: (d) => <span className="font-semibold text-ink">{d.ref}</span>,
    },
    {
      key: "driver",
      header: "Livreur",
      cell: (d) => <span className="text-ink">{d.driverName}</span>,
    },
    {
      key: "amount",
      header: "Montant",
      align: "right",
      cell: (d) => <span className="font-semibold text-ink">{formatFcfa(d.amount)}</span>,
    },
    {
      key: "reason",
      header: "Raison",
      cell: (d) => <span className="text-muted">{d.reason}</span>,
    },
    {
      key: "severity",
      header: "Sévérité",
      cell: (d) => {
        const m = SEVERITY_META[d.severity];
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
    {
      key: "status",
      header: "Statut",
      cell: (d) => {
        const m = DISCREPANCY_STATUS_META[effectiveStatus(d)];
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
    {
      key: "date",
      header: "Date",
      cell: (d) => <span className="text-muted">{timeAgo(d.createdAt, NOW)}</span>,
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      cell: (d) => {
        const done = actions[d.id];
        if (done || effectiveStatus(d) === "RESOLVED") {
          return (
            <span className="text-[13px] font-medium text-muted">
              {done === "ESCALATED" ? "Escaladé" : "Résolu"}
            </span>
          );
        }
        return (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="success" onClick={() => resolve(d)}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Résoudre
            </Button>
            <Button size="sm" variant="secondary" onClick={() => escalate(d)}>
              <ArrowUpCircle className="h-3.5 w-3.5" /> Escalader
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      {highOpen > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error-soft p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <div>
            <p className="font-semibold text-error">
              {highOpen} écart{highOpen > 1 ? "s" : ""} à sévérité élevée non résolu{highOpen > 1 ? "s" : ""}
            </p>
            <p className="text-[13px] text-ink">
              Traitez ces cas en priorité — risque de fraude ou de perte financière.
            </p>
          </div>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={discrepancies}
        getRowKey={(d) => d.id}
        minWidth={920}
        empty="Aucun écart détecté."
      />
    </div>
  );
}
