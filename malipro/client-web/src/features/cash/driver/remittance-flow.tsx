"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Download,
  QrCode as QrCodeIcon,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { api } from "@/mock/api";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { NOW } from "@/constants";
import { cn, formatFcfa, formatDate, formatTime } from "@/lib/utils";
import { downloadFile } from "@/features/wallet/shared/tx-utils";
import { QrCode } from "./qr-code";
import { OtpInput } from "./otp-input";
import type { RemittanceMethod } from "@/types/wallet";

type Method = "QR_CODE" | "OTP" | "AGENT";

const METHODS: { value: Method; label: string; description: string; icon: typeof QrCodeIcon }[] = [
  { value: "QR_CODE", label: "QR Code", description: "Présentez le QR à l'agent collecteur", icon: QrCodeIcon },
  { value: "OTP", label: "Code OTP", description: "Saisissez le code reçu par SMS", icon: ShieldCheck },
  { value: "AGENT", label: "Agent NOVIGO", description: "Remise en main propre à un agent", icon: UserCheck },
];

const STEPS = ["Montant", "Méthode", "Validation", "Reçu"] as const;

interface Receipt {
  ref: string;
  receiptId: string;
  amount: number;
  method: Method;
  dateIso: string;
}

function buildReceiptText(r: Receipt): string {
  const label = METHODS.find((m) => m.value === r.method)?.label ?? r.method;
  return [
    "NOVIGO — Reçu de remise de caisse",
    "===================================",
    `Numéro de reçu : ${r.receiptId}`,
    `Référence remise : ${r.ref}`,
    `Date : ${formatDate(r.dateIso)} à ${formatTime(r.dateIso)}`,
    `Montant remis : ${formatFcfa(r.amount)}`,
    `Méthode de validation : ${label}`,
    "Signature électronique : Oui",
    "===================================",
    "Conservez ce reçu comme preuve de reversement.",
  ].join("\n");
}

