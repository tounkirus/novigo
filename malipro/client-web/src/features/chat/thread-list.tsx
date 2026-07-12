"use client";

import { motion } from "framer-motion";
import { LifeBuoy, Bike, Store as StoreIcon } from "lucide-react";
import type { ChatThread } from "@/types/modules";
import { Avatar } from "@/components/ui/misc";
import { cn, timeAgo } from "@/lib/utils";
import { NOW } from "@/constants";

const KIND_META: Record<
  ChatThread["kind"],
  { label: string; icon: typeof LifeBuoy; badge: string }
> = {
  SUPPORT: { label: "Support", icon: LifeBuoy, badge: "bg-info-soft text-info" },
  DRIVER: { label: "Livreur", icon: Bike, badge: "bg-brand-soft text-brand" },
  MERCHANT: { label: "Commerçant", icon: StoreIcon, badge: "bg-gold-soft text-gold-dark" },
};

export function ThreadList({
  threads,
  selectedId,
  onSelect,
}: {
  threads: ChatThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-line px-4 py-3">
        <p className="text-[13px] font-semibold text-muted">
          {threads.length} conversation{threads.length > 1 ? "s" : ""}
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {threads.map((t) => {
          const meta = KIND_META[t.kind];
          const active = t.id === selectedId;
          return (
            <li key={t.id}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelect(t.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-line/70 px-4 py-3 text-left transition-colors",
                  active ? "bg-brand-soft/60" : "hover:bg-shell",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar src={t.avatar} alt={t.name} size={46} />
                  {t.online && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-success"
                      aria-label="En ligne"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 flex-1 text-sm font-semibold text-ink">{t.name}</span>
                    <span className="shrink-0 text-[11px] text-muted">{timeAgo(t.lastAt, NOW)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        meta.badge,
                      )}
                    >
                      <meta.icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <span className="line-clamp-1 flex-1 text-[12px] text-muted">{t.lastMessage}</span>
                    {t.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
