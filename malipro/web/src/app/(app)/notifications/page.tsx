"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { broadcastNotification } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";

const ROLES = ["", "CUSTOMER", "DRIVER", "ARTISAN", "MERCHANT"];

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);

  const send = useMutation({
    mutationFn: () => broadcastNotification({ title: title.trim(), body: body.trim(), targetRole: role || undefined }),
    onSuccess: (res) => {
      setError(null); setSent(res.data.sent);
      setTitle(""); setBody("");
    },
    onError: (e) => { setSent(null); setError(e instanceof ApiError ? e.message : "Envoi impossible."); },
  });

  return (
    <>
      <Topbar title="Notifications" />
      <main className="flex-1 p-6">
        <div className="max-w-xl rounded-xl border border-line bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Diffusion</h2>
          <p className="mt-0.5 text-xs text-muted">
            Envoie une notification (persistée + push temps réel) à tous les utilisateurs ou à un rôle.
          </p>

          <div className="mt-4 space-y-3">
            <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Message…"
              className="w-full resize-none rounded-lg border border-line p-2 text-sm focus:border-brand focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Cible :</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-brand focus:outline-none"
              >
                {ROLES.map((r) => <option key={r || "all"} value={r}>{r === "" ? "Tous" : r}</option>)}
              </select>
            </div>

            {error && <p className="text-xs text-[#B23A2E]">{error}</p>}
            {sent !== null && <p className="text-xs text-brand-dark">Envoyé à {sent} utilisateur(s).</p>}

            <div className="flex justify-end">
              <Button
                onClick={() => send.mutate()}
                disabled={!title.trim() || !body.trim() || send.isPending}
              >
                {send.isPending ? "Envoi…" : "Diffuser"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
