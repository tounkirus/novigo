"use client";

import { Copy, Check, Clock } from "lucide-react";
import { useState } from "react";
import type { Coupon } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatFcfa, cn } from "@/lib/utils";

function couponValueLabel(c: Coupon): string {
  if (c.type === "PERCENT") return `-${c.value}%`;
  if (c.type === "AMOUNT") return `-${formatFcfa(c.value)}`;
  return "Offerte";
}

function couponValueHint(c: Coupon): string {
  if (c.type === "FREE_DELIVERY") return "Livraison";
  return "de réduction";
}

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      /* clipboard indisponible — on notifie quand même */
    }
    setCopied(true);
    toast({ title: "Code copié", description: `« ${coupon.code} » ajouté au presse-papiers.`, tone: "success" });
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-lifted",
        coupon.used && "opacity-60",
      )}
    >
      {/* Corps du coupon */}
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-bold text-ink">{coupon.title}</h3>
          {coupon.used && <Badge tone="neutral">Utilisé</Badge>}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] text-muted">{coupon.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Expire le {formatDate(coupon.expiresAt)}
          </span>
          {coupon.minOrder ? (
            <span className="rounded-full bg-shell px-2 py-0.5 font-medium">Dès {formatFcfa(coupon.minOrder)}</span>
          ) : null}
        </div>
        <button
          onClick={copy}
          disabled={coupon.used}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-brand bg-brand-soft px-3 py-1.5 text-[13px] font-bold text-brand transition hover:bg-brand/20 disabled:pointer-events-none"
        >
          <span className="tracking-wider">{coupon.code}</span>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Souche crantée */}
      <div className="relative flex w-24 shrink-0 flex-col items-center justify-center border-l border-dashed border-line brand-gradient px-2 text-center text-white">
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-shell" />
        <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-shell" />
        <p className="text-lg font-black leading-none">{couponValueLabel(coupon)}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-90">{couponValueHint(coupon)}</p>
      </div>
    </div>
  );
}
