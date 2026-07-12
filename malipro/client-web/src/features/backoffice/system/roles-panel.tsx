"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Users, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";

function RolesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}

function NewRoleDialog() {
  const { toast } = useToast();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4" /> Nouveau rôle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un rôle</DialogTitle>
          <DialogDescription>Définissez un nouveau rôle et ses accès à la plateforme.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Nom du rôle</Label>
            <Input id="role-name" placeholder="Ex : Modérateur avis" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea id="role-desc" placeholder="Périmètre et responsabilités du rôle" rows={3} />
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary" size="sm">Annuler</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" size="sm" onClick={() => toast({ title: "Rôle créé", description: "Le nouveau rôle a été enregistré.", tone: "success" })}>
              Créer le rôle
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RolesTab() {
  const q = useQuery({ queryKey: ["roles"], queryFn: () => api.roles() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Gérez les rôles et le niveau d'accès de vos équipes.</p>
        <NewRoleDialog />
      </div>

      <QueryState query={q} skeleton={<RolesSkeleton />} isEmpty={(d) => d.length === 0}>
        {(roles) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <div className={`bg-gradient-to-r ${r.color} p-4`}>
                  <p className="text-base font-bold text-white">{r.name}</p>
                  <p className="mt-0.5 text-[13px] text-white/85">{r.description}</p>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                    <Users className="h-4 w-4" /> {r.users} utilisateurs
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                    <ShieldCheck className="h-4 w-4 text-brand" /> {r.permissions} permissions
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
