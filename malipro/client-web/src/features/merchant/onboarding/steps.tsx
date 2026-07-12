"use client";

import * as React from "react";
import { Check, Upload, Wallet, ShieldCheck, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Icon } from "@/components/shared/icon";
import { MapView } from "@/services/map-view";
import { Reveal } from "@/components/ui/reveal";
import { BAMAKO_DISTRICTS, CITY_CENTER } from "@/constants";
import { cn } from "@/lib/utils";
import {
  COMMERCE_TYPES,
  COMMERCE_LABEL,
  DOCUMENTS,
  PAYOUT_METHODS,
  PAYOUT_LABEL,
  type OnboardingData,
  type PayoutMethod,
} from "./constants";

type Update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;

interface StepProps {
  data: OnboardingData;
  update: Update;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/* ───────────────────────── Étape 1 — Informations ───────────────────────── */

export function StepInfo({ data, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-bold text-ink">Type de commerce</h3>
        <p className="mb-3 text-[13px] text-muted">Sélectionnez l'activité principale de votre établissement.</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {COMMERCE_TYPES.map((c) => {
            const active = data.commerceType === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => update("commerceType", c.key)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition active:scale-[0.97]",
                  active
                    ? "border-brand bg-brand-soft/50 shadow-card ring-1 ring-brand/30"
                    : "border-line bg-surface hover:border-brand/40 hover:bg-shell",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition",
                    active ? "bg-brand text-white" : "bg-shell text-muted",
                  )}
                >
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <span className={cn("text-[12px] font-semibold", active ? "text-brand" : "text-ink")}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom commercial" htmlFor="businessName">
          <Input
            id="businessName"
            value={data.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            placeholder="Ex : Chez Fatou"
          />
        </Field>
        <Field label="Nom du propriétaire" htmlFor="ownerName">
          <Input
            id="ownerName"
            value={data.ownerName}
            onChange={(e) => update("ownerName", e.target.value)}
            placeholder="Ex : Fatoumata Traoré"
          />
        </Field>
        <Field label="Téléphone" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="Ex : 76 12 34 56"
            icon={<Icon name="Phone" className="h-4 w-4" />}
          />
        </Field>
        <Field label="Adresse e-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="Ex : contact@moncommerce.ml"
            icon={<Icon name="Mail" className="h-4 w-4" />}
          />
        </Field>
      </div>
    </div>
  );
}

/* ───────────────────────── Étape 2 — Documents ───────────────────────── */

