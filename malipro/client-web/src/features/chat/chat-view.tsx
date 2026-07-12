"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { api } from "@/mock/api";
import { useIsDesktop } from "@/hooks";
import { QueryState } from "@/components/ui/async-state";
import { ListRowSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { ThreadList } from "./thread-list";
import { Conversation } from "./conversation";

export function ChatView() {
  const threadsQuery = useQuery({ queryKey: ["chatThreads"], queryFn: () => api.chatThreads() });
  const isDesktop = useIsDesktop();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const threads = threadsQuery.data ?? [];

  // Sur desktop, ouvre la première conversation par défaut.
  React.useEffect(() => {
    if (isDesktop && !selectedId && threads.length > 0) setSelectedId(threads[0].id);
  }, [isDesktop, selectedId, threads]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <MessagesSquare className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Messages</h1>
          <p className="text-[13px] text-muted">Support, livreurs et commerçants en temps réel</p>
        </div>
      </div>

      <div className="flex h-[calc(100dvh-11rem)] overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:h-[calc(100dvh-9rem)]">
        {/* Colonne liste des conversations */}
        <div
          className={cn(
            "w-full shrink-0 md:w-80 md:border-r md:border-line",
            selected ? "hidden md:block" : "block",
          )}
        >
          <QueryState
            query={threadsQuery}
            skeleton={
              <div className="divide-y divide-line">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4">
                    <ListRowSkeleton />
                  </div>
                ))}
              </div>
            }
            isEmpty={(d) => d.length === 0}
            emptyState={
              <EmptyState
                icon={<MessagesSquare className="h-8 w-8" />}
                title="Aucune conversation"
                description="Vos échanges avec le support et les livreurs apparaîtront ici."
              />
            }
          >
            {(list) => <ThreadList threads={list} selectedId={selectedId} onSelect={setSelectedId} />}
          </QueryState>
        </div>

        {/* Colonne conversation */}
        <div className={cn("min-w-0 flex-1", selected ? "block" : "hidden md:block")}>
          {selected ? (
            <Conversation key={selected.id} thread={selected} onBack={() => setSelectedId(null)} />
          ) : (
            <EmptyState
              icon={<MessagesSquare className="h-8 w-8" />}
              title="Sélectionnez une conversation"
              description="Choisissez un échange dans la liste pour afficher les messages."
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
