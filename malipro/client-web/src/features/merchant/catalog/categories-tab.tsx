"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Plus, FolderPlus, UtensilsCrossed, Baby, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { MenuSection } from "@/types";
import { makeIdFactory } from "./types";

type SpecialKey = "daily" | "kids" | "happy";
const SPECIALS: { key: SpecialKey; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: "daily", label: "Menu du jour", desc: "Formule quotidienne mise en avant.", icon: <UtensilsCrossed className="h-5 w-5" /> },
  { key: "kids", label: "Menu enfant", desc: "Portions et prix adaptés aux enfants.", icon: <Baby className="h-5 w-5" /> },
  { key: "happy", label: "Happy Hour", desc: "Réductions sur créneaux horaires.", icon: <Clock className="h-5 w-5" /> },
];

export function CategoriesTab({
  menus,
  setMenus,
}: {
  menus: MenuSection[];
  setMenus: React.Dispatch<React.SetStateAction<MenuSection[]>>;
}) {
  const { toast } = useToast();
  const nextId = React.useRef(makeIdFactory("section")).current;
  const [name, setName] = React.useState("");
  const [specials, setSpecials] = React.useState<Record<SpecialKey, boolean>>({
    daily: true, kids: false, happy: false,
  });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= menus.length) return;
    setMenus((list) => {
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addSection = () => {
    const clean = name.trim();
    if (!clean) return;
    setMenus((list) => [...list, { id: nextId(), name: clean, products: [] }]);
    toast({ title: "Catégorie créée", description: clean, tone: "success" });
    setName("");
  };

  const toggleSpecial = (key: SpecialKey, v: boolean, label: string) => {
    setSpecials((s) => ({ ...s, [key]: v }));
    toast({ title: label, description: v ? "Section activée" : "Section désactivée", tone: v ? "success" : "info" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Catégories du menu</h3>
          <p className="text-[13px] text-muted">Glissez l'ordre d'affichage vu par vos clients.</p>
        </div>
        <NewCategoryDialog name={name} setName={setName} onAdd={addSection} />
      </div>

      <div className="space-y-2.5">
        {menus.map((section, i) => (
          <div key={section.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-brand">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{section.name}</p>
              <p className="text-[12px] text-muted">{section.products.length} produit(s)</p>
            </div>
            <Badge tone={section.products.length ? "neutral" : "warning"}>
              {section.products.length ? "Active" : "Vide"}
            </Badge>
            <div className="flex flex-col">
              <Button size="icon-sm" variant="ghost" aria-label="Monter" disabled={i === 0} onClick={() => move(i, -1)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Descendre" disabled={i === menus.length - 1} onClick={() => move(i, 1)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold text-ink">Sections spéciales restaurant</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SPECIALS.map((s) => (
            <Card key={s.key} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  {s.icon}
                </div>
                <Switch
                  checked={specials[s.key]}
                  onCheckedChange={(v) => toggleSpecial(s.key, v, s.label)}
                />
              </div>
              <div>
                <p className="font-semibold text-ink">{s.label}</p>
                <p className="text-[12px] text-muted">{s.desc}</p>
              </div>
              <Badge tone={specials[s.key] ? "success" : "neutral"} className="w-fit">
                {specials[s.key] ? "Activée" : "Désactivée"}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewCategoryDialog({
  name, setName, onAdd,
}: {
  name: string; setName: (v: string) => void; onAdd: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">
          <FolderPlus className="h-4 w-4" /> Nouvelle catégorie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
          <DialogDescription>Regroupez vos produits dans une nouvelle section du menu.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Nom de la catégorie</Label>
          <Input
            id="cat-name"
            placeholder="Ex : Entrées, Boissons…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" onClick={onAdd} disabled={!name.trim()}>
              <Plus className="h-4 w-4" /> Créer
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
