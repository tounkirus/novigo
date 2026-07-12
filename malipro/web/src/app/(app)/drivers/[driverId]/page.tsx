"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDriver, validateDriver } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

const DOC_LABEL: Record<string, string> = {
  ID_CARD: "Pièce d'identité",
  DRIVER_LICENSE: "Permis de conduire",
  VEHICLE_REG: "Carte grise",
  INSURANCE: "Assurance",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

export default function DriverReviewPage() {
  const { driverId } = useParams<{ driverId: string }>();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const driver = useQuery({ queryKey: ["driver", driverId], queryFn: () => getDriver(driverId) });

  const decide = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED") =>
      validateDriver(driverId, decision, decision === "REJECTED" ? reason : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver", driverId] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Action impossible."),
  });

  const d = driver.data?.data;
  const pending = d?.kycStatus === "PENDING";

  return (
    <>
      <Topbar title="Validation KYC" />
      <main className="flex-1 space-y-4 p-6">
        <Link href="/drivers" className="text-sm text-brand hover:underline">
          ← Retour aux livreurs
        </Link>

        {driver.isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
        {driver.isError && (
          <div className="rounded-xl bg-[#FBE9E7] px-4 py-3 text-sm text-[#B23A2E]">Livreur introuvable.</div>
        )}

        {d && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-ink">{d.userName ?? "Livreur"}</p>
                <p className="font-mono text-xs text-muted">{d.userPhone ?? d.id}</p>
              </div>
              <StatusBadge status={d.kycStatus} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Profil">
                <Row label="Véhicule" value={d.vehicleType ?? "—"} />
                <Row label="Plaque" value={d.plateNumber ?? "—"} />
                <Row label="Note" value={d.rating != null ? d.rating.toFixed(1) : "—"} />
                <Row label="Courses" value={d.totalDeliveries ?? 0} />
                <Row label="Inscrit" value={formatDate(d.createdAt)} />
              </Card>

              <Card title="Documents">
                {d.documents && d.documents.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {d.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between py-2.5 text-sm">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline"
                        >
                          {DOC_LABEL[doc.type] ?? doc.type}
                        </a>
                        <StatusBadge status={doc.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Aucun document fourni.</p>
                )}
              </Card>
            </div>

            <Card title="Décision">
              {pending ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Motif (requis en cas de rejet)…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  {error && (
                    <p className="rounded-lg bg-[#FBE9E7] px-3 py-2 text-xs text-[#B23A2E]">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => decide.mutate("APPROVED")} disabled={decide.isPending}>
                      {decide.isPending ? "…" : "Approuver"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        reason.trim()
                          ? decide.mutate("REJECTED")
                          : setError("Un motif est requis pour rejeter.")
                      }
                      disabled={decide.isPending}
                    >
                      Rejeter
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Ce dossier est déjà traité (<span className="font-medium">{d.kycStatus}</span>). Aucune action requise.
                </p>
              )}
            </Card>
          </>
        )}
      </main>
    </>
  );
}
