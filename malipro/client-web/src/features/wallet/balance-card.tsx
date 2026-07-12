"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDownToLine, Send, CreditCard, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { api } from "@/mock/api";
import { formatFcfa } from "@/lib/utils";
import { tap } from "@/lib/motion";

const ACCOUNT_NUMBER = "7 4517 8829 0134";
const PRESETS = [1000, 2000, 5000, 10000, 25000];

type ActionKind = "topup" | "send" | "pay";

const META: Record<
  ActionKind,
  { label: string; title: string; desc: string; cta: string; icon: ReactNode; recipient?: string; success: string }
> = {
  topup: {
    label: "Recharger", title: "Recharger le portefeuille", desc: "Ajoutez des fonds via Mobile Money.",
    cta: "Recharger", icon: <ArrowDownToLine className="h-5 w-5" />, success: "Recharge effectuée",
  },
  send: {
    label: "Envoyer", title: "Envoyer de l'argent", desc: "Transférez vers un contact NOVIGO.",
    cta: "Envoyer", icon: <Send className="h-5 w-5" />, recipient: "Bénéficiaire (nom ou numéro)", success: "Transfert envoyé",
  },
  pay: {
    label: "Payer", title: "Payer un marchand", desc: "Réglez un achat en toute sécurité.",
    cta: "Payer", icon: <CreditCard className="h-5 w-5" />, recipient: "Marchand ou référence", success: "Paiement effectué",
  },
};

const ACTION_ORDER: ActionKind[] = ["topup", "send", "pay"];

export function WalletBalanceCard({ balance }: { balance: number }) {
  const [openKind, setOpenKind] = useState<ActionKind | null>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [revealed, setRevealed] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const numAmount = Number(amount) || 0;

  function reset() {
    setOpenKind(null);
    setAmount("");
    setRecipient("");
  }

  const mutation = useMutation({
    mutationFn: async ({ kind, value }: { kind: ActionKind; value: number }) => {
      if (kind === "topup") await api.topUp(value);
      else await api.pay(value);
      return { ok: true as const };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast({ title: META[vars.kind].success, description: formatFcfa(vars.value), tone: "success" });
      reset();
    },
  });

  const active = openKind ? META[openKind] : null;

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl brand-gradient p-6 text-white shadow-glow">
        <Sparkles className="absolute -right-6 -top-6 h-28 w-28 opacity-15" />
        <div className="relative">
          <p className="text-[13px] font-medium opacity-90">Solde NOVIGO</p>
          <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{formatFcfa(balance)}</p>

          <div className="mt-3 flex items-center gap-2 text-[13px] opacity-90">
            <span className="font-mono tracking-widest">
              {revealed ? ACCOUNT_NUMBER : "•••• •••• 0134"}
            </span>
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Masquer le numéro de compte" : "Afficher le numéro de compte"}
              className="rounded-full p-1 transition hover:bg-white/20"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {ACTION_ORDER.map((kind) => (
              <motion.button
                key={kind}
                type="button"
                whileTap={tap}
                onClick={() => setOpenKind(kind)}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/15 py-3 text-white backdrop-blur-sm transition hover:bg-white/25"
              >
                {META[kind].icon}
                <span className="text-[12px] font-semibold">{META[kind].label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <Sheet open={openKind !== null} onOpenChange={(o) => !o && reset()}>
        <SheetContent side="bottom" className="gap-0">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.title}</SheetTitle>
                <SheetDescription>{active.desc}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-5">
                {active.recipient && (
                  <div className="space-y-1.5">
                    <Label htmlFor="recipient">{active.recipient}</Label>
                    <Input
                      id="recipient"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Ex : Aminata T. / 76 12 34 56"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="amount">Montant</Label>
                  <Input
                    id="amount"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    suffix={<span className="text-[13px] font-medium text-muted">FCFA</span>}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <motion.button
                      key={p}
                      type="button"
                      whileTap={tap}
                      onClick={() => setAmount(String(p))}
                      className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
                        numAmount === p
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line text-muted hover:bg-shell"
                      }`}
                    >
                      {formatFcfa(p)}
                    </motion.button>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-shell px-4 py-3 text-sm">
                  <span className="text-muted">Total</span>
                  <span className="font-black text-ink">{formatFcfa(numAmount)}</span>
                </div>
              </div>

              <SheetFooter>
                <Button
                  block
                  loading={mutation.isPending}
                  disabled={numAmount <= 0}
                  onClick={() => openKind && mutation.mutate({ kind: openKind, value: numAmount })}
                >
                  {active.cta} {numAmount > 0 ? formatFcfa(numAmount) : ""}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
