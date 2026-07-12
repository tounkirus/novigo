"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommissions, updateCommissions } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { CommissionSettings } from "@/lib/api/types";

const FIELDS: { key: keyof CommissionSettings; label: string; hint: string }[] = [
  { key: "deliveryPercent", label: "Livraison", hint: "Part prélevée sur chaque course livreur." },
  { key: "merchantPercent", label: "Commerçants", hint: "Part prélevée sur les ventes des boutiques." },
  { key: "artisanPercent", label: "Artisans", hint: "Part prélevée sur les prestations artisans." },
];

export default function CommissionsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["commissions"], queryFn: getCommissions });

  const [form, setForm] = useState<CommissionSettings>({
    deliveryPercent: 0, merchantPercent: 0, artisanPercent: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (q.data?.data) {
      const { deliveryPercent, merchantPercent, artisanPercent } = q.data.data;
      setForm({ deliveryPercent, merchantPercent, artisanPercent });
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => updateCommissions(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commissions"] });
      setError(null); setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Enregistrement impossible."),
  });

  function setField(key: keyof CommissionSettings, value: string) {
    const n = Number(value);
    setForm((f) => ({ ...f, [key]: Number.isFinite(n) ? n : 0 }));
    setSaved(false);
  }

  const invalid = FIELDS.some(({ key }) => {
    const v = form[key] as number;
    return v < 0 || v > 100;
  });

  return (
    <>
      <Topbar title="Commissions" />
      <main className="flex-1 p-6">
        <div className="max-w-xl rounded-xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Grille des commissions</h2>
            <p className="mt-0.5 text-xs text-muted">
              Taux appliqués par catégorie. La modification requiert le rôle SUPER_ADMIN.
            </p>
          </div>

          <div className="space-y-4 p-4">
            {q.isLoading && <Skeleton className="h-40 w-full" />}

            {q.data && (
              <>
                {FIELDS.map(({ key, label, hint }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div>
                      <label className="text-sm font-medium text-ink">{label}</label>
                      <p className="text-xs text-muted">{hint}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={form[key] as number}
                        onChange={(e) => setField(key, e.target.value)}
                        className="h-10 w-24 rounded-lg border border-line bg-surface px-3 text-right font-mono text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                      <span className="text-sm text-muted">%</span>
                    </div>
                  </div>
                ))}

                {invalid && (
                  <p className="rounded-lg bg-gold-soft px-3 py-2 text-xs text-[#8A6A12]">
                    Chaque taux doit être compris entre 0 et 100.
                  </p>
                )}
                {error && (
                  <p className="rounded-lg bg-[#FBE9E7] px-3 py-2 text-xs text-[#B23A2E]">{error}</p>
                )}

                <div className="flex items-center justify-between border-t border-line pt-4">
                  <p className="text-xs text-muted">
                    {q.data.data.updatedAt ? `Modifié le ${formatDate(q.data.data.updatedAt)}` : "\u00A0"}
                  </p>
                  <div className="flex items-center gap-3">
                    {saved && <span className="text-xs font-medium text-brand-dark">Enregistré ✓</span>}
                    <Button onClick={() => save.mutate()} disabled={save.isPending || invalid}>
                      {save.isPending ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
