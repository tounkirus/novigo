"use client";

import * as React from "react";
import { Search, Download, FileText, Filter } from "lucide-react";
import type { WalletTransaction } from "@/types/wallet";
import { Icon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/states";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks";
import { formatFcfa, formatDate, formatTime, cn } from "@/lib/utils";
import {
  KIND_LABEL, STATUS_META, METHOD_LABEL, TX_FILTERS, matchesFilter, transactionsToCsv, downloadFile, receiptText,
} from "./tx-utils";

/** Liste de transactions réutilisable (recherche, filtres, export, reçus). */
export function TransactionList({ transactions, title = "Transactions" }: { transactions: WalletTransaction[]; title?: string }) {
  const { toast } = useToast();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<string>("ALL");
  const [receipt, setReceipt] = React.useState<WalletTransaction | null>(null);
  const dq = useDebounce(q, 200);

  const filtered = React.useMemo(() => {
    const lower = dq.toLowerCase();
    return transactions.filter(
      (t) => matchesFilter(t, filter) && (!lower || t.description.toLowerCase().includes(lower) || t.ref.toLowerCase().includes(lower) || KIND_LABEL[t.kind].toLowerCase().includes(lower)),
    );
  }, [transactions, filter, dq]);

  function exportCsv() {
    downloadFile(transactionsToCsv(filtered), `novigo-transactions-${filtered.length}.csv`);
    toast({ title: "Export CSV généré", description: `${filtered.length} transactions exportées`, tone: "success" });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <h3 className="mr-auto text-base font-semibold text-ink">{title}</h3>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4" /> CSV
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast({ title: "Relevé PDF en préparation", description: "Le document sera disponible dans vos reçus.", tone: "info" })}
        >
          <FileText className="h-4 w-4" /> PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher une transaction…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted" />
          {TX_FILTERS.map((f) => (
            <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="divide-y divide-line">
        {filtered.length === 0 ? (
          <EmptyState title="Aucune transaction" description="Aucune opération ne correspond à votre recherche." />
        ) : (
          filtered.slice(0, 40).map((t) => {
            const credit = t.amount > 0;
            const st = STATUS_META[t.status];
            return (
              <button key={t.id} onClick={() => setReceipt(t)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-shell">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", credit ? "bg-success-soft text-success" : "bg-brand-soft text-brand")}>
                  <Icon name={t.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{KIND_LABEL[t.kind]}</span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted">
                    {t.description} · {formatDate(t.createdAt)} · {formatTime(t.createdAt)}
                  </span>
                </span>
                <span className={cn("shrink-0 text-sm font-bold tabular-nums", credit ? "text-success" : "text-ink")}>
                  {credit ? "+" : "−"}
                  {formatFcfa(Math.abs(t.amount))}
                </span>
              </button>
            );
          })
        )}
      </div>

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reçu de transaction</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-shell p-4 font-mono text-[13px] leading-relaxed text-ink">
                <div className="flex justify-between"><span className="text-muted">Référence</span><span className="font-semibold">{receipt.ref}</span></div>
                <div className="flex justify-between"><span className="text-muted">Type</span><span>{KIND_LABEL[receipt.kind]}</span></div>
                <div className="flex justify-between"><span className="text-muted">Moyen</span><span>{METHOD_LABEL[receipt.method]}</span></div>
                <div className="flex justify-between"><span className="text-muted">Date</span><span>{formatDate(receipt.createdAt)} {formatTime(receipt.createdAt)}</span></div>
                <div className="mt-2 flex justify-between border-t border-line pt-2 text-base"><span className="font-semibold">Montant</span><span className="font-bold">{receipt.amount > 0 ? "+" : "−"}{formatFcfa(Math.abs(receipt.amount))}</span></div>
              </div>
              <div className="flex gap-2">
                <Button block variant="secondary" onClick={() => { downloadFile(receiptText(receipt), `recu-${receipt.ref}.txt`, "text/plain"); toast({ title: "Reçu téléchargé", tone: "success" }); }}>
                  <Download className="h-4 w-4" /> Télécharger le reçu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
