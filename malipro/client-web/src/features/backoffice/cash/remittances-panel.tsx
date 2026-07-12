"use client";

import * as React from "react";
import { Check, X, ShieldAlert, FileText } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import type { CashRemittance } from "@/types/wallet";
import { REMITTANCE_METHOD_META, REMITTANCE_STATUS_META, DOUBLE_VALIDATION_THRESHOLD } from "./meta";

type Decision = "VALIDATED" | "REJECTED";

/** Dialog de double validation pour les remises importantes. */
function DoubleValidationDialog({
  remittance,
  onConfirm,
}: {
  remittance: CashRemittance;
  onConfirm: () => void;
}) {
  const [firstOk, setFirstOk] = React.useState(false);

  return (
    <Dialog onOpenChange={() => setFirstOk(false)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="success">
          <Check className="h-3.5 w-3.5" /> Valider
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" /> Double validation requise
          </DialogTitle>
          <DialogDescription>
            Cette remise de <span className="font-semibold text-ink">{formatFcfa(remittance.amount)}</span> dépasse le
            seuil de {formatFcfa(DOUBLE_VALIDATION_THRESHOLD)}. Deux confirmations sont nécessaires.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl border border-line bg-shell/50 p-4 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">Livreur</span>
            <span className="font-semibold text-ink">{remittance.driverName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Référence</span>
            <span className="font-medium text-ink">{remittance.ref}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {!firstOk ? (
            <Button block variant="secondary" onClick={() => setFirstOk(true)}>
              1re confirmation
            </Button>
          ) : (
            <DialogClose asChild>
              <Button block variant="success" onClick={onConfirm}>
                <Check className="h-4 w-4" /> Confirmer définitivement
              </Button>
            </DialogClose>
          )}
          <DialogClose asChild>
            <Button block variant="ghost">
              Annuler
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RemittancesPanel({ remittances }: { remittances: CashRemittance[] }) {
  const { toast } = useToast();
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>({});

  // PENDING d'abord, puis le reste
  const ordered = React.useMemo(() => {
    const rank = (r: CashRemittance) => (decisions[r.id] ? 2 : r.status === "PENDING" ? 0 : 1);
    return [...remittances].sort((a, b) => rank(a) - rank(b));
  }, [remittances, decisions]);

  const pendingCount = remittances.filter((r) => r.status === "PENDING" && !decisions[r.id]).length;

  const decide = (r: CashRemittance, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [r.id]: decision }));
    if (decision === "VALIDATED") {
      toast({
        title: "Remise validée",
        description: `${formatFcfa(r.amount)} — reçu REC-${r.ref.replace(/\D/g, "").slice(0, 5)} généré.`,
        tone: "success",
      });
    } else {
      toast({
        title: "Remise refusée",
        description: `La remise ${r.ref} de ${r.driverName} a été rejetée.`,
        tone: "error",
      });
    }
  };

  const effectiveStatus = (r: CashRemittance) => decisions[r.id] ?? r.status;

  const columns: Column<CashRemittance>[] = [
    {
      key: "ref",
      header: "Référence",
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-ink">{r.ref}</span>
          {r.amount > DOUBLE_VALIDATION_THRESHOLD && (
            <Badge tone="warning">
              <ShieldAlert className="h-3 w-3" /> Double
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "driver",
      header: "Livreur",
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={r.driverAvatar} alt={r.driverName} size={30} />
          <span className="text-ink">{r.driverName}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      align: "right",
      cell: (r) => <span className="font-semibold text-ink">{formatFcfa(r.amount)}</span>,
    },
    {
      key: "method",
      header: "Méthode",
      cell: (r) => {
        const m = REMITTANCE_METHOD_META[r.method];
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
    {
      key: "status",
      header: "Statut",
      cell: (r) => {
        const m = REMITTANCE_STATUS_META[effectiveStatus(r)];
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
    {
      key: "date",
      header: "Date",
      cell: (r) => <span className="text-muted">{timeAgo(r.createdAt, NOW)}</span>,
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      cell: (r) => {
        const decided = decisions[r.id];
        if (decided) {
          return (
            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted">
              <FileText className="h-3.5 w-3.5" /> {decided === "VALIDATED" ? "Reçu généré" : "Refusée"}
            </span>
          );
        }
        if (r.status !== "PENDING") {
          return <span className="text-muted">—</span>;
        }
        return (
          <div className="flex items-center justify-end gap-2">
            {r.amount > DOUBLE_VALIDATION_THRESHOLD ? (
              <DoubleValidationDialog remittance={r} onConfirm={() => decide(r, "VALIDATED")} />
            ) : (
              <Button size="sm" variant="success" onClick={() => decide(r, "VALIDATED")}>
                <Check className="h-3.5 w-3.5" /> Valider
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => decide(r, "REJECTED")}>
              <X className="h-3.5 w-3.5" /> Refuser
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Remises en attente de validation, priorité aux plus anciennes.
        </p>
        {pendingCount > 0 && (
          <Badge tone="warning">
            {pendingCount} remise{pendingCount > 1 ? "s" : ""} à traiter
          </Badge>
        )}
      </div>
      <DataTable
        columns={columns}
        rows={ordered}
        getRowKey={(r) => r.id}
        minWidth={880}
        empty="Aucune remise à valider."
      />
    </div>
  );
}
