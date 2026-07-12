"use client";

import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function WalletTopUpButton() {
  const { toast } = useToast();
  return (
    <Button
      size="sm"
      variant="gold"
      onClick={() =>
        toast({
          title: "Rechargement",
          description: "Choisissez Orange Money ou Wave pour créditer votre portefeuille.",
          tone: "info",
        })
      }
    >
      <Plus className="h-4 w-4" />
      Recharger
    </Button>
  );
}

export function LogoutButton() {
  const { toast } = useToast();
  return (
    <Button
      block
      variant="secondary"
      onClick={() =>
        toast({ title: "Déconnexion", description: "Vous avez été déconnecté de NOVIGO.", tone: "info" })
      }
    >
      <LogOut className="h-4 w-4" />
      Se déconnecter
    </Button>
  );
}
