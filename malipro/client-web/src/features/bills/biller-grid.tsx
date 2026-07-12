"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import type { Biller } from "@/types/modules";
import { formatFcfa } from "@/lib/utils";
import { tap } from "@/lib/motion";

const CATEGORY: Record<Biller["category"], { label: string; icon: string }> = {
  WATER: { label: "Eau", icon: "Droplet" },
  ELECTRICITY: { label: "Électricité", icon: "Zap" },
  TV: { label: "Télévision", icon: "Tv" },
  INTERNET: { label: "Internet", icon: "Wifi" },
  SCHOOL: { label: "Scolarité", icon: "GraduationCap" },
  INSURANCE: { label: "Assurance", icon: "ShieldCheck" },
  TAX: { label: "Impôts", icon: "Landmark" },
};

export function BillerGrid({ billers }: { billers: Biller[] }) {
  const [selected, setSelected] = useState<Biller | null>(null);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const numAmount = Number(amount) || 0;

  function reset() {
    setSelected(null);
    setAccount("");
    setAmount("");
  }

  const mutation = useMutation({
    mutationFn: (value: number) => api.pay(value),
    onSuccess: (_data, value) => {
      toast({
        title: "Facture réglée",
        description: `${selected?.name ?? ""} • ${formatFcfa(value)}`,
        tone: "success",
      });
      reset();
    },
  });

  return (
    <>
      <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {billers.map((b) => {
          const cat = CATEGORY[b.category];
          return (
            <RevealItem key={b.id}>
              <motion.button
                type="button"
                whileTap={tap}
                onClick={() => setSelected(b)}
                className="flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-card transition hover:shadow-lifted"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${b.color} text-white shadow-card`}>
                  <Icon name={cat.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{b.name}</p>
                  <p className="text-[12px] text-muted">{cat.label}</p>
                </div>
              </motion.button>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Sheet open={selected !== null} onOpenChange={(o) => !o && reset()}>
        <SheetContent side="bottom" className="gap-0">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${selected.color} text-white`}>
                    <Icon name={CATEGORY[selected.category].icon} className="h-4 w-4" />
                  </span>
                  {selected.name}
                </SheetTitle>
                <SheetDescription>Renseignez votre référence et le montant à payer.</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <Label htmlFor="account">{selected.fieldLabel}</Label>
                  <Input
                    id="account"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder={selected.placeholder}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bill-amount">Montant</Label>
                  <Input
                    id="bill-amount"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    suffix={<span className="text-[13px] font-medium text-muted">FCFA</span>}
                  />
                </div>

                <div className="space-y-2 rounded-xl bg-shell p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Facturier</span>
                    <span className="font-semibold text-ink">{selected.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Référence</span>
                    <span className="font-semibold text-ink">{account || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-2">
                    <span className="text-muted">Total</span>
                    <span className="font-black text-ink">{formatFcfa(numAmount)}</span>
                  </div>
                </div>
              </div>

              <SheetFooter>
                <Button
                  block
                  loading={mutation.isPending}
                  disabled={numAmount <= 0 || account.trim() === ""}
                  onClick={() => mutation.mutate(numAmount)}
                >
                  Payer {numAmount > 0 ? formatFcfa(numAmount) : "la facture"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
