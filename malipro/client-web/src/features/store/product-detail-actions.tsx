"use client";

import * as React from "react";
import { ShoppingCart } from "lucide-react";
import type { Product, Store, CartLine } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { QuantityStepper } from "@/components/ui/misc";
import { useCart } from "@/features/cart/cart-store";
import { useToast } from "@/components/ui/toast";
import { formatFcfa, cn } from "@/lib/utils";

export function ProductDetailActions({ product, store }: { product: Product; store: Store }) {
  const { add } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [choices, setChoices] = React.useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    product.options?.forEach((g) => {
      if (g.required && !g.multiple) init[g.id] = [g.choices[0].id];
    });
    return init;
  });

  const selected: NonNullable<CartLine["options"]> = React.useMemo(() => {
    const out: NonNullable<CartLine["options"]> = [];
    product.options?.forEach((g) => {
      (choices[g.id] ?? []).forEach((cid) => {
        const c = g.choices.find((x) => x.id === cid);
        if (c) out.push({ groupName: g.name, choiceLabel: c.label, price: c.price });
      });
    });
    return out;
  }, [choices, product.options]);

  const optionsPrice = selected.reduce((s, o) => s + o.price, 0);
  const total = (product.price + optionsPrice) * qty;

  const missingRequired = React.useMemo(
    () => (product.options ?? []).some((g) => g.required && (choices[g.id] ?? []).length === 0),
    [product.options, choices],
  );

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
  }

  return (
    <div className="space-y-5">
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
                  onClick={() => toggleChoice(g.id, c.id, g.multiple, g.max)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition",
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

      <div className="space-y-2">
        <Label htmlFor="product-note">Instructions (facultatif)</Label>
        <Textarea
          id="product-note"
          placeholder="Ex : sans piment, bien cuit…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <QuantityStepper value={qty} onChange={setQty} min={1} max={30} />
        <Button
          block
          size="lg"
          className="flex-1"
          disabled={!product.available || missingRequired}
          onClick={submit}
        >
          <ShoppingCart className="h-5 w-5" />
          {product.available ? `Ajouter · ${formatFcfa(total)}` : "Indisponible"}
        </Button>
      </div>
      {missingRequired && product.available && (
        <p className="text-[12px] text-error">Veuillez sélectionner les options obligatoires (*).</p>
      )}
    </div>
  );
}
