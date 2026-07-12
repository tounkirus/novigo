"use client";

import * as React from "react";
import { Percent, Ticket, Gift, Truck, Clock, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { formatFcfa, formatDate } from "@/lib/utils";
import type { StorePromotion } from "@/types";
import { makeIdFactory } from "./types";

type PromoType = StorePromotion["type"];

const TYPE_META: Record<PromoType, { label: string; icon: React.ReactNode; tone: "brand" | "gold" | "success" | "info" }> = {
  DISCOUNT: { label: "% de réduction", icon: <Percent className="h-4 w-4" />, tone: "brand" },
  COUPON: { label: "Montant fixe", icon: <Ticket className="h-4 w-4" />, tone: "info" },
  PACK: { label: "1 acheté = 1 offert", icon: <Gift className="h-4 w-4" />, tone: "gold" },
  FREE_DELIVERY: { label: "Livraison gratuite", icon: <Truck className="h-4 w-4" />, tone: "success" },
  HAPPY_HOUR: { label: "Happy Hour", icon: <Clock className="h-4 w-4" />, tone: "gold" },
  FLASH: { label: "Vente flash", icon: <Tag className="h-4 w-4" />, tone: "brand" },
};

const CREATE_TYPES: PromoType[] = ["DISCOUNT", "COUPON", "PACK", "FREE_DELIVERY", "HAPPY_HOUR"];

export function PromotionsTab({
  promotions,
  setPromotions,
}: {
  promotions: StorePromotion[];
  setPromotions: React.Dispatch<React.SetStateAction<StorePromotion[]>>;
}) {
  const { toast } = useToast();
  const nextId = React.useRef(makeIdFactory("promo")).current;

  const create = (promo: StorePromotion) => {
    setPromotions((list) => [promo, ...list]);
    toast({ title: "Promotion créée", description: promo.title, tone: "success" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Promotions en cours</h3>
          <p className="text-[13px] text-muted">{promotions.length} campagne(s) active(s).</p>
        </div>
        <CreatePromoDialog makeId={nextId} onCreate={create} />
      </div>

      {promotions.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-8 w-8" />}
          title="Aucune promotion"
          description="Lancez votre première campagne pour booster vos ventes."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {promotions.map((p) => {
            const meta = TYPE_META[p.type];
            return (
              <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{p.title}</p>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  {p.subtitle && <p className="mt-0.5 text-[13px] text-muted">{p.subtitle}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-muted">
                    {p.value != null && p.type === "DISCOUNT" && <span className="font-semibold text-brand">-{p.value}%</span>}
                    {p.value != null && p.type === "COUPON" && <span className="font-semibold text-brand">-{formatFcfa(p.value)}</span>}
                    {p.code && <span className="rounded-md bg-shell px-1.5 py-0.5 font-mono font-semibold text-ink">{p.code}</span>}
                    {p.endsAt && <span>Jusqu'au {formatDate(p.endsAt)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreatePromoDialog({
  makeId, onCreate,
}: {
  makeId: () => string; onCreate: (p: StorePromotion) => void;
}) {
  const [type, setType] = React.useState<PromoType>("DISCOUNT");
  const [title, setTitle] = React.useState("");
  const [value, setValue] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [limited, setLimited] = React.useState(false);
  const [qty, setQty] = React.useState("");

  const needsValue = type === "DISCOUNT" || type === "COUPON";
  const canSave = title.trim().length > 0 && (!needsValue || Number(value) > 0);

  const submit = () => {
    if (!canSave) return;
    const meta = TYPE_META[type];
    const parts: string[] = [];
    if (start) parts.push(`Du ${formatDate(start)}`);
    if (end) parts.push(`au ${formatDate(end)}`);
    if (limited && qty) parts.push(`${qty} unités`);
    onCreate({
      id: makeId(),
      title: title.trim(),
      subtitle: parts.join(" · ") || meta.label,
      type,
      value: needsValue ? Number(value) : undefined,
      endsAt: end || undefined,
      code: type === "COUPON" ? "PROMO" + (value || "10") : undefined,
    });
    setTitle(""); setValue(""); setStart(""); setEnd(""); setLimited(false); setQty("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Créer une promotion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle promotion</DialogTitle>
          <DialogDescription>Configurez votre campagne commerciale.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="promo-title">Intitulé</Label>
            <Input id="promo-title" placeholder="Ex : -20% sur les grillades" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Type de promotion</Label>
            <Select value={type} onValueChange={(v) => setType(v as PromoType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CREATE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_META[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsValue && (
            <div className="space-y-1.5">
              <Label htmlFor="promo-value">{type === "DISCOUNT" ? "Réduction (%)" : "Montant (FCFA)"}</Label>
              <Input
                id="promo-value"
                inputMode="numeric"
                placeholder={type === "DISCOUNT" ? "20" : "1000"}
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promo-start">Début</Label>
              <Input id="promo-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-end">Fin</Label>
              <Input id="promo-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-shell px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Quantité limitée</p>
              <p className="text-[12px] text-muted">Plafonner le nombre d'unités en promo.</p>
            </div>
            <Switch checked={limited} onCheckedChange={setLimited} />
          </div>
          {limited && (
            <div className="space-y-1.5">
              <Label htmlFor="promo-qty">Nombre d'unités</Label>
              <Input id="promo-qty" inputMode="numeric" placeholder="50" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" onClick={submit} disabled={!canSave}>Lancer la promotion</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
