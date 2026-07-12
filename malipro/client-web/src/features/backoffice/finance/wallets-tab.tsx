"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, MoreHorizontal, Snowflake, Sun, Plus, Minus, RotateCcw, Eye,
} from "lucide-react";
import { api } from "@/mock/api";
import type { WalletAccount, WalletRole, WalletStatus } from "@/types/wallet";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DataTable, Pagination, type Column } from "@/components/dashboard/data-table";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/misc";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { NOW } from "@/constants";
import { formatFcfa, timeAgo } from "@/lib/utils";
import { useAudit } from "./audit";
import { ROLE_LABEL, ROLE_TONE, WALLET_STATUS } from "./shared";

const PAGE_SIZE = 10;

type MoneyKind = "credit" | "debit" | "refund";
const MONEY_META: Record<MoneyKind, { title: string; verb: string; sign: 1 | -1; tone: "success" | "error" | "warning" }> = {
  credit: { title: "Créditer le wallet", verb: "Crédit", sign: 1, tone: "success" },
  debit: { title: "Débiter le wallet", verb: "Débit", sign: -1, tone: "error" },
  refund: { title: "Rembourser depuis le wallet", verb: "Remboursement", sign: -1, tone: "warning" },
};

export function WalletsTab() {
  const walletsQ = useQuery({ queryKey: ["walletAccounts"], queryFn: () => api.walletAccounts(60) });
  const { toast } = useToast();
  const { log } = useAudit();

  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState<"ALL" | WalletRole>("ALL");
  const [page, setPage] = React.useState(0);

  // Overrides locaux (déterministes, sans persistance réelle).
  const [statusOverride, setStatusOverride] = React.useState<Record<string, WalletStatus>>({});
  const [balanceDelta, setBalanceDelta] = React.useState<Record<string, number>>({});

  // Dialogs.
  const [money, setMoney] = React.useState<{ wallet: WalletAccount; kind: MoneyKind } | null>(null);
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState<WalletAccount | null>(null);

  React.useEffect(() => setPage(0), [query, role]);

  const statusOf = React.useCallback(
    (w: WalletAccount): WalletStatus => statusOverride[w.id] ?? w.status,
    [statusOverride],
  );
  const balanceOf = React.useCallback(
    (w: WalletAccount): number => w.balance + (balanceDelta[w.id] ?? 0),
    [balanceDelta],
  );

  function toggleFreeze(w: WalletAccount) {
    const next: WalletStatus = statusOf(w) === "FROZEN" ? "ACTIVE" : "FROZEN";
    setStatusOverride((p) => ({ ...p, [w.id]: next }));
    const frozen = next === "FROZEN";
    toast({
      title: frozen ? "Wallet gelé" : "Wallet débloqué",
      description: `${w.ownerName} — ${frozen ? "les opérations sont suspendues" : "les opérations reprennent"}.`,
      tone: frozen ? "error" : "success",
    });
    log({ action: frozen ? "Gel du wallet" : "Déblocage du wallet", target: w.ownerName, tone: frozen ? "error" : "success" });
  }

  function openMoney(wallet: WalletAccount, kind: MoneyKind) {
    setMoney({ wallet, kind });
    setAmount("");
    setReason("");
  }

  function confirmMoney() {
    if (!money) return;
    const value = Number.parseInt(amount, 10);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant supérieur à zéro.", tone: "error" });
      return;
    }
    const meta = MONEY_META[money.kind];
    setBalanceDelta((p) => ({ ...p, [money.wallet.id]: (p[money.wallet.id] ?? 0) + meta.sign * value }));
    toast({
      title: `${meta.verb} enregistré`,
      description: `${formatFcfa(value)} · ${money.wallet.ownerName}${reason ? ` — ${reason}` : ""}`,
      tone: "success",
    });
    log({ action: meta.verb, target: money.wallet.ownerName + (reason ? ` — ${reason}` : ""), amount: value, tone: meta.tone });
    setMoney(null);
  }

  const filtered = React.useMemo(() => {
    if (!walletsQ.data) return [];
    const q = query.trim().toLowerCase();
    return walletsQ.data.filter(
      (w) => (role === "ALL" || w.role === role) && (q === "" || w.ownerName.toLowerCase().includes(q)),
    );
  }, [walletsQ.data, query, role]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const columns: Column<WalletAccount>[] = [
    {
      key: "owner",
      header: "Titulaire",
      cell: (w) => (
        <div className="flex items-center gap-3">
          <Avatar src={w.ownerAvatar} alt={w.ownerName} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{w.ownerName}</p>
            <p className="font-mono text-[11px] text-muted">{w.id}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Rôle", cell: (w) => <Badge tone={ROLE_TONE[w.role]}>{ROLE_LABEL[w.role]}</Badge> },
    { key: "balance", header: "Solde", align: "right", cell: (w) => <span className="font-bold text-ink">{formatFcfa(balanceOf(w))}</span> },
    { key: "pending", header: "En attente", align: "right", cell: (w) => <span className="text-muted">{formatFcfa(w.pending)}</span> },
    {
      key: "status",
      header: "Statut",
      cell: (w) => {
        const s = WALLET_STATUS[statusOf(w)];
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: "activity",
      header: "Dernière activité",
      cell: (w) => <span className="text-muted">{w.transactions[0] ? timeAgo(w.transactions[0].createdAt, NOW) : "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (w) => {
        const frozen = statusOf(w) === "FROZEN";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${w.ownerName}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{w.ownerName}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setDetails(w)}>
                <Eye className="h-4 w-4" /> Détails du wallet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => toggleFreeze(w)}>
                {frozen ? <Sun className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
                {frozen ? "Débloquer" : "Geler"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openMoney(w, "credit")}>
                <Plus className="h-4 w-4" /> Créditer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openMoney(w, "debit")}>
                <Minus className="h-4 w-4" /> Débiter
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openMoney(w, "refund")}>
                <RotateCcw className="h-4 w-4" /> Rembourser
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher un titulaire…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs flex-1"
        />
        <Select value={role} onValueChange={(v) => setRole(v as "ALL" | WalletRole)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les rôles</SelectItem>
            <SelectItem value="CLIENT">{ROLE_LABEL.CLIENT}</SelectItem>
            <SelectItem value="DRIVER">{ROLE_LABEL.DRIVER}</SelectItem>
            <SelectItem value="MERCHANT">{ROLE_LABEL.MERCHANT}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <QueryState query={walletsQ} skeleton={<TableSkeleton rows={10} cols={7} />} isEmpty={(d) => d.length === 0}>
        {() => (
          <>
            <DataTable columns={columns} rows={rows} getRowKey={(w) => w.id} minWidth={880} empty="Aucun wallet trouvé." />
            <Pagination page={current} pageCount={pageCount} total={filtered.length} onPage={setPage} />
          </>
        )}
      </QueryState>

      {/* Dialog crédit / débit / remboursement */}
      <Dialog open={money != null} onOpenChange={(o) => !o && setMoney(null)}>
        <DialogContent>
          {money && (
            <>
              <DialogHeader>
                <DialogTitle>{MONEY_META[money.kind].title}</DialogTitle>
                <DialogDescription>
                  {money.wallet.ownerName} · solde actuel {formatFcfa(balanceOf(money.wallet))}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mp-amount">Montant (FCFA)</Label>
                  <Input
                    id="mp-amount"
                    inputMode="numeric"
                    placeholder="Ex. 25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mp-reason">Motif</Label>
                  <Textarea
                    id="mp-reason"
                    placeholder="Raison de l'opération (facultatif)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="secondary">Annuler</Button>
                </DialogClose>
                <Button onClick={confirmMoney}>Confirmer</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog détails wallet */}
      <Dialog open={details != null} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent>
          {details && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar src={details.ownerAvatar} alt={details.ownerName} size={44} />
                  <div>
                    <DialogTitle>{details.ownerName}</DialogTitle>
                    <DialogDescription>
                      <Badge tone={ROLE_TONE[details.role]}>{ROLE_LABEL[details.role]}</Badge>{" "}
                      <span className="font-mono">{details.id}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <Info label="Solde" value={formatFcfa(balanceOf(details))} strong />
                <Info label="En attente" value={formatFcfa(details.pending)} />
                <Info label="Entrées (mois)" value={formatFcfa(details.monthlyIn)} />
                <Info label="Sorties (mois)" value={formatFcfa(details.monthlyOut)} />
                <Info label="Plafond quotidien" value={formatFcfa(details.dailyLimit)} />
                <Info label="Transactions" value={String(details.transactions.length)} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-line bg-shell/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">Compte actif</p>
                  <p className="text-[12px] text-muted">Désactiver gèle immédiatement le wallet.</p>
                </div>
                <Switch
                  checked={statusOf(details) !== "FROZEN"}
                  onCheckedChange={() => toggleFreeze(details)}
                  aria-label="Basculer le statut du wallet"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="success" size="sm" onClick={() => { const w = details; setDetails(null); openMoney(w, "credit"); }}>
                  <Plus className="h-4 w-4" /> Créditer
                </Button>
                <Button variant="danger" size="sm" onClick={() => { const w = details; setDetails(null); openMoney(w, "debit"); }}>
                  <Minus className="h-4 w-4" /> Débiter
                </Button>
                <DialogClose asChild>
                  <Button variant="secondary" size="sm">Fermer</Button>
                </DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-shell/40 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={strong ? "text-base font-bold text-ink" : "text-sm font-semibold text-ink"}>{value}</p>
    </div>
  );
}
