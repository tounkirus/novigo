"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCoupons, createCoupon } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { Coupon } from "@/lib/api/types";

const cols: Column<Coupon>[] = [
  { key: "code", header: "Code", render: (c) => <span className="font-mono font-medium text-ink">{c.code}</span> },
  { key: "value", header: "Remise", render: (c) => (c.type === "PERCENT" ? `${c.value} %` : `${c.value} FCFA`) },
  { key: "min", header: "Min.", render: (c) => (c.minAmount ? `${c.minAmount} FCFA` : "—") },
  { key: "usage", header: "Usage", render: (c) => `${c.usedCount}/${c.usageLimit ?? "∞"}` },
  { key: "status", header: "État", render: (c) => <StatusBadge status={c.isActive ? "ACTIVE" : "SUSPENDED"} /> },
  { key: "exp", header: "Expire", align: "right", render: (c) => (c.expiresAt ? formatDate(c.expiresAt) : "—") },
];

export default function CouponsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["coupons"], queryFn: listCoupons });
  const [form, setForm] = useState({ code: "", type: "PERCENT", value: 10, minAmount: "", maxDiscount: "", usageLimit: "" });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => createCoupon({
      code: form.code.trim().toUpperCase(),
      type: form.type as "PERCENT" | "AMOUNT",
      value: Number(form.value),
      minAmount: form.minAmount ? Number(form.minAmount) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    }),
    onSuccess: () => {
      setError(null);
      setForm({ code: "", type: "PERCENT", value: 10, minAmount: "", maxDiscount: "", usageLimit: "" });
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Création impossible."),
  });

  return (
    <>
      <Topbar title="Coupons" />
      <main className="flex-1 space-y-4 p-6">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Nouveau coupon</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
            <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-brand focus:outline-none"
            >
              <option value="PERCENT">%</option>
              <option value="AMOUNT">FCFA</option>
            </select>
            <Input type="number" placeholder="Valeur" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
            <Input type="number" placeholder="Min." value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} />
            <Input type="number" placeholder="Plafond" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            <Input type="number" placeholder="Limite" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
          </div>
          {error && <p className="mt-2 text-xs text-[#B23A2E]">{error}</p>}
          <div className="mt-3 flex justify-end">
            <Button onClick={() => create.mutate()} disabled={!form.code.trim() || create.isPending}>
              {create.isPending ? "Création…" : "Créer le coupon"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Coupons actifs</h2>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucun coupon" />
        </div>
      </main>
    </>
  );
}
