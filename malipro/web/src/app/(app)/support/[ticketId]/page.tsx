"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupportTicket, replySupportTicket, updateSupportTicket } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

const STATUSES = ["OPEN", "PENDING", "RESOLVED", "CLOSED"];

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ticket", ticketId], queryFn: () => getSupportTicket(ticketId) });
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reply = useMutation({
    mutationFn: () => replySupportTicket(ticketId, text),
    onSuccess: () => { setText(""); setError(null); qc.invalidateQueries({ queryKey: ["ticket", ticketId] }); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Envoi impossible."),
  });
  const setStatus = useMutation({
    mutationFn: (status: string) => updateSupportTicket(ticketId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ticket", ticketId] }),
  });

  const t = q.data?.data;

  return (
    <>
      <Topbar title="Ticket support" />
      <main className="flex-1 p-6">
        {q.isLoading && <Skeleton className="h-64 w-full max-w-2xl" />}
        {t && (
          <div className="max-w-2xl space-y-4">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{t.subject}</h2>
                  <p className="text-xs text-muted">{t.category} · ouvert le {formatDate(t.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <select
                    value={t.status}
                    onChange={(e) => setStatus.mutate(e.target.value)}
                    className="h-8 rounded-lg border border-line bg-surface px-2 text-xs text-ink focus:border-brand focus:outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {t.messages?.map((m) => (
                <div
                  key={m.id}
                  className={
                    "max-w-[85%] rounded-xl border border-line px-3 py-2 text-sm " +
                    (m.isStaff ? "ml-auto bg-brand-soft text-ink" : "bg-surface text-ink")
                  }
                >
                  <p>{m.body}</p>
                  <p className="mt-1 text-[10px] text-muted">
                    {m.isStaff ? "Agent" : "Client"} · {formatDate(m.createdAt)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Répondre au client…"
                className="w-full resize-none rounded-lg border border-line p-2 text-sm focus:border-brand focus:outline-none"
              />
              {error && <p className="mt-1 text-xs text-[#B23A2E]">{error}</p>}
              <div className="mt-2 flex justify-end">
                <Button onClick={() => reply.mutate()} disabled={!text.trim() || reply.isPending}>
                  {reply.isPending ? "Envoi…" : "Envoyer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