export function StepDocuments({ data, update }: StepProps) {
  function toggle(key: string) {
    update("documents", { ...data.documents, [key]: !data.documents[key] });
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">
        Téléversez les pièces justificatives. Les documents marqués <span className="font-semibold text-ink">Obligatoire</span> sont requis pour valider votre dossier.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {DOCUMENTS.map((doc) => {
          const added = !!data.documents[doc.key];
          return (
            <div
              key={doc.key}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 transition",
                added ? "border-success/50 bg-success-soft/40" : "border-line bg-surface",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  added ? "bg-success text-white" : "bg-shell text-muted",
                )}
              >
                <Icon name={added ? "CheckCircle2" : doc.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-semibold text-ink">{doc.label}</p>
                  {doc.required ? (
                    <Badge tone="brand">Obligatoire</Badge>
                  ) : (
                    <Badge tone="neutral">Optionnel</Badge>
                  )}
                  {added && <Badge tone="success" className="gap-1"><Check className="h-3 w-3" /> Ajouté</Badge>}
                </div>
                <p className="mt-0.5 text-[12px] text-muted">{doc.desc}</p>
                {added && (
                  <p className="mt-1 truncate text-[12px] font-medium text-success">
                    {doc.label.toLowerCase().replace(/\s+/g, "-")}.pdf · fichier ajouté
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => toggle(doc.key)}
                  className={cn(
                    "mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition",
                    added
                      ? "border-line text-muted hover:bg-surface"
                      : "border-brand text-brand hover:bg-brand-soft",
                  )}
                >
                  {added ? <Pencil className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                  {added ? "Remplacer" : "Téléverser"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Étape 3 — Informations bancaires ───────────────────────── */

export function StepBanking({ data, update }: StepProps) {
  const selected = PAYOUT_METHODS.find((m) => m.key === data.payoutMethod)!;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-bold text-ink">Moyen de reversement</h3>
        <p className="mb-3 text-[13px] text-muted">Vos revenus seront reversés sur ce compte.</p>
        <RadioGroup
          value={data.payoutMethod}
          onValueChange={(v) => update("payoutMethod", v as PayoutMethod)}
          className="grid gap-2.5 sm:grid-cols-2"
        >
          {PAYOUT_METHODS.map((m) => {
            const active = data.payoutMethod === m.key;
            return (
              <label
                key={m.key}
                htmlFor={`pm-${m.key}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition",
                  active ? "border-brand bg-brand-soft/40" : "border-line hover:bg-shell",
                )}
              >
                <RadioGroupItem id={`pm-${m.key}`} value={m.key} />
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-shell">
                  <Icon name={m.icon} className={cn("h-5 w-5", m.color)} />
                </span>
                <span className="text-sm font-semibold text-ink">{m.label}</span>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.payoutMethod === "BANK" ? (
          <Field label="IBAN / Numéro de compte" htmlFor="iban">
            <Input
              id="iban"
              value={data.iban}
              onChange={(e) => update("iban", e.target.value)}
              placeholder="Ex : ML12 3456 7890 1234"
              icon={<Icon name="Landmark" className="h-4 w-4" />}
            />
          </Field>
        ) : (
          <Field label={selected.hint} htmlFor="payoutNumber">
            <Input
              id="payoutNumber"
              type="tel"
              inputMode="tel"
              value={data.payoutNumber}
              onChange={(e) => update("payoutNumber", e.target.value)}
              placeholder="Ex : 76 12 34 56"
              icon={<Icon name={selected.icon} className={cn("h-4 w-4", selected.color)} />}
            />
          </Field>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-line bg-shell/60 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Activer le Wallet NOVIGO</p>
          <p className="text-[12px] text-muted">
            Encaissez, suivez vos soldes et demandez vos reversements directement depuis l'application.
          </p>
        </div>
        <Switch
          checked={data.walletEnabled}
          onCheckedChange={(v) => update("walletEnabled", v)}
          aria-label="Activer le Wallet NOVIGO"
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Étape 4 — Adresse & zone ───────────────────────── */

export function StepAddress({ data, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Adresse" htmlFor="address">
          <Input
            id="address"
            value={data.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Ex : Rue 224, Porte 58"
            icon={<Icon name="MapPin" className="h-4 w-4" />}
          />
        </Field>
        <Field label="Quartier">
          <Select value={data.district} onValueChange={(v) => update("district", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un quartier" />
            </SelectTrigger>
            <SelectContent>
              {BAMAKO_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div>
        <Label className="mb-1.5 block">Localisation sur la carte</Label>
        <MapView
          height={200}
          markers={[{ id: "shop", point: CITY_CENTER, tone: "brand", label: data.businessName || "Mon commerce" }]}
        />
        <p className="mt-1.5 text-[12px] text-muted">
          Positionnez précisément votre commerce après validation depuis votre tableau de bord.
        </p>
      </div>

      <div className="rounded-xl border border-line p-4">
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="radius">Rayon de la zone de livraison</Label>
          <span className="text-sm font-bold text-brand">{data.deliveryRadius} km</span>
        </div>
        <input
          id="radius"
          type="range"
          min={1}
          max={20}
          step={1}
          value={data.deliveryRadius}
          onChange={(e) => update("deliveryRadius", Number(e.target.value))}
          aria-label="Rayon de la zone de livraison en kilomètres"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-shell accent-brand"
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Étape 5 — Validation ───────────────────────── */

export function StepReview({
  data,
  onEdit,
  update,
}: StepProps & { onEdit: (step: number) => void }) {
  const docs = DOCUMENTS.filter((d) => data.documents[d.key]).map((d) => d.label);
  const payoutValue = data.payoutMethod === "BANK" ? data.iban : data.payoutNumber;

  return (
    <div className="space-y-4">
      <RecapCard title="Informations" step={0} onEdit={onEdit}>
        <RecapRow label="Type de commerce" value={COMMERCE_LABEL[data.commerceType] ?? "—"} />
        <RecapRow label="Nom commercial" value={data.businessName} />
        <RecapRow label="Propriétaire" value={data.ownerName} />
        <RecapRow label="Téléphone" value={data.phone} />
        <RecapRow label="E-mail" value={data.email} />
      </RecapCard>

      <RecapCard title="Documents" step={1} onEdit={onEdit}>
        {docs.length ? (
          <div className="flex flex-wrap gap-1.5">
            {docs.map((d) => (
              <Badge key={d} tone="success" className="gap-1">
                <Check className="h-3 w-3" /> {d}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">Aucun document ajouté.</p>
        )}
      </RecapCard>

      <RecapCard title="Informations bancaires" step={2} onEdit={onEdit}>
        <RecapRow label="Moyen de reversement" value={PAYOUT_LABEL[data.payoutMethod]} />
        <RecapRow label="Compte / numéro" value={payoutValue || "—"} />
        <RecapRow label="Wallet NOVIGO" value={data.walletEnabled ? "Activé" : "Désactivé"} />
      </RecapCard>

      <RecapCard title="Adresse & zone" step={3} onEdit={onEdit}>
        <RecapRow label="Adresse" value={data.address} />
        <RecapRow label="Quartier" value={data.district} />
        <RecapRow label="Zone de livraison" value={`${data.deliveryRadius} km`} />
      </RecapCard>

      <label
        htmlFor="terms"
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
          data.acceptTerms ? "border-brand bg-brand-soft/40" : "border-line hover:bg-shell",
        )}
      >
        <Checkbox
          id="terms"
          checked={data.acceptTerms}
          onCheckedChange={(v) => update("acceptTerms", v === true)}
          className="mt-0.5"
        />
        <span className="min-w-0 flex-1 text-[13px] text-ink">
          J'accepte les <span className="font-semibold text-brand">conditions générales</span> d'utilisation et la
          politique de confidentialité de NOVIGO, et je certifie l'exactitude des informations fournies.
        </span>
        <ShieldCheck className="hidden h-5 w-5 shrink-0 text-success sm:block" />
      </label>
    </div>
  );
}

function RecapCard({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <Card className="p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={() => onEdit(step)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand transition hover:opacity-80"
          >
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </button>
        </div>
        <div className="space-y-1.5">{children}</div>
      </Card>
    </Reveal>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="truncate text-right font-semibold text-ink">{value || "—"}</span>
    </div>
  );
}
