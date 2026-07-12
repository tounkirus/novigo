"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Trash2, X } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { formatFcfa } from "@/lib/utils";
import type { Product } from "@/types";

type Draft = {
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  category: string;
  subCategory: string;
  stock: string;
  prepTime: string;
  available: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  images: string[];
};

function toDraft(p: Product | null): Draft {
  return {
    name: p?.name ?? "",
    description: p?.description ?? "",
    price: p ? String(p.price) : "",
    oldPrice: p?.oldPrice ? String(p.oldPrice) : "",
    category: p?.category ?? "",
    subCategory: p?.subCategory ?? "",
    stock: p ? String(p.stock) : "0",
    prepTime: p ? String(Math.max(5, Math.round((p.calories ?? 300) / 40))) : "15",
    available: p?.available ?? true,
    isFeatured: p?.isFeatured ?? false,
    isBestSeller: p?.isBestSeller ?? false,
    isNew: p?.isNew ?? false,
    images: p ? [p.image, ...(p.gallery ?? [])].slice(0, 4) : [],
  };
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  categories,
  sampleImages,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null;
  categories: string[];
  sampleImages: string[];
  onSave: (draft: {
    name: string;
    description: string;
    price: number;
    oldPrice?: number;
    category: string;
    subCategory?: string;
    stock: number;
    available: boolean;
    isFeatured: boolean;
    isBestSeller: boolean;
    isNew: boolean;
    image: string;
    gallery: string[];
  }) => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(product));

  // Réinitialise le formulaire à chaque ouverture / changement de produit.
  React.useEffect(() => {
    if (open) setDraft(toDraft(product));
  }, [open, product]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const addPreview = () => {
    const next = sampleImages.find((src) => !draft.images.includes(src));
    if (next) set("images", [...draft.images, next]);
  };
  const removePreview = (src: string) =>
    set("images", draft.images.filter((s) => s !== src));

  const canSave = draft.name.trim().length > 0 && Number(draft.price) > 0;

  const submit = () => {
    if (!canSave) return;
    onSave({
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: Number(draft.price),
      oldPrice: draft.oldPrice ? Number(draft.oldPrice) : undefined,
      category: draft.category || categories[0] || "Divers",
      subCategory: draft.subCategory.trim() || undefined,
      stock: Number(draft.stock) || 0,
      available: draft.available,
      isFeatured: draft.isFeatured,
      isBestSeller: draft.isBestSeller,
      isNew: draft.isNew,
      image: draft.images[0] ?? sampleImages[0] ?? "",
      gallery: draft.images.slice(1),
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg gap-0 p-0">
        <SheetHeader className="border-b border-line px-5 py-4">
          <SheetTitle>{product ? "Modifier le produit" : "Ajouter un produit"}</SheetTitle>
          <SheetDescription>
            Renseignez les informations. Chaque champ met à jour votre catalogue en direct.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Images */}
          <div className="space-y-2">
            <Label>Photos du produit</Label>
            <div className="flex flex-wrap gap-3">
              {draft.images.map((src) => (
                <div key={src} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line bg-shell">
                  <Image src={src} alt="Aperçu" fill sizes="80px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(src)}
                    aria-label="Retirer l'image"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPreview}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-shell text-muted transition hover:border-brand/40 hover:text-brand"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[11px]">Ajouter</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Nom du produit</Label>
            <Input
              id="pf-name"
              placeholder="Ex : Poulet Yassa"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-desc">Description</Label>
            <Textarea
              id="pf-desc"
              placeholder="Décrivez votre produit, ses ingrédients…"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-price">Prix (FCFA)</Label>
              <Input
                id="pf-price"
                inputMode="numeric"
                placeholder="2500"
                value={draft.price}
                onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-old">Ancien prix</Label>
              <Input
                id="pf-old"
                inputMode="numeric"
                placeholder="Facultatif"
                value={draft.oldPrice}
                onChange={(e) => set("oldPrice", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={draft.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-sub">Sous-catégorie</Label>
              <Input
                id="pf-sub"
                placeholder="Ex : Épicé"
                value={draft.subCategory}
                onChange={(e) => set("subCategory", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-stock">Stock</Label>
              <Input
                id="pf-stock"
                inputMode="numeric"
                value={draft.stock}
                onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-prep">Temps de prépa (min)</Label>
              <Input
                id="pf-prep"
                inputMode="numeric"
                value={draft.prepTime}
                onChange={(e) => set("prepTime", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-shell px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Disponible à la vente</p>
              <p className="text-[12px] text-muted">Visible immédiatement dans la boutique.</p>
            </div>
            <Switch checked={draft.available} onCheckedChange={(v) => set("available", v)} />
          </div>

          <div className="space-y-2.5">
            <Label>Étiquettes</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-ink">
                <Checkbox checked={draft.isFeatured} onCheckedChange={(v) => set("isFeatured", Boolean(v))} />
                Vedette
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-ink">
                <Checkbox checked={draft.isBestSeller} onCheckedChange={(v) => set("isBestSeller", Boolean(v))} />
                Populaire
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-ink">
                <Checkbox checked={draft.isNew} onCheckedChange={(v) => set("isNew", Boolean(v))} />
                Nouveau
              </label>
            </div>
          </div>

          {Number(draft.oldPrice) > Number(draft.price) && Number(draft.price) > 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand">
              <Trash2 className="hidden" />
              Promo : {formatFcfa(Number(draft.oldPrice) - Number(draft.price))} d'économie affichée au client.
            </p>
          )}
        </div>

        <SheetFooter className="border-t border-line px-5 py-4">
          <SheetClose asChild>
            <Button variant="secondary" block>Annuler</Button>
          </SheetClose>
          <Button variant="primary" block disabled={!canSave} onClick={submit}>
            {product ? "Enregistrer les modifications" : "Ajouter au catalogue"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
