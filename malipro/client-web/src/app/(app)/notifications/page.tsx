"use client";

import { useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";
import type { Notification } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/shared/icon";
import { useToast } from "@/components/ui/toast";
import { notifications } from "@/mock";
import { timeAgo } from "@/lib/utils";
import { NOW } from "@/constants";

type TabKey = "ALL" | "ORDER" | "PROMO" | "SYSTEM";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "Toutes" },
  { key: "ORDER", label: "Commandes" },
  { key: "PROMO", label: "Promos" },
  { key: "SYSTEM", label: "Système" },
];

function matchesTab(n: Notification, tab: TabKey): boolean {
  if (tab === "ALL") return true;
  if (tab === "SYSTEM") return n.type === "SYSTEM" || n.type === "WALLET";
  return n.type === tab;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(notifications.filter((n) => n.read).map((n) => n.id)),
  );

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAll = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    toast({ title: "Notifications lues", description: "Toutes vos notifications sont marquées comme lues.", tone: "success" });
  };

  const list = notifications.filter((n) => matchesTab(n, tab));

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Notifications</h1>
          <p className="text-[13px] text-muted">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={markAll} disabled={unreadCount === 0}>
          <CheckCheck className="h-4 w-4" />
          Tout marquer comme lu
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="flex w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="flex-1">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab}>
          {list.length === 0 ? (
            <EmptyState
              icon={<BellOff className="h-8 w-8" />}
              title="Aucune notification"
              description="Vous n'avez rien reçu dans cette catégorie pour le moment."
            />
          ) : (
            <div className="space-y-2">
              {list.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 shadow-card transition ${
                      isRead ? "border-line bg-surface" : "border-brand/30 bg-brand-soft/40"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <Icon name={n.icon ?? "Bell"} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{n.title}</p>
                        {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
                      <p className="mt-1 text-[12px] text-muted">{timeAgo(n.createdAt, NOW)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
