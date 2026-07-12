"use client";

import * as React from "react";
import Image from "next/image";
import { Plus, Pencil, Search } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { useToast } from "@/components/ui/toast";
import { stores, productsOf } from "@/mock";
import type { Product } from "@/types";
import { formatFcfa } from "@/lib/utils";

export default function MerchantProductsPage() {
  const { toast } = useToast();
  const store = stores()[0];
  const products = React.useMemo(() => productsOf(store).slice(0, 24), [store]);

  const [available, setAvailable] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.available])),
  );
  const [query, setQuery] = React.useState("");

  const toggle = (p: Product, v: boolean) => {
    setAvailable((a) => ({ ...a, [p.id]: v }));
    toast({ title: p.name, description: v ? "Produit disponible" : "Produit masqué", tone: v ? "success" : "info" });
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()),
  );

  const inStock = products.filter((p) => p.stock > 0).length;
  const activeCount = products.filter((p) => available[p.id]).length;

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Produit",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-shell">
            <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
          </span>
          <span className="min-w-0 max-w-[220px] truncate font-semibold text-ink">{p.name}</span>
        </div>
      ),
    },
    { key: "category", header: "Catégorie", cell: (p) => <Badge tone="neutral">{p.category}</Badge> },
    { key: "price", header: "Prix", align: "right", cell: (p) => <span className="font-bold text-ink">{formatFcfa(p.price)}</span> },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cell: (p) => <span className={p.stock === 0 ? "font-semibold text-error" : "text-ink"}>{p.stock}</span>,
    },
    {
      key: "available",
      header: "Disponible",
      align: "center",
      cell: (p) => <Switch checked={available[p.id]} onCheckedChange={(v) => toggle(p, v)} />,
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: () => (
        <Button size="icon-sm" variant="ghost" aria-label="Modifier">
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Catalogue produits</h2>
          <p className="text-sm text-muted">{store.name} · {products.length} produits en ligne</p>
        </div>
        <AddProductDialog onSubmit={(name) => toast({ title: "Produit ajouté", description: name, tone: "success" })} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Produits" value={String(products.length)} hint="au catalogue" />
        <KpiCard label="Disponibles" value={String(activeCount)} hint="visibles en boutique" />
        <KpiCard label="En stock" value={String(inStock)} hint="quantité positive" />
      </div>

      <Input
        icon={<Search className="h-4 w-4" />}
        placeholder="Rechercher un produit…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <DataTable columns={columns} rows={filtered} getRowKey={(p) => p.id} minWidth={760} empty="Aucun produit ne correspond à votre recherche." />
    </div>
  );
}

function AddProductDialog({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau produit</DialogTitle>
          <DialogDescription>Renseignez les informations de votre produit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nom du produit</Label>
            <Input id="p-name" placeholder="Ex : Poulet Yassa" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Prix (FCFA)</Label>
              <Input id="p-price" inputMode="numeric" placeholder="2500" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Catégorie</Label>
              <Input id="p-cat" placeholder="Plats" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" placeholder="Décrivez votre produit…" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" onClick={() => onSubmit(name || "Nouveau produit")}>
              Enregistrer
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
