"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { QuantityStepper, Divider } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/states";
import { useCart } from "@/features/cart/cart-store";
import { formatFcfa } from "@/lib/utils";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const cart = useCart();
  const empty = cart.lines.length === 0;
  const deliveryFee = empty ? 0 : 1000;
  const total = cart.subtotal + deliveryFee - cart.discount;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand" />
            Mon panier
            {!empty && <span className="text-sm font-normal text-muted">· {cart.storeName}</span>}
          </SheetTitle>
        </SheetHeader>

        {empty ? (
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Votre panier est vide"
            description="Ajoutez des plats ou produits pour démarrer une commande."
            action={
              <SheetClose asChild>
                <Button asChild><Link href="/restaurants">Découvrir les commerces</Link></Button>
              </SheetClose>
            }
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {cart.lines.map((line, i) => (
                <div key={`${line.productId}-${i}`}>
                  <div className="flex gap-3 py-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-shell">
                      <Image src={line.image} alt={line.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-ink">{line.name}</p>
                      {line.options && line.options.length > 0 && (
                        <p className="line-clamp-1 text-[12px] text-muted">
                          {line.options.map((o) => o.choiceLabel).join(", ")}
                        </p>
                      )}
                      {line.note && <p className="line-clamp-1 text-[12px] italic text-muted">« {line.note} »</p>}
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-sm font-bold text-ink">{formatFcfa(line.unitPrice * line.quantity)}</span>
                        <div className="flex items-center gap-1">
                          <QuantityStepper
                            value={line.quantity}
                            onChange={(v) => cart.setQuantity(line.productId, v)}
                            min={1}
                            size="sm"
                          />
                          <button onClick={() => cart.remove(line.productId)} className="ml-1 p-1.5 text-muted transition hover:text-error" aria-label="Retirer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Divider />
                </div>
              ))}
            </div>

            <SheetFooter className="space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Sous-total</span>
                  <span className="text-ink">{formatFcfa(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Livraison</span>
                  <span className="text-ink">{formatFcfa(deliveryFee)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Réduction</span>
                    <span>−{formatFcfa(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-base font-bold text-ink">
                  <span>Total</span>
                  <span>{formatFcfa(total)}</span>
                </div>
              </div>
              <SheetClose asChild>
                <Button block size="lg" asChild>
                  <Link href="/checkout">Commander · {formatFcfa(total)}</Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
