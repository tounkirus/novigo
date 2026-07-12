"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import type { WalletMethod } from "@/types/wallet";
import { formatFcfa } from "@/lib/utils";

const PAYOUT_METHODS: { value: WalletMethod; label: string; hint: string }[] = [
  { value: "BANK_TRANSFER", label: "Virement bancaire", hint: "Compte professionnel · sous 48 h ouvrées" },
  { value: "ORANGE_MONEY", label: "Orange Money", hint: "Réception instantanée" },
  { value: "WAVE", label: "Wave", hint: "Réception instantanée · sans frais" },
];

const PRESETS = [50000, 150000, 500000];

/**
 * Actions du portefeuille commerçant : reversement du solde disponible vers
 * un compte externe (Sheet + montant + méthode). À placer dans les actions
 * de la carte de solde. Réutilise `api.requestPayout` + toasts + invalidation.
 */
export function MerchantPayoutActions({ available }: { available: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<WalletMethod>("BANK_TRANSFER");

  const value = Number(amount);
  const invalid = !Number.isFinite(value) || value <= 0 || value > available;

  const mutation = useMutation({
    mutationFn: () => api.requestPayout(value),
    onSuccess: (res) => {
      const label = PAYOUT_METHODS.find((m) => m.value === method)?.label ?? method;
      toast({
        title: "Reversement demandé",
        description: `${formatFcfa(value)} via ${label} · réf. ${res.ref}`,
        tone: "success",
      });
      qc.invalidateQueries({ queryKey: ["merchantWallet"] });
      qc.invalidateQueries({ queryKey: ["merchantWalletSummary"] });
      qc.invalidateQueries({ queryKey: ["payoutRequests"] });
      setOpen(false);
      setAmount("");
    },
    onError: () =>
      toast({ title: "Échec du reversement", description: "Veuillez réessayer dans un instant.", tone: "error" }),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="gold" size="sm">
          <ArrowUpFromLine className="h-4 w-4" /> Reverser vers mon compte
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Reverser vers mon compte</SheetTitle>
          <SheetDescription>Solde disponible : {formatFcfa(available)}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="space-y-2">
            <Label htmlFor="merchant-payout-amount">Montant à reverser</Label>
            <Input
              id="merchant-payout-amount"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              suffix={<span className="text-[13px] font-medium text-muted">FCFA</span>}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {PRESETS.filter((p) => p <= available).map((p) => (
                <Button key={p} type="button" variant="subtle" size="sm" onClick={() => setAmount(String(p))}>
                  {formatFcfa(p)}
                </Button>
              ))}
              <Button type="button" variant="subtle" size="sm" onClick={() => setAmount(String(available))}>
                Tout reverser
              </Button>
            </div>
            {amount !== "" && invalid && (
              <p className="text-[12px] text-error">
                Saisissez un montant valide, inférieur ou égal à votre solde disponible.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Méthode de reversement</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as WalletMethod)}>
              {PAYOUT_METHODS.map((m) => (
                <label
                  key={m.value}
                  htmlFor={`merchant-payout-method-${m.value}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface p-3 transition hover:bg-shell"
                >
                  <RadioGroupItem id={`merchant-payout-method-${m.value}`} value={m.value} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{m.label}</span>
                    <span className="block text-[12px] text-muted">{m.hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>

        <SheetFooter>
          <Button
            block
            variant="primary"
            loading={mutation.isPending}
            disabled={invalid}
            onClick={() => mutation.mutate()}
          >
            Confirmer le reversement
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
