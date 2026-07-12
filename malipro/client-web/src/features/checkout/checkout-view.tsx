"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Wallet, Tag, ShoppingBag, ClipboardList, Check, X, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Label } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/shared/icon";
import { useCart } from "@/features/cart/cart-store";
import { user, coupons } from "@/mock";
import { PAYMENT_LABEL } from "@/constants";
import { formatFcfa } from "@/lib/utils";
import { OrderSummary } from "./order-summary";

const SLOTS = ["11:30 – 12:00", "12:00 – 12:30", "12:30 – 13:00", "13:00 – 13:30", "19:00 – 19:30", "19:30 – 20:00"];

export function CheckoutView() {
  const cart = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const defaultAddress = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
  const defaultPayment = user.paymentMethods.find((p) => p.isDefault) ?? user.paymentMethods[0];

  const [addressId, setAddressId] = React.useState(defaultAddress?.id ?? "");
  const [note, setNote] = React.useState("");
  const [timing, setTiming] = React.useState<"asap" | "scheduled">("asap");
  const [slot, setSlot] = React.useState(SLOTS[0]);
  const [paymentId, setPaymentId] = React.useState(defaultPayment?.id ?? "");
  const [promo, setPromo] = React.useState("");

  const empty = cart.lines.length === 0;
  const freeDelivery = cart.coupon?.type === "FREE_DELIVERY";
  const deliveryFee = freeDelivery ? 0 : 1000;
  const total = cart.subtotal + deliveryFee - cart.discount;

  function applyPromo() {
    const code = promo.trim().toLowerCase();
    if (!code) return;
    const found = coupons.find((c) => c.code.toLowerCase() === code);
    if (!found) {
      toast({ title: "Code invalide", description: "Ce code promo n'existe pas ou a expiré.", tone: "error" });
      return;
    }
    cart.applyCoupon(found);
    setPromo("");
    toast({ title: "Code appliqué", description: `${found.code} · ${found.title}`, tone: "success" });
  }

  function removePromo() {
    cart.applyCoupon(null);
    toast({ title: "Code retiré", tone: "info" });
  }

  function confirmOrder() {
    cart.clear();
    toast({ title: "Commande confirmée 🎉", description: "Votre commande est en préparation.", tone: "success" });
    router.push("/orders/order_user_me_0");
  }

  if (empty) {
    return (
      <div className="px-4 py-4">
        <h1 className="mb-2 text-2xl font-black tracking-tight text-ink">Commande</h1>
        <Card>
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Votre panier est vide"
            description="Ajoutez des plats ou produits pour passer commande."
            action={
              <Button asChild>
                <Link href="/restaurants">Découvrir les commerces</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const summary = (
    <OrderSummary
      lines={cart.lines}
      subtotal={cart.subtotal}
      deliveryFee={deliveryFee}
      discount={cart.discount}
      total={total}
      freeDelivery={!!freeDelivery}
    />
  );

  return (
    <div className="px-4 py-4 pb-28 lg:pb-8">
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-ink">Finaliser la commande</h1>
        <p className="text-[13px] text-muted">
          {cart.count} article{cart.count > 1 ? "s" : ""} · {cart.storeName}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Étapes */}
        <div className="space-y-4 lg:col-span-2">
          {/* Adresse */}
          <Step n={1} icon={<MapPin className="h-4 w-4" />} title="Adresse de livraison">
            <RadioGroup value={addressId} onValueChange={setAddressId} className="gap-2.5">
              {user.addresses.map((a) => (
                <label
                  key={a.id}
                  htmlFor={`addr-${a.id}`}
                  className={
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition " +
                    (addressId === a.id ? "border-brand bg-brand-soft/40" : "border-line hover:bg-shell")
                  }
                >
                  <RadioGroupItem id={`addr-${a.id}`} value={a.id} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{a.label}</span>
                      {a.isDefault && <Badge tone="neutral">Par défaut</Badge>}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
                      {a.line} · {a.district}, {a.city}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note pour le livreur (facultatif)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex : Portail bleu, sonner deux fois…"
                className="min-h-[72px]"
              />
            </div>
          </Step>

          {/* Créneau */}
          <Step n={2} icon={<Clock className="h-4 w-4" />} title="Créneau de livraison">
            <RadioGroup value={timing} onValueChange={(v) => setTiming(v as "asap" | "scheduled")} className="gap-2.5">
              <TimingOption id="asap" value="asap" active={timing === "asap"} title="Au plus vite" desc="Livraison estimée sous 25-35 min" />
              <TimingOption id="scheduled" value="scheduled" active={timing === "scheduled"} title="Planifier" desc="Choisissez un créneau horaire" />
            </RadioGroup>
            {timing === "scheduled" && (
              <div className="space-y-1.5">
                <Label>Créneau souhaité</Label>
                <Select value={slot} onValueChange={setSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un horaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        Aujourd'hui · {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Step>

          {/* Paiement */}
          <Step n={3} icon={<Wallet className="h-4 w-4" />} title="Moyen de paiement">
            <RadioGroup value={paymentId} onValueChange={setPaymentId} className="gap-2.5">
              {user.paymentMethods.map((p) => {
                const meta = PAYMENT_LABEL[p.type];
                return (
                  <label
                    key={p.id}
                    htmlFor={`pm-${p.id}`}
                    className={
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition " +
                      (paymentId === p.id ? "border-brand bg-brand-soft/40" : "border-line hover:bg-shell")
                    }
                  >
                    <RadioGroupItem id={`pm-${p.id}`} value={p.id} />
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-shell">
                      <Icon name={meta.icon} className={"h-5 w-5 " + meta.color} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{p.label}</p>
                      <p className="text-[12px] text-muted">{p.detail}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </Step>

          {/* Code promo */}
          <Step n={4} icon={<Tag className="h-4 w-4" />} title="Code promo">
            {cart.coupon ? (
              <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success-soft p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success text-white">
                  <Check className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{cart.coupon.code}</p>
                  <p className="line-clamp-1 text-[12px] text-muted">{cart.coupon.title}</p>
                </div>
                <button
                  onClick={removePromo}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-error"
                  aria-label="Retirer le code"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  placeholder="Ex : MALI10"
                  className="flex-1"
                  icon={<Tag className="h-4 w-4" />}
                />
                <Button variant="secondary" onClick={applyPromo}>
                  Appliquer
                </Button>
              </div>
            )}
            <p className="text-[12px] text-muted">Essayez MALI10, BIENVENUE ou LIVRAISON0.</p>
          </Step>

          {/* Récap mobile */}
          <div className="lg:hidden">
            <Step n={5} icon={<ClipboardList className="h-4 w-4" />} title="Récapitulatif">
              {summary}
            </Step>
          </div>
        </div>

        {/* Colonne récap sticky (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-3">
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
                <ClipboardList className="h-4 w-4 text-brand" />
                Récapitulatif
              </h2>
              {summary}
              <Button block size="lg" className="mt-5" onClick={confirmOrder}>
                Confirmer · {formatFcfa(total)}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Paiement sécurisé NOVIGO
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Barre de confirmation sticky (mobile) */}
      <div className="sticky bottom-20 z-30 mt-4 lg:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-lifted backdrop-blur">
          <div className="min-w-0">
            <p className="text-[12px] text-muted">Total</p>
            <p className="text-lg font-black text-ink">{formatFcfa(total)}</p>
          </div>
          <Button block size="lg" className="flex-1" onClick={confirmOrder}>
            Confirmer la commande
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {n}
        </span>
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <span className="text-brand">{icon}</span>
          {title}
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function TimingOption({ id, value, active, title, desc }: { id: string; value: string; active: boolean; title: string; desc: string }) {
  return (
    <label
      htmlFor={id}
      className={
        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition " +
        (active ? "border-brand bg-brand-soft/40" : "border-line hover:bg-shell")
      }
    >
      <RadioGroupItem id={id} value={value} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-[12px] text-muted">{desc}</p>
      </div>
    </label>
  );
}
