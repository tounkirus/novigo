"use client";

import * as React from "react";
import Image from "next/image";
import { Flame } from "lucide-react";
import type { Product, Store, CartLine } from "@/types";
import {
  Sheet, SheetContent, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/ui/misc";
import { Textarea } from "@/components/ui/input";
import { useCart } from "@/features/cart/cart-store";
import { useToast } from "@/components/ui/toast";
import { formatFcfa, cn } from "@/lib/utils";

export function ProductSheet({
  product,
  store,
  open,
  onOpenChange,
}: {
  product: Product;
  store: Store;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { add } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [choices, setChoices] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    if (open) {
      setQty(1);
      setNote("");
      const init: Record<string, string[]> = {};
      product.options?.forEach((g) => {
        if (g.required && !g.multiple) init[g.id] = [g.choices[0].id];
      });
      setChoices(init);
    }
  }, [open, product]);

  const selected: CartLine["options"] = React.useMemo(() => {
    const out: NonNullable<CartLine["options"]> = [];
    product.options?.forEach((g) => {
      (choices[g.id] ?? []).forEach((cid) => {
        const c = g.choices.find((x) => x.id === cid);
        if (c) out.push({ groupName: g.name, choiceLabel: c.label, price: c.price });
      });
    });
    return out;
  }, [choices, product]);

  const optionsPrice = selected?.reduce((s, o) => s + o.price, 0) ?? 0;
  const total = (product.price + optionsPrice) * qty;

  function toggleChoice(groupId: string, choiceId: string, multiple: boolean, max?: number) {
    setChoices((prev) => {
      const cur = prev[groupId] ?? [];
      if (!multiple) return { ...prev, [groupId]: [choiceId] };
      if (cur.includes(choiceId)) return { ...prev, [groupId]: cur.filter((x) => x !== choiceId) };
      if (max && cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, choiceId] };
    });
  }

  function submit() {
    add(product, store, { quantity: qty, options: selected, note: note || undefined });
    toast({ title: "Ajouté au panier", description: `${qty} × ${product.name}`, tone: "success" });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0">
        <div className="overflow-y-auto">
          <div className="relative aspect-[16/9] w-full bg-shell">
            <Image src={product.image} alt={product.name} fill sizes="100vw" className="object-cover" />
          </div>
          <div className="space-y-4 p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">{product.name}</h2>
                <span className="whitespace-nowrap text-lg font-bold text-brand">{formatFcfa(product.price)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{product.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {product.calories != null && (
                  <Badge tone="neutral"><Flame className="h-3 w-3" /> {product.calories} kcal</Badge>
                )}
                {product.allergens?.map((a) => (
                  <Badge key={a} tone="warning">{a}</Badge>
                ))}
              </div>
              {product.ingredients && product.ingredients.length > 0 && (
                <p className="mt-2 text-[13px] text-muted">
                  <span className="font-medium text-ink">Ingrédients :</span> {product.ingredients.join(", ")}
                </p>
              )}
            </div>

            {product.options?.map((g) => (
              <div key={g.id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">
                    {g.name} {g.required && <span className="text-brand">*</span>}
                  </p>
                  <span className="text-[12px] text-muted">
                    {g.multiple ? `Jusqu'à ${g.max ?? g.choices.length}` : "Choix unique"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {g.choices.map((c) => {
                    const active = (choices[g.id] ?? []).includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChoice(g.id, c.id, g.multiple, g.max)}
                        className={cn(
                          "focus-ring flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition",
                          active ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/40",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center border-2 transition",
                              g.multiple ? "rounded-md" : "rounded-full",
                              active ? "border-brand bg-brand text-white" : "border-line",
                            )}
                          >
                            {active && <span className={cn("bg-white", g.multiple ? "h-2 w-2 rounded-sm" : "h-2 w-2 rounded-full")} />}
                          </span>
                          <span className="font-medium text-ink">{c.label}</span>
                        </span>
                        {c.price > 0 && <span className="text-[13px] text-muted">+{formatFcfa(c.price)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Instructions (facultatif)</p>
              <Textarea
                placeholder="Ex : sans piment, bien cuit…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="flex items-center gap-3">
          <QuantityStepper value={qty} onChange={setQty} min={1} max={30} />
          <Button onClick={submit} className="flex-1">
            Ajouter · {formatFcfa(total)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