export function RemittanceFlow({ toRemit }: { toRemit: number }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [amount, setAmount] = React.useState(String(toRemit));
  const [method, setMethod] = React.useState<Method>("QR_CODE");
  const [otp, setOtp] = React.useState("");
  const [signature, setSignature] = React.useState(false);
  const [receipt, setReceipt] = React.useState<Receipt | null>(null);

  const amountNum = Math.max(0, Math.round(Number(amount) || 0));

  const mutation = useMutation({
    mutationFn: (value: number) => api.declareRemittance(value),
    onSuccess: (res) => {
      setReceipt({
        ref: res.ref,
        receiptId: res.receiptId,
        amount: amountNum,
        method,
        dateIso: new Date(NOW).toISOString(),
      });
      setStep(3);
      toast({
        title: "Remise déclarée",
        description: `${formatFcfa(amountNum)} en cours de validation.`,
        tone: "success",
      });
    },
    onError: () => toast({ title: "Échec de la déclaration", description: "Veuillez réessayer.", tone: "error" }),
  });

  const reset = React.useCallback(() => {
    setStep(0);
    setAmount(String(toRemit));
    setMethod("QR_CODE");
    setOtp("");
    setSignature(false);
    setReceipt(null);
    mutation.reset();
  }, [toRemit, mutation]);

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) window.setTimeout(reset, 250);
  };

  const canValidate = signature && (method !== "OTP" || otp.length === 6);
  const qrSeed = `NOVIGO|${amountNum}|${method}|${STEPS.length}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm" className="bg-white text-emerald-700 shadow-card hover:bg-white/90">
          <Banknote className="h-4 w-4" /> Déclarer une remise
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[92vh]">
        <SheetHeader>
          <SheetTitle>Remise de caisse</SheetTitle>
          <SheetDescription>Reversez vos espèces encaissées à NOVIGO.</SheetDescription>
        </SheetHeader>

        {/* Fil d'étapes */}
        <div className="flex items-center gap-1.5 px-5 pt-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors",
                  i <= step ? "bg-emerald-600" : "bg-line",
                )}
              />
              <span className={cn("text-[11px] font-medium", i <= step ? "text-ink" : "text-muted")}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Étape 1 — Montant */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="remit-amount">Montant à remettre</Label>
                <Input
                  id="remit-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  suffix={<span className="text-[13px] font-semibold text-muted">FCFA</span>}
                />
                <p className="text-[12px] text-muted">
                  Solde à reverser : <span className="font-semibold text-ink">{formatFcfa(toRemit)}</span>
                </p>
              </div>
              {amountNum > toRemit && (
                <p className="rounded-xl bg-warning-soft px-3 py-2 text-[12px] font-medium text-warning">
                  Le montant dépasse votre solde à reverser.
                </p>
              )}
            </div>
          )}

          {/* Étape 2 — Méthode */}
          {step === 1 && (
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)} className="gap-3">
              {METHODS.map((m) => {
                const MethodIcon = m.icon;
                const active = method === m.value;
                return (
                  <label
                    key={m.value}
                    htmlFor={`method-${m.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition",
                      active ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10" : "border-line bg-surface",
                    )}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15">
                      <MethodIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{m.label}</span>
                      <span className="block text-[12px] text-muted">{m.description}</span>
                    </span>
                    <RadioGroupItem id={`method-${m.value}`} value={m.value} />
                  </label>
                );
              })}
            </RadioGroup>
          )}

          {/* Étape 3 — Validation selon méthode */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-line bg-shell/50 px-4 py-3 text-center">
                <p className="text-[12px] text-muted">Montant à remettre</p>
                <p className="text-2xl font-black tracking-tight text-ink">{formatFcfa(amountNum)}</p>
              </div>

              {method === "QR_CODE" && (
                <div className="flex flex-col items-center gap-2">
                  <QrCode seed={qrSeed} />
                  <p className="text-center text-[12px] text-muted">
                    Présentez ce QR code à l'agent collecteur pour valider la remise.
                  </p>
                </div>
              )}

              {method === "OTP" && (
                <div className="space-y-2">
                  <Label>Code de validation (6 chiffres)</Label>
                  <OtpInput value={otp} onChange={setOtp} />
                  <p className="text-[12px] text-muted">Saisissez le code reçu par SMS de la part de NOVIGO.</p>
                </div>
              )}

              {method === "AGENT" && (
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15">
                    <UserCheck className="h-5 w-5" />
                  </span>
                  <p className="text-[13px] text-muted">
                    Remettez les espèces à l'agent NOVIGO le plus proche. Il confirmera la réception après signature.
                  </p>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4">
                <Checkbox
                  id="signature"
                  checked={signature}
                  onCheckedChange={(v) => setSignature(v === true)}
                  className="mt-0.5"
                />
                <span className="text-[13px] text-ink">
                  <span className="font-semibold">Signature électronique</span>
                  <span className="block text-[12px] text-muted">
                    Je certifie l'exactitude du montant remis et j'accepte les conditions de reversement.
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* Étape 4 — Reçu / confirmation */}
          {step === 3 && receipt && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
                  <CheckCircle2 className="h-9 w-9" />
                </span>
                <h3 className="text-lg font-bold text-ink">Remise déclarée</h3>
                <p className="text-[13px] text-muted">Votre reversement est en cours de validation.</p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">Numéro de reçu</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" /> {receipt.receiptId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">Référence</span>
                  <span className="font-medium text-ink">{receipt.ref}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">Montant</span>
                  <span className="font-bold text-ink">{formatFcfa(receipt.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">Méthode</span>
                  <Badge tone="info">{METHODS.find((m) => m.value === receipt.method)?.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">Date</span>
                  <span className="text-[13px] text-ink">
                    {formatDate(receipt.dateIso)} · {formatTime(receipt.dateIso)}
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                block
                onClick={() => downloadFile(buildReceiptText(receipt), `recu-${receipt.receiptId}.txt`, "text/plain;charset=utf-8")}
              >
                <Download className="h-4 w-4" /> Télécharger le reçu
              </Button>
            </div>
          )}
        </div>

        {/* Actions bas de page */}
        <div className="mt-auto flex items-center gap-3 border-t border-line p-5">
          {step === 0 && (
            <>
              <SheetClose asChild>
                <Button variant="ghost" className="flex-1">
                  Annuler
                </Button>
              </SheetClose>
              <Button className="flex-1" disabled={amountNum <= 0} onClick={() => setStep(1)}>
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {(step === 1 || step === 2) && (
            <>
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              {step === 1 ? (
                <Button className="flex-1" onClick={() => setStep(2)}>
                  Continuer <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  variant="success"
                  disabled={!canValidate}
                  loading={mutation.isPending}
                  onClick={() => mutation.mutate(amountNum)}
                >
                  <ShieldCheck className="h-4 w-4" /> Valider la remise
                </Button>
              )}
            </>
          )}

          {step === 3 && (
            <SheetClose asChild>
              <Button block>Terminer</Button>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const REMITTANCE_METHOD_META: Record<RemittanceMethod, { label: string; tone: "info" | "brand" | "neutral" | "gold" }> = {
  QR_CODE: { label: "QR Code", tone: "info" },
  OTP: { label: "OTP", tone: "brand" },
  MANUAL: { label: "Manuel", tone: "neutral" },
  AGENT: { label: "Agent", tone: "gold" },
};
