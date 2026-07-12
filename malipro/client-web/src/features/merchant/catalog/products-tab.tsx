"use client";

import * as React from "react";
import Image from "next/image";
import { Plus, Search, MoreVertical, Pencil, Copy, Archive, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { NoResults } from "@/components/ui/states";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { useToast } from "@/components/ui/toast";
import { formatFcfa } from "@/lib/utils";
import type { Product } from "@/types";
import { ProductFormSheet } from "./product-form-sheet";
import {
  PRODUCT_FILTERS, type ProductFilter, matchesFilter, stockDotClass, isLowStock, makeIdFactory,
} from "./types";

export function ProductsTab({
  products,
  setProducts,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const { toast } = useToast();
  const nextId = React.useRef(makeIdFactory("prod")).current;

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ProductFilter>("all");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [toDelete, setToDelete] = React.useState<Product | null>(null);

  const categories = React.useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );
  const sampleImages = React.useMemo(
    () => Array.from(new Set(products.map((p) => p.image))).slice(0, 8),
    [products],
  );

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    const okQuery =
      !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return okQuery && matchesFilter(p, filter);
  });

  const counts = React.useMemo(() => {
    const c: Record<ProductFilter, number> = {
      all: products.length,
      available: 0, unavailable: 0, promo: 0, low: 0, popular: 0,
    };
    for (const p of products) {
      if (matchesFilter(p, "available")) c.available++;
      if (matchesFilter(p, "unavailable")) c.unavailable++;
      if (matchesFilter(p, "promo")) c.promo++;
      if (matchesFilter(p, "low")) c.low++;
      if (matchesFilter(p, "popular")) c.popular++;
    }
    return c;
  }, [products]);

  const openAdd = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setSheetOpen(true); };

  const toggleAvailable = (p: Product, v: boolean) => {
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, available: v } : x)));
    toast({ title: p.name, description: v ? "Produit disponible" : "Produit masqué", tone: v ? "success" : "info" });
  };

  const duplicate = (p: Product) => {
    const copy: Product = { ...p, id: nextId(), name: `${p.name} (copie)`, isBestSeller: false, isNew: true };
    setProducts((list) => [copy, ...list]);
    toast({ title: "Produit dupliqué", description: copy.name, tone: "success" });
  };

  const archive = (p: Product) => {
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, available: false, stock: 0 } : x)));
    toast({ title: "Produit archivé", description: p.name, tone: "info" });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setProducts((list) => list.filter((x) => x.id !== toDelete.id));
    toast({ title: "Produit supprimé", description: toDelete.name, tone: "error" });
    setToDelete(null);
  };

  const handleSave: React.ComponentProps<typeof ProductFormSheet>["onSave"] = (d) => {
    if (editing) {
      setProducts((list) =>
        list.map((x) => (x.id === editing.id ? { ...x, ...d } : x)),
      );
      toast({ title: "Produit mis à jour", description: d.name, tone: "success" });
    } else {
      const created: Product = {
        id: nextId(),
        storeId: products[0]?.storeId ?? "store_0",
        popularity: 50,
        rating: 4.5,
        reviewCount: 0,
        ...d,
      };
      setProducts((list) => [created, ...list]);
      toast({ title: "Produit ajouté", description: d.name, tone: "success" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Rechercher un produit…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button variant="primary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRODUCT_FILTERS.map((f) => (
          <Chip
            key={f.value}
            active={filter === f.value}
            count={counts[f.value]}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <NoResults query={query} />
      ) : (
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <RevealItem key={p.id}>
              <div className="flex gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-shell">
                  <Image src={p.image} alt={p.name} fill sizes="96px" className="object-cover" />
                  {p.oldPrice && p.oldPrice > p.price && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Promo
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate font-semibold text-ink">
                        {p.name}
                        {p.isBestSeller && <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" />}
                      </p>
                      <Badge tone="neutral" className="mt-1">{p.category}</Badge>
                    </div>
                    <ProductActions
                      onEdit={() => openEdit(p)}
                      onDuplicate={() => duplicate(p)}
                      onArchive={() => archive(p)}
                      onDelete={() => setToDelete(p)}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold text-ink">{formatFcfa(p.price)}</span>
                    {p.oldPrice && p.oldPrice > p.price && (
                      <span className="text-[13px] text-muted line-through">{formatFcfa(p.oldPrice)}</span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                      <span className={`h-2 w-2 rounded-full ${stockDotClass(p.stock)}`} />
                      {p.stock === 0 ? "Rupture" : isLowStock(p) ? `Stock faible (${p.stock})` : `Stock ${p.stock}`}
                    </span>
                    <label className="flex items-center gap-1.5 text-[12px] text-muted">
                      Dispo
                      <Switch checked={p.available} onCheckedChange={(v) => toggleAvailable(p, v)} />
                    </label>
                  </div>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      <ProductFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={editing}
        categories={categories}
        sampleImages={sampleImages}
        onSave={handleSave}
      />

      <Dialog open={toDelete != null} onOpenChange={(v) => !v && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce produit ?</DialogTitle>
            <DialogDescription>
              « {toDelete?.name} » sera retiré définitivement de votre catalogue. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="secondary">Annuler</Button>
            </DialogClose>
            <Button variant="danger" onClick={confirmDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductActions({
  onEdit, onDuplicate, onArchive, onDelete,
}: {
  onEdit: () => void; onDuplicate: () => void; onArchive: () => void; onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="Actions produit">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}><Copy className="h-4 w-4" /> Dupliquer</DropdownMenuItem>
        <DropdownMenuItem onSelect={onArchive}><Archive className="h-4 w-4" /> Archiver</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-error focus:text-error">
          <Trash2 className="h-4 w-4" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
