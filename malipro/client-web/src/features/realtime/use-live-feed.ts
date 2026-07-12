"use client";

import * as React from "react";
import { NOW } from "@/constants";
import { useToast } from "@/components/ui/toast";

export interface LiveEvent {
  id: string;
  title: string;
  body: string;
  icon: string;
  tone: "success" | "info" | "warning";
  at: number;
}

/** Flux temps réel simulé (WebSocket mock) : émet des événements périodiques. */
export function useLiveFeed(role: "driver" | "merchant" | "admin", { toasts = true }: { toasts?: boolean } = {}) {
  const { toast } = useToast();
  const [events, setEvents] = React.useState<LiveEvent[]>([]);
  const seq = React.useRef(0);

  React.useEffect(() => {
    const feeds: Record<typeof role, Omit<LiveEvent, "id" | "at">[]> = {
      driver: [
        { title: "Nouvelle course disponible 🛵", body: "Hamdallaye ACI → Hippodrome · 1 800 FCFA", icon: "Bike", tone: "info" },
        { title: "Paiement reçu", body: "Course livrée · +2 500 FCFA", icon: "Wallet", tone: "success" },
        { title: "Pourboire client 🎉", body: "Aminata vous a laissé 500 FCFA", icon: "HandCoins", tone: "success" },
      ],
      merchant: [
        { title: "Nouvelle commande 🧾", body: "2× Tiéboudienne · 5 000 FCFA", icon: "Receipt", tone: "info" },
        { title: "Vente encaissée", body: "Commande #MP-100487 · +7 500 FCFA", icon: "TrendingUp", tone: "success" },
        { title: "Stock faible ⚠️", body: "Poulet Yassa : 3 unités restantes", icon: "PackageX", tone: "warning" },
      ],
      admin: [
        { title: "Nouveau commerçant", body: "Boulangerie Dorée en attente de validation", icon: "Store", tone: "info" },
        { title: "Écart de caisse détecté ⚠️", body: "Livreur Moussa K. · 4 500 FCFA", icon: "AlertTriangle", tone: "warning" },
        { title: "Remise validée", body: "150 000 FCFA remis par un livreur", icon: "CheckCircle2", tone: "success" },
      ],
    };
    const pool = feeds[role];
    let i = 0;
    const push = () => {
      const base = pool[i % pool.length];
      i++;
      const ev: LiveEvent = { ...base, id: `live_${seq.current++}`, at: NOW };
      setEvents((prev) => [ev, ...prev].slice(0, 20));
      if (toasts) toast({ title: ev.title, description: ev.body, tone: ev.tone === "warning" ? "info" : ev.tone });
    };
    const t = setInterval(push, 12000);
    const first = setTimeout(push, 3500);
    return () => {
      clearInterval(t);
      clearTimeout(first);
    };
  }, [role, toasts, toast]);

  return events;
}
