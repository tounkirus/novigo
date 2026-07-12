"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import type { AirtimeBundle, Operator } from "@/types/modules";
import { formatFcfa } from "@/lib/utils";
import { tap } from "@/lib/motion";

export function RechargeBundleGrid({
  bundles,
  operator,
  phone,
}: {
  bundles: AirtimeBundle[];
  operator: Operator;
  phone: string;
}) {
  const [selected, setSelected] = useState<AirtimeBundle | null>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (value: number) => api.pay(value),
    onSuccess: (_data, value) => {
      toast({
        title: "Recharge réussie",
        description: `${operator.name} • ${formatFcfa(value)}`,
        tone: "success",
      });
      setSelected(null);
    },
  });

  return (
    <>
      <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {bundles.map((b) => (
          <RevealItem key={b.id}>
            <motion.button
              type="button"
              whileTap={tap}
              onClick={() => setSelected(b)}
              className="relative flex h-full w-full flex-col gap-1 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition hover:shadow-lifted"
            >
              {b.popular && (
                <Badge tone="gold" className="absolute right-2 top-2">
                  Populaire
                </Badge>
              )}
              <p className="text-base font-black text-ink">{b.label}</p>
              <p className="text-[12px] text-muted">{b.detail}</p>
              <p className="text-[12px] text-muted">Validité : {b.validity}</p>
              {b.bonus && (
                <span className="mt-1 inline-flex w-fit rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                  {b.bonus}
                </span>
              )}
              <p className="mt-2 text-lg font-black text-brand">{formatFcfa(b.price)}</p>
            </motion.button>
          </RevealItem>
        ))}
      </RevealGroup>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Confirmer la recharge</DialogTitle>
                <DialogDescription>Vérifiez les détails avant de valider.</DialogDescription>
              </DialogHeader>

              <div className="space-y-2 rounded-xl bg-shell p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Opérateur</span>
                  <span className="font-semibold text-ink">{operator.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Smartphone className="h-4 w-4" /> Numéro
                  </span>
                  <span className="font-semibold text-ink">{phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Forfait</span>
                  <span className="font-semibold text-ink">{selected.label}</span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="text-muted">Total</span>
                  <span className="font-black text-ink">{formatFcfa(selected.price)}</span>
                </div>
              </div>

              <Button
                block
                loading={mutation.isPending}
                onClick={() => mutation.mutate(selected.price)}
              >
                Recharger {formatFcfa(selected.price)}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
