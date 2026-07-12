"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, Check, CalendarClock, MapPin, Wallet, AlertTriangle, PartyPopper,
} from "lucide-react";
import { api } from "@/mock/api";
import type { ServiceProvider, ServicePaymentMethod } from "@/types/services";
import { PAYMENT_LABEL } from "@/constants";
import { Icon } from "@/components/shared/icon";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryState } from "@/components/ui/async-state";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { cn, formatFcfa } from "@/lib/utils";

const STEPS = ["Besoin", "Rendez-vous", "Paiement", "Confirmation"];
const PAY_METHODS: ServicePaymentMethod[] = ["WALLET", "ORANGE_MONEY", "MOOV_MONEY", "WAVE", "CASH", "CARD"];

export default function BookProviderPage() {
  const params = useParams<{ slug: string }>();
  const query = useQuery({ queryKey: ["service-provider", params.slug], queryFn: () => api.serviceProvider(params.slug) });

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <QueryState
        query={query}
        skeleton={<Skeleton className="h-96 w-full rounded-2xl" />}
        isEmpty={(d) => d == null}
        emptyState={<EmptyState title="Prestataire introuvable" action={<Button asChild><Link href="/home-services">Retour</Link></Button>} />}
      >
        {(provider) => <BookingWizard provider={provider!} />}
      </QueryState>
    </div>
  );
}

function BookingWizard({ provider }: { provider: ServiceProvider }) {
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [description, setDescription] = React.useState("");
  const [urgent, setUrgent] = React.useState(false);
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("09:00");
  const [address, setAddress] = React.useState("");
  const [method, setMethod] = React.useState<ServicePaymentMethod>("WALLET");
  const [ref, setRef] = React.useState<string | null>(null);

  const estimate = provider.startingPrice * (urgent ? 1.2 : 1);

  const mutation = useMutation({
    mutationFn: () => api.bookIntervention(provider.id, Math.round(estimate)),
    onSuccess: (res) => {
      setRef(res.ref);
      setStep(3);
      toast({ title: "Demande envoyée !", description: `Réf. ${res.ref}`, tone: "success" });
    },
  });

  const canNext =
    (step === 0 && description.trim().length >= 5) ||
    (step === 1 && !!date && !!address.trim()) ||
    step === 2;

  return (
    <div>
      {step < 3 && (
        <Link href={`/home-services/provider/${provider.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Retour au profil
        </Link>
      )}

      {/* Prestataire */}
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
        <Avatar src={provider.avatar} alt={provider.name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{provider.name}</p>
          <p className="truncate text-[12px] text-muted">{provider.categoryLabel} · {provider.priceLabel}</p>
        </div>
      </div>

      {/* Progression */}
      <div className="mt-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition", i <= step ? "brand-gradient text-white" : "bg-shell text-muted")}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded", i < step ? "bg-brand" : "bg-line")} />}
          </React.Fragment>
        ))}
      </div>
      <p className="mt-2 text-[13px] font-medium text-muted">Étape {Math.min(step + 1, 4)}/4 · {STEPS[step]}</p>

      <Card className="mt-4 p-5">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Décrivez votre besoin</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={`Ex. : ${provider.categoryLabel.toLowerCase()} — fuite sous l'évier de la cuisine…`}
                className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none transition focus:border-brand"
              />
            </div>
            <button
              onClick={() => setUrgent((v) => !v)}
              className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", urgent ? "border-error bg-error-soft" : "border-line hover:bg-shell")}
            >
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", urgent ? "bg-error text-white" : "bg-shell text-muted")}>
                <AlertTriangle className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">Intervention urgente</span>
                <span className="block text-[12px] text-muted">Priorité immédiate (+20 % sur le tarif)</span>
              </span>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", urgent ? "border-error bg-error text-white" : "border-line")}>
                {urgent && <Check className="h-3 w-3" />}
              </span>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink"><CalendarClock className="mr-1 inline h-4 w-4" />Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Heure</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none focus:border-brand" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink"><MapPin className="mr-1 inline h-4 w-4" />Adresse d'intervention</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Quartier, rue, porte…" className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">Mode de paiement</p>
            <div className="grid grid-cols-2 gap-2.5">
              {PAY_METHODS.map((m) => {
                const meta = PAYMENT_LABEL[m];
                return (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-left transition", method === m ? "border-brand bg-brand-soft" : "border-line hover:bg-shell")}
                  >
                    <Icon name={meta.icon} className={cn("h-5 w-5", meta.color)} />
                    <span className="text-[13px] font-medium text-ink">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 rounded-xl bg-shell p-4">
              <Row label="Tarif de base" value={formatFcfa(provider.startingPrice)} />
              {urgent && <Row label="Majoration urgence (20 %)" value={formatFcfa(provider.startingPrice * 0.2)} />}
              <div className="my-2 h-px bg-line" />
              <Row label="Estimation" value={formatFcfa(Math.round(estimate))} strong />
              <p className="mt-1 text-[11px] text-muted">Montant indicatif — le prestataire confirmera un devis avant l'intervention.</p>
            </div>
          </div>
        )}

        {step === 3 && ref && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-black text-ink">Demande envoyée !</h2>
            <p className="mt-1 text-sm text-muted">{provider.name} va étudier votre demande et vous envoyer un devis.</p>
            <div className="mx-auto mt-4 max-w-xs rounded-xl border border-line bg-shell p-4 text-left">
              <Row label="Référence" value={ref} strong />
              <Row label="Prestataire" value={provider.name} />
              <Row label="Estimation" value={formatFcfa(Math.round(estimate))} />
              <Row label="Paiement" value={PAYMENT_LABEL[method].label} />
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild variant="secondary"><Link href="/home-services">Retour aux services</Link></Button>
              <Button asChild><Link href="/home-services/interventions"><Wallet className="h-4 w-4" /> Suivre ma demande</Link></Button>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      {step < 3 && (
        <div className="mt-4 flex items-center gap-3">
          {step > 0 && <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>Précédent</Button>}
          {step < 2 ? (
            <Button block disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continuer <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button block loading={mutation.isPending} onClick={() => mutation.mutate()}>Envoyer la demande</Button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={cn(strong ? "font-black text-ink" : "font-medium text-ink")}>{value}</span>
    </div>
  );
}
