"use client";

import { motion } from "framer-motion";
import { Check, XCircle } from "lucide-react";
import type { OrderStatus } from "@/types";
import { ORDER_FLOW, ORDER_STATUS } from "@/constants";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TrackingTimeline({
  status,
  timeline,
}: {
  status: OrderStatus;
  timeline: { status: OrderStatus; at: string }[];
}) {
  const current = ORDER_STATUS[status].step;
  const times = new Map(timeline.map((t) => [t.status, t.at]));

  if (current < 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error-soft p-4">
        <XCircle className="h-6 w-6 shrink-0 text-error" />
        <div>
          <p className="text-sm font-semibold text-ink">{ORDER_STATUS[status].label}</p>
          <p className="text-[13px] text-muted">Cette commande n'a pas été livrée.</p>
        </div>
      </div>
    );
  }

  const last = ORDER_FLOW.length - 1;

  return (
    <ol>
      {ORDER_FLOW.map((st, i) => {
        const done = i < current;
        const active = i === current;
        const at = times.get(st);
        return (
          <motion.li
            key={st}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="flex gap-3.5"
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition",
                  done && "border-brand bg-brand text-white",
                  active && "border-brand bg-brand-soft text-brand",
                  !done && !active && "border-line bg-surface text-muted",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-line" />
                )}
              </span>
              {i < last && (
                <span className={cn("my-1 w-0.5 flex-1", i < current ? "bg-brand" : "bg-line")} style={{ minHeight: 22 }} />
              )}
            </div>
            <div className={cn("pb-5", i === last && "pb-0")}>
              <p className={cn("text-sm font-semibold", active || done ? "text-ink" : "text-muted")}>
                {ORDER_STATUS[st].label}
              </p>
              {at ? (
                <p className="text-[12px] text-muted">{formatTime(at)}</p>
              ) : active ? (
                <p className="text-[12px] font-medium text-brand">En cours…</p>
              ) : (
                <p className="text-[12px] text-muted">À venir</p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
