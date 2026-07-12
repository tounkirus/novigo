import Image from "next/image";
import type { CartLine } from "@/types";
import { Divider } from "@/components/ui/misc";
import { formatFcfa } from "@/lib/utils";

/** Récapitulatif détaillé du panier (lignes + montants). Présentationnel. */
export function OrderSummary({
  lines,
  subtotal,
  deliveryFee,
  discount,
  total,
  freeDelivery,
}: {
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  freeDelivery: boolean;
}) {
  return (
    <div>
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div key={`${line.productId}-${i}`} className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-shell">
              <Image src={line.image} alt={line.name} fill sizes="48px" className="object-cover" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-ink">{line.name}</p>
              {line.options && line.options.length > 0 && (
                <p className="line-clamp-1 text-[12px] text-muted">
                  {line.options.map((o) => o.choiceLabel).join(", ")}
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm font-bold text-ink">{formatFcfa(line.unitPrice * line.quantity)}</span>
          </div>
        ))}
      </div>

      <Divider className="my-4" />

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted">
          <span>Sous-total</span>
          <span className="text-ink">{formatFcfa(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Livraison</span>
          {freeDelivery ? (
            <span className="font-semibold text-success">Offerte</span>
          ) : (
            <span className="text-ink">{formatFcfa(deliveryFee)}</span>
          )}
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Réduction</span>
            <span>−{formatFcfa(discount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 text-base font-bold text-ink">
          <span>Total</span>
          <span>{formatFcfa(total)}</span>
        </div>
      </div>
    </div>
  );
}
