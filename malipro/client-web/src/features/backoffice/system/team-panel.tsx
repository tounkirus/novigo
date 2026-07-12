"use client";

import { useQuery } from "@tanstack/react-query";
import { UserPlus, ShieldCheck, ShieldOff, MailCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { QueryState } from "@/components/ui/async-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import type { AdminStaff } from "@/types/backoffice";
import { timeAgo } from "@/lib/utils";
import { NOW } from "@/constants";

const STATUS_META: Record<AdminStaff["status"], { label: string; tone: "success" | "warning" | "error" }> = {
  ACTIVE: { label: "Actif", tone: "success" },
  INVITED: { label: "Invité", tone: "warning" },
  SUSPENDED: { label: "Suspendu", tone: "error" },
};

export function TeamPanelTab() {
  const { toast } = useToast();
  const q = useQuery({ queryKey: ["adminStaff"], queryFn: () => api.adminStaff(12) });

  const columns: Column<AdminStaff>[] = [
    {
      key: "name", header: "Membre",
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={s.avatar} alt={s.name} size={34} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{s.name}</p>
            <p className="truncate text-[12px] text-muted">{s.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Rôle", cell: (s) => <Badge tone={s.role === "Super Admin" ? "brand" : "neutral"}>{s.role}</Badge> },
    {
      key: "2fa", header: "2FA", align: "center",
      cell: (s) => s.twoFactor
        ? <ShieldCheck className="mx-auto h-4 w-4 text-success" />
        : <ShieldOff className="mx-auto h-4 w-4 text-muted" />,
    },
    { key: "last", header: "Dernière activité", cell: (s) => <span className="text-muted">{s.status === "INVITED" ? "—" : timeAgo(s.lastActiveAt, NOW)}</span> },
    { key: "status", header: "Statut", cell: (s) => <Badge tone={STATUS_META[s.status].tone}>{STATUS_META[s.status].label}</Badge> },
    {
      key: "actions", header: "", align: "right",
      cell: (s) => (
        <div className="flex justify-end gap-1.5">
          {s.status === "INVITED" && (
            <Button size="sm" variant="secondary" onClick={() => toast({ title: `Invitation renvoyée à ${s.name}`, tone: "info" })}>
              <MailCheck className="h-4 w-4" /> Relancer
            </Button>
          )}
          {s.status === "ACTIVE" && s.role !== "Super Admin" && (
            <Button size="sm" variant="ghost" onClick={() => toast({ title: `${s.name} suspendu`, tone: "error" })}>Suspendre</Button>
          )}
          {s.status === "SUSPENDED" && (
            <Button size="sm" variant="ghost" onClick={() => toast({ title: `${s.name} réactivé`, tone: "success" })}>Réactiver</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="mr-auto">
          <p className="text-sm font-semibold text-ink">Équipe d'administration</p>
          <p className="text-[13px] text-muted">Gérez les accès, rôles et la double authentification de votre staff.</p>
        </div>
        <Button size="sm" onClick={() => toast({ title: "Inviter un administrateur", description: "Saisissez l'e-mail et le rôle du nouveau membre.", tone: "info" })}>
          <UserPlus className="h-4 w-4" /> Inviter un membre
        </Button>
      </Card>

      <QueryState query={q} skeleton={<TableSkeleton rows={8} cols={6} />} isEmpty={(d) => d.length === 0}>
        {(staff) => <DataTable columns={columns} rows={staff} getRowKey={(s) => s.id} minWidth={760} />}
      </QueryState>
    </div>
  );
}
