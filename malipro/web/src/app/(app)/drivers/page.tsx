"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listDrivers } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import type { Driver, KycStatus } from "@/lib/api/types";

const KYC: { value: KycStatus | ""; label: string }[] = [
  { value: "PENDING", label: "À valider" },
  { value: "APPROVED", label: "Approuvés" },
  { value: "REJECTED", label: "Rejetés" },
  { value: "NOT_SUBMITTED", label: "Non soumis" },
  { value: "", label: "Tous" },
];

const cols: Column<Driver>[] = [
  {
    key: "driver",
    header: "Livreur",
    render: (d) => (
      <Link href={`/drivers/${d.id}`} className="block">
        <p className="font-medium text-brand hover:underline">{d.userName ?? "—"}</p>
        <p className="font-mono text-xs text-muted">{d.userPhone ?? d.id.slice(0, 8)}</p>
      </Link>
    ),
  },
  { key: "vehicle", header: "Véhicule", render: (d) => d.vehicleType ?? "—" },
  { key: "plate", header: "Plaque", render: (d) => d.plateNumber ?? "—" },
  { key: "kyc", header: "KYC", render: (d) => <StatusBadge status={d.kycStatus} /> },
  { key: "since", header: "Inscrit", align: "right", render: (d) => formatDate(d.createdAt) },
];

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const [kycStatus, setKycStatus] = useState<KycStatus | "">("PENDING");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["drivers", page, kycStatus, search],
    queryFn: () =>
      listDrivers({
        page,
        limit: 20,
        kycStatus: kycStatus || undefined,
        search: search || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Topbar title="Livreurs" />
      <main className="flex-1 p-6">
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">File de validation KYC</h2>
            <div className="flex gap-2">
              <input
                placeholder="Rechercher (nom, téléphone)…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
              />
              <select
                value={kycStatus}
                onChange={(e) => { setKycStatus(e.target.value as KycStatus | ""); setPage(1); }}
                className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
              >
                {KYC.map((k) => (
                  <option key={k.value || "all"} value={k.value}>{k.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DataTable columns={cols} rows={q.data?.data} loading={q.isLoading} emptyTitle="Aucun livreur dans cette file" />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </div>
      </main>
    </>
  );
}
