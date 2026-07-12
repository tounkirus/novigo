"use client";

import * as React from "react";
import { Timer, ArrowRight, Check, AlertTriangle, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { NOW } from "@/constants";
import type { KitchenTicket, KitchenStatus } from "@/types/ops";

const CHANNEL_META: Record<KitchenTicket["channel"], { label: string; tone: "info" | "gold" | "neutral" }> = {
  DELIVERY: { label: "Livraison", tone: "info" },
  PICKUP: { label: "À emporter", tone: "gold" },
  DINE_IN: { label: "Sur place", tone: "neutral" },
};

export function TicketCard({
  ticket,
  onAdvance,
  onComplete,
}: {
  ticket: KitchenTicket;
  onAdvance: (t: KitchenTicket) => void;
  onComplete: (t: KitchenTicket) => void;
}) {
  const channel = CHANNEL_META[ticket.channel];
  const isReady = ticket.status === "READY";
  const isLate = ticket.status === "LATE";

  return (
    <div
      className={`rounded-2xl border bg-surface p-3.5 shadow-card ${
        isLate ? "border-error/40" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-ink">{ticket.ref}</span>
        <div className="flex items-center gap-1.5">
          {ticket.priority && (
            <Badge tone="error" className="gap-1"><Flame className="h-3 w-3" /> Prioritaire</Badge>
          )}
          <Badge tone={channel.tone}>{channel.label}</Badge>
        </div>
      </div>

      <p className="mt-1 text-[13px] text-muted">{ticket.customer}</p>

      <ul className="mt-2.5 space-y-1.5">
        {ticket.items.map((it, i) => (
          <li key={i} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="min-w-[1.5rem] shrink-0 font-semibold text-brand">{it.qty}×</span>
              <span className="text-ink">{it.name}</span>
            </div>
            {it.note && <p className="ml-[1.9rem] text-[12px] italic text-muted">Note : {it.note}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <span className={`inline-flex items-center gap-1.5 text-[12px] ${isLate ? "font-semibold text-error" : "text-muted"}`}>
          {isLate ? <AlertTriangle className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />}
          {isLate ? "En retard" : `ETA ${ticket.etaMin} min`}
          <span className="text-muted/70">· {timeAgo(ticket.placedAt, NOW)}</span>
        </span>

        {isReady ? (
          <Button size="sm" variant="success" onClick={() => onComplete(ticket)}>
            <Check className="h-4 w-4" /> Clôturer
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={() => onAdvance(ticket)}>
            {nextLabel(ticket.status)} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function nextLabel(status: KitchenStatus): string {
  switch (status) {
    case "WAITING":
      return "Commencer";
    case "LATE":
      return "Rattraper";
    default:
      return "Marquer prête";
  }
}
