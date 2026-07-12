"use client";

import * as React from "react";
import {
  Navigation,
  MapPin,
  User,
  Phone,
  Check,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Copy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ParcelQuote } from "@/types/modules";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Icon } from "@/components/shared/icon";
import { Divider } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryState } from "@/components/ui/async-state";
import { Reveal } from "@/components/ui/reveal";
import { useToast } from "@/components/ui/toast";
import { useCopy } from "@/hooks";
import { api } from "@/mock/api";
import { BAMAKO_DISTRICTS } from "@/constants";
import { formatFcfa } from "@/lib/utils";

const STEP_LABELS = ["Adresses", "Colis", "Destinataire", "Paiement"];

const PAYMENTS = [
  { id: "wallet", label: "Portefeuille NOVIGO", icon: "Wallet" },
  { id: "orange", label: "Orange Money", icon: "Smartphone" },
  { id: "cash", label: "Espèces à la livraison", icon: "Banknote" },
] as const;

/** Numéro de suivi déterministe dérivé des informations de l'envoi. */
function trackingRef(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `CL-${(h % 900000) + 100000}`;
}

export function SendStepper({ onGoToParcels }: { onGoToParcels?: () => void }) {
  const { toast } = useToast();
  const quotesQuery = useQuery({ queryKey: ["parcelQuotes"], queryFn: () => api.parcelQuotes() });

  const [step, setStep] = React.useState(0);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [size, setSize] = React.useState<ParcelQuote | null>(null);
  const [recipient, setRecipient] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [payment, setPayment] = React.useState<string>("wallet");
  const [paying, setPaying] = React.useState(false);
  const [ref, setRef] = React.useState<string | null>(null);

  const canNext = [
    !!from && !!to && from !== to,
    !!size,
    recipient.trim().length > 1 && phone.replace(/\D/g, "").length >= 8,
    true,
  ][step];

  async function pay() {
    if (!size) return;
    setPaying(true);
    await api.pay(size.price);
    setPaying(false);
    setRef(trackingRef(`${from}|${to}|${recipient}|${size.size}`));
    toast({ title: "Paiement confirmé", description: "Votre colis est enregistré." });
  }

  function resetForm() {
    setRef(null);
    setStep(0);
    setFrom("");
    setTo("");
    setSize(null);
    setRecipient("");
    setPhone("");
  }

  if (ref && size) {
    return (
      <Reveal>
        <Card className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success">
            <PackageCheck className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-black text-ink">Colis enregistré !</h2>
          <p className="mt-1 text-sm text-muted">
            Un livreur va récupérer votre colis à {from}.
          </p>
          <TrackingBadge refId={ref} />
          <div className="mt-5 space-y-1.5 rounded-xl bg-shell p-4 text-left text-[13px]">
            <SummaryRow label="Trajet" value={`${from} → ${to}`} />
            <SummaryRow label="Colis" value={`${size.label} (${size.maxWeight})`} />
            <SummaryRow label="Destinataire" value={recipient} />
            <SummaryRow label="Montant payé" value={formatFcfa(size.price)} strong />
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="flex-1" onClick={resetForm}>
              Nouvel envoi
            </Button>
            <Button className="flex-1" onClick={onGoToParcels}>
              Suivre mes colis
            </Button>
          </div>
        </Card>
      </Reveal>
    );
  }

  return (
    <div className="space-y-5">
      <StepHeader step={step} />

      <Card className="p-5">
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Adresse de départ</Label>
              <DistrictSelect
                value={from}
                onChange={setFrom}
                placeholder="Quartier de ramassage"
                icon={<Navigation className="h-4 w-4 text-brand" />}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse d'arrivée</Label>
              <DistrictSelect
                value={to}
                onChange={setTo}
                placeholder="Quartier de livraison"
                icon={<MapPin className="h-4 w-4 text-ink" />}
              />
            </div>
            {from && to && from === to && (
              <p className="text-[12px] font-medium text-error">
                Le départ et l'arrivée doivent être différents.
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <QueryState query={quotesQuery} skeleton={<SizeSkeleton />}>
            {(quotes) => (
              <div className="space-y-2.5">
                {quotes.map((q) => (
                  <SizeCard
                    key={q.size}
                    quote={q}
                    selected={size?.size === q.size}
                    onSelect={() => setSize(q)}
                  />
                ))}
              </div>
            )}
          </QueryState>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rcpt-name">Nom du destinataire</Label>
              <Input
                id="rcpt-name"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                icon={<User className="h-4 w-4" />}
                placeholder="Ex : Aminata Traoré"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rcpt-phone">Téléphone</Label>
              <Input
                id="rcpt-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="h-4 w-4" />}
                inputMode="tel"
                placeholder="Ex : 76 12 34 56"
              />
            </div>
          </div>
        )}

        {step === 3 && size && (
          <div className="space-y-4">
            <div className="space-y-1.5 rounded-xl bg-shell p-4 text-[13px]">
              <SummaryRow label="Trajet" value={`${from} → ${to}`} />
              <SummaryRow label="Colis" value={`${size.label} · ${size.maxWeight}`} />
              <SummaryRow label="Destinataire" value={`${recipient} · ${phone}`} />
              <SummaryRow label="Délai estimé" value={`~ ${size.etaMin} min`} />
              <Divider className="my-1" />
              <SummaryRow label="Total à payer" value={formatFcfa(size.price)} strong />
            </div>
            <div>
              <Label className="mb-2 block">Moyen de paiement</Label>
              <RadioGroup value={payment} onValueChange={setPayment} className="gap-2.5">
                {PAYMENTS.map((p) => {
                  const active = payment === p.id;
                  return (
                    <label
                      key={p.id}
                      htmlFor={`pp-${p.id}`}
                      className={
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition " +
                        (active ? "border-brand bg-brand-soft" : "border-line hover:bg-shell")
                      }
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand shadow-card">
                        <Icon name={p.icon} className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-ink">{p.label}</span>
                      <RadioGroupItem id={`pp-${p.id}`} value={p.id} />
                    </label>
                  );
                })}
              </RadioGroup>
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={paying}>
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
        )}
        {step < 3 ? (
          <Button block className="flex-1" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continuer
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button block className="flex-1" loading={paying} onClick={pay}>
            {size ? `Payer ${formatFcfa(size.price)}` : "Payer"}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeader({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {STEP_LABELS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={
                  "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition " +
                  (done
                    ? "brand-gradient text-white"
                    : active
                      ? "border-2 border-brand bg-brand-soft text-brand"
                      : "border-2 border-line bg-surface text-muted")
                }
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <span className={"h-0.5 flex-1 " + (i < step ? "bg-brand" : "bg-line")} />
              )}
            </div>
            <span
              className={
                "mt-1.5 text-[10px] font-semibold " + (active || done ? "text-ink" : "text-muted")
              }
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DistrictSelect({
  value,
  onChange,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={placeholder}>
        <span className="flex items-center gap-2">
          {icon}
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {BAMAKO_DISTRICTS.map((d) => (
          <SelectItem key={d} value={d}>
            {d}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SizeCard({
  quote,
  selected,
  onSelect,
}: {
  quote: ParcelQuote;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition active:scale-[0.99] " +
        (selected
          ? "border-brand bg-brand-soft shadow-glow"
          : "border-line bg-surface shadow-card hover:border-brand/40")
      }
    >
      <span
        className={
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl " +
          (selected ? "brand-gradient text-white" : "bg-brand-soft text-brand")
        }
      >
        <Icon name={quote.icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{quote.label}</span>
        <span className="mt-0.5 block text-[12px] text-muted">
          {quote.maxWeight} · livraison ~ {quote.etaMin} min
        </span>
      </span>
      <span className="shrink-0 text-base font-black text-ink">{formatFcfa(quote.price)}</span>
    </button>
  );
}

function TrackingBadge({ refId }: { refId: string }) {
  const [copied, copy] = useCopy();
  return (
    <button
      onClick={() => copy(refId)}
      className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-line bg-shell px-4 py-2 text-sm font-bold text-ink transition hover:bg-surface"
      aria-label="Copier le numéro de suivi"
    >
      <span className="text-muted">Suivi</span>
      {refId}
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted" />}
    </button>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={strong ? "font-black text-ink" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}

function SizeSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
