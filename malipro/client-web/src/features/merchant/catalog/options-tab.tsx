"use client";

import * as React from "react";
import { Plus, SlidersHorizontal, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { formatFcfa } from "@/lib/utils";
import type { ProductOptionGroup } from "@/types";
import { makeIdFactory } from "./types";

export function OptionsTab({ initialGroups }: { initialGroups: ProductOptionGroup[] }) {
  const { toast } = useToast();
  const nextGroupId = React.useRef(makeIdFactory("optgroup")).current;
  const nextChoiceId = React.useRef(makeIdFactory("optchoice")).current;

  const [groups, setGroups] = React.useState<ProductOptionGroup[]>(initialGroups);

  const addGroup = (name: string, required: boolean, multiple: boolean) => {
    setGroups((list) => [
      ...list,
      { id: nextGroupId(), name, required, multiple, min: required ? 1 : 0, max: multiple ? 5 : 1, choices: [] },
    ]);
    toast({ title: "Groupe d'options ajouté", description: name, tone: "success" });
  };

  const addChoice = (groupId: string, label: string, price: number) => {
    setGroups((list) =>
      list.map((g) =>
        g.id === groupId
          ? { ...g, choices: [...g.choices, { id: nextChoiceId(), label, price }] }
          : g,
      ),
    );
    toast({ title: "Choix ajouté", description: `${label} (+${formatFcfa(price)})`, tone: "success" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Groupes d'options</h3>
          <p className="text-[13px] text-muted">Tailles, suppléments… chaque choix ajuste le prix final.</p>
        </div>
        <AddGroupDialog onAdd={addGroup} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal className="h-8 w-8" />}
          title="Aucun groupe d'options"
          description="Créez un groupe (ex : Suppléments) pour proposer des choix payants."
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <OptionGroupCard key={g.id} group={g} onAddChoice={addChoice} />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionGroupCard({
  group, onAddChoice,
}: {
  group: ProductOptionGroup; onAddChoice: (groupId: string, label: string, price: number) => void;
}) {
  const [label, setLabel] = React.useState("");
  const [price, setPrice] = React.useState("");

  const submit = () => {
    if (!label.trim()) return;
    onAddChoice(group.id, label.trim(), Number(price) || 0);
    setLabel(""); setPrice("");
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-brand" />
        <p className="font-semibold text-ink">{group.name}</p>
        <Badge tone={group.required ? "brand" : "neutral"}>{group.required ? "Obligatoire" : "Facultatif"}</Badge>
        <Badge tone="neutral">{group.multiple ? "Choix multiple" : "Choix unique"}</Badge>
      </div>

      <ul className="mt-3 divide-y divide-line">
        {group.choices.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-ink">{c.label}</span>
            <span className={c.price > 0 ? "font-semibold text-brand" : "text-muted"}>
              {c.price > 0 ? `+${formatFcfa(c.price)}` : "Inclus"}
            </span>
          </li>
        ))}
        {group.choices.length === 0 && (
          <li className="py-2 text-[13px] text-muted">Aucun choix pour le moment.</li>
        )}
      </ul>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Nom du choix (ex : Grande)" value={label} onChange={(e) => setLabel(e.target.value)} className="flex-1" />
        <Input
          inputMode="numeric"
          placeholder="Prix +FCFA"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
          className="sm:w-40"
        />
        <Button variant="secondary" onClick={submit} disabled={!label.trim()}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>
    </div>
  );
}

function AddGroupDialog({ onAdd }: { onAdd: (name: string, required: boolean, multiple: boolean) => void }) {
  const [name, setName] = React.useState("");
  const [required, setRequired] = React.useState(false);
  const [multiple, setMultiple] = React.useState(true);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), required, multiple);
    setName(""); setRequired(false); setMultiple(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Nouveau groupe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau groupe d'options</DialogTitle>
          <DialogDescription>Ex : Tailles, Suppléments, Cuisson…</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grp-name">Nom du groupe</Label>
            <Input id="grp-name" placeholder="Ex : Suppléments" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line bg-shell px-4 py-3">
            <span className="text-sm font-medium text-ink">Sélection obligatoire</span>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line bg-shell px-4 py-3">
            <span className="text-sm font-medium text-ink">Choix multiple autorisé</span>
            <Switch checked={multiple} onCheckedChange={setMultiple} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" onClick={submit} disabled={!name.trim()}>Créer le groupe</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
