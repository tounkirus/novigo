"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Upload, FileCheck2, Clock, XCircle, MapPin, Phone, Globe } from "lucide-react";
import { api } from "@/mock/api";
import type { KycStatus, ProviderKyc } from "@/types/services";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { KycBadge, ProviderBadges } from "@/features/services/ui";
import { formatDate } from "@/lib/utils";

const DOC_ICON: Record<KycStatus, typeof FileCheck2> = {
  VERIFIED: FileCheck2, PENDING: Clock, REJECTED: XCircle, EXPIRED: XCircle,
};
const DOC_TONE: Record<KycStatus, "success" | "warning" | "error" | "neutral"> = {
  VERIFIED: "success", PENDING: "warning", REJECTED: "error", EXPIRED: "neutral",
};

export default function ProProfilePage() {
  const { toast } = useToast();
  const meQuery = useQuery({ queryKey: ["me-provider"], queryFn: () => api.meProvider() });
  const kycQuery = useQuery({ queryKey: ["provider-kyc"], queryFn: () => api.providerKyc() });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Profil & Vérification</h2>
        <p className="text-sm text-muted">Gérez votre identité professionnelle et votre statut KYC.</p>
      </div>

      <QueryState query={meQuery} skeleton={<Skeleton className="h-40 w-full rounded-2xl" />} isEmpty={(d) => d == null}>
        {(me) => (
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar src={me!.avatar} alt={me!.name} size={72} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-ink">{me!.name}</h3>
                  <KycBadge status={me!.kycStatus} />
                </div>
                <p className="text-sm text-muted">{me!.categoryLabel} · Membre depuis {formatDate(me!.memberSince)}</p>
                <div className="mt-1.5"><ProviderBadges badges={me!.badges} max={6} /></div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast({ title: "Modifier le profil", tone: "info" })}>Modifier</Button>
            </div>
            <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
              <Info icon={MapPin} label="Zone" value={me!.district} />
              <Info icon={Phone} label="Téléphone" value={me!.phone} />
              <Info icon={Globe} label="Langues" value={me!.languages.join(", ")} />
            </div>
          </Card>
        )}
      </QueryState>

      <QueryState query={kycQuery} skeleton={<Skeleton className="h-64 w-full rounded-2xl" />} isEmpty={() => false}>
        {(kyc: ProviderKyc) => (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-success" />
                <div>
                  <CardTitle>Vérification KYC</CardTitle>
                  <CardDescription>Soumise le {formatDate(kyc.submittedAt)} · {kyc.note}</CardDescription>
                </div>
              </div>
              <KycBadge status={kyc.status} />
            </CardHeader>
            <div className="divide-y divide-line border-t border-line">
              {kyc.docs.map((doc) => {
                const Ico = DOC_ICON[doc.status];
                return (
                  <div key={doc.type} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-shell text-muted">
                      <Ico className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{doc.label}</p>
                      <p className="text-[12px] text-muted">{doc.uploadedAt ? `Ajouté le ${formatDate(doc.uploadedAt)}` : "Non fourni"}</p>
                    </div>
                    <Badge tone={DOC_TONE[doc.status]}>
                      {doc.status === "VERIFIED" ? "Validé" : doc.status === "PENDING" ? "En attente" : doc.status === "REJECTED" ? "Rejeté" : "Expiré"}
                    </Badge>
                    {doc.status !== "VERIFIED" && (
                      <Button size="sm" variant="secondary" onClick={() => toast({ title: `Téléverser : ${doc.label}`, tone: "info" })}>
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </QueryState>
    </div>
  );
}

function Info({ icon: Ico, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Ico className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="truncate text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
