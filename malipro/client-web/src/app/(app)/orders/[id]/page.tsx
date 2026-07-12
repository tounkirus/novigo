import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Phone, MessageCircle, HelpCircle, RotateCcw, Bike, Navigation, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, Divider } from "@/components/ui/misc";
import { Icon } from "@/components/shared/icon";
import { TrackingTimeline } from "@/features/orders/tracking-timeline";
import { RateOrder } from "@/features/orders/rate-order";
import { orderById, storeById } from "@/mock";
import { ORDER_STATUS, PAYMENT_LABEL } from "@/constants";
import { formatFcfa, formatDate, formatRating } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const order = orderById(params.id);
  if (!order) return { title: "Commande introuvable · NOVIGO" };
  return {
    title: `Commande ${order.ref} · NOVIGO`,
    description: `Suivi de votre commande ${order.ref} chez ${order.storeName}.`,
  };
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = orderById(params.id);
  if (!order) notFound();

  const meta = ORDER_STATUS[order.status];
  const store = storeById(order.storeId);
  const payment = PAYMENT_LABEL[order.paymentMethod];
  const inProgress = meta.step >= 0 && order.status !== "DELIVERED";
  const showRate = order.status === "DELIVERED" && order.rating == null;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-ink">Suivi de commande</h1>
          <p className="text-[13px] text-muted">
            {order.ref} · {order.storeName} · {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge tone={meta.tone} className="mt-1.5 shrink-0">
          {meta.label}
        </Badge>
      </div>

      {/* Carte factice + ETA */}
      {inProgress && (
        <Card className="overflow-hidden">
          <div className="relative h-40 bg-shell">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "linear-gradient(0deg, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            />
            <div
              className="absolute left-8 top-10 h-24 w-[62%] rounded-full border-2 border-dashed border-brand/50"
              aria-hidden
            />
            <span className="absolute left-6 top-8 flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow-card">
              <Bike className="h-4 w-4 text-brand" />
            </span>
            <span className="absolute bottom-8 right-8 flex h-9 w-9 items-center justify-center rounded-full brand-gradient text-white shadow-glow">
              <MapPin className="h-5 w-5" />
            </span>
            {order.etaMinutes > 0 && (
              <div className="absolute bottom-3 left-3 rounded-full bg-surface/95 px-3 py-1.5 text-sm font-bold text-ink shadow-card backdrop-blur">
                Arrivée dans {order.etaMinutes} min
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Livreur */}
      {order.driver && (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Avatar src={order.driver.avatar} alt={order.driver.name} size={52} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{order.driver.name}</p>
              <p className="text-[12px] text-muted">
                {order.driver.vehicle} · {order.driver.plate}
              </p>
              <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-ink">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                {formatRating(order.driver.rating)}
              </span>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="secondary" size="icon" aria-label="Appeler le livreur">
                <a href={`tel:${order.driver.phone.replace(/\s/g, "")}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="secondary" size="icon" aria-label="Envoyer un message">
                <a href={`sms:${order.driver.phone.replace(/\s/g, "")}`}>
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-brand" />
          <h2 className="text-base font-bold text-ink">Progression</h2>
        </div>
        <TrackingTimeline status={order.status} timeline={order.timeline} />
      </Card>

      {/* Noter (livrée, non notée) */}
      {showRate && <RateOrder storeName={order.storeName} />}

      {/* Articles + montants */}
      <Card className="p-5">
        <h2 className="mb-4 text-base font-bold text-ink">Détail de la commande</h2>
        <div className="space-y-3">
          {order.items.map((it) => (
            <div key={it.productId} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-shell">
                <Image src={it.image} alt={it.name} fill sizes="48px" className="object-cover" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                  {it.quantity}
                </span>
              </div>
              <p className="min-w-0 flex-1 line-clamp-1 text-sm font-semibold text-ink">{it.name}</p>
              <span className="shrink-0 text-sm font-bold text-ink">{formatFcfa(it.price * it.quantity)}</span>
            </div>
          ))}
        </div>

        <Divider className="my-4" />

        <div className="space-y-1.5 text-sm">
          <Row label="Sous-total" value={formatFcfa(order.subtotal)} />
          <Row label="Livraison" value={order.deliveryFee === 0 ? "Offerte" : formatFcfa(order.deliveryFee)} />
          {order.discount > 0 && <Row label="Réduction" value={`−${formatFcfa(order.discount)}`} tone="success" />}
          <div className="flex justify-between pt-2 text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatFcfa(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* Livraison & paiement */}
      <Card className="p-5">
        <h2 className="mb-4 text-base font-bold text-ink">Livraison & paiement</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-shell text-brand">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{order.address.label}</p>
              <p className="text-[13px] text-muted">
                {order.address.line} · {order.address.district}, {order.address.city}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-shell">
              <Icon name={payment.icon} className={"h-4 w-4 " + payment.color} />
            </span>
            <p className="text-sm font-semibold text-ink">{payment.label}</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="secondary" className="flex-1">
          <Link href="/support">
            <HelpCircle className="h-4 w-4" />
            Besoin d'aide ?
          </Link>
        </Button>
        {store && (
          <Button asChild className="flex-1">
            <Link href={`/store/${store.slug}`}>
              <RotateCcw className="h-4 w-4" />
              Recommander
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className={"flex justify-between " + (tone === "success" ? "text-success" : "text-muted")}>
      <span>{label}</span>
      <span className={tone === "success" ? "" : "text-ink"}>{value}</span>
    </div>
  );
}
