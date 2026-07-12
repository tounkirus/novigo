"use client";

import * as React from "react";
import { ScrollText, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NOW } from "@/constants";
import { useSession } from "@/features/auth/session";
import { formatFcfa, timeAgo } from "@/lib/utils";
import type { Tone } from "./shared";

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  amount?: number;
  tone: Tone;
  createdAt: string;
}

interface AuditCtx {
  entries: AuditEntry[];
  log: (e: { action: string; target: string; amount?: number; tone?: Tone }) => void;
}

const Ctx = React.createContext<AuditCtx | null>(null);

/** Journal d'audit local partagé par tous les onglets financiers. */
export function AuditProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const counter = React.useRef(0);

  const log = React.useCallback<AuditCtx["log"]>(
    ({ action, target, amount, tone = "neutral" }) => {
      counter.current += 1;
      setEntries((prev) => [
        {
          id: `audit_${counter.current}`,
          actor: user.name,
          action,
          target,
          amount,
          tone,
          // Déterministe : horodaté à l'instant de référence de la plateforme.
          createdAt: new Date(NOW).toISOString(),
        },
        ...prev,
      ]);
    },
    [user.name],
  );

  const value = React.useMemo<AuditCtx>(() => ({ entries, log }), [entries, log]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAudit() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAudit doit être utilisé dans <AuditProvider>");
  return ctx;
}

/** Affichage du journal d'audit (en bas de page). */
export function AuditJournal() {
  const { entries } = useAudit();
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <ScrollText className="h-[18px] w-[18px]" />
        </span>
        <div>
          <CardTitle>Journal d&apos;audit</CardTitle>
          <CardDescription>Traçabilité des actions financières de cette session.</CardDescription>
        </div>
      </CardHeader>
      {entries.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">
          Aucune action enregistrée pour l&apos;instant. Chaque opération (gel, crédit, reversement, alerte…) apparaîtra ici.
        </p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-shell text-muted">
                <User className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  <span className="font-semibold">{e.actor}</span>{" "}
                  <Badge tone={e.tone} className="mx-1 align-middle">
                    {e.action}
                  </Badge>{" "}
                  <span className="text-muted">{e.target}</span>
                </p>
                <p className="text-[12px] text-muted">{timeAgo(e.createdAt, NOW)}</p>
              </div>
              {e.amount != null && (
                <span className="shrink-0 text-sm font-bold text-ink">{formatFcfa(e.amount)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
