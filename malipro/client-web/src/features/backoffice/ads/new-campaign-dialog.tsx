"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

const PLACEMENTS = [
  { value: "HOME_HERO", label: "Bannière accueil" },
  { value: "SEARCH", label: "Résultats de recherche" },
  { value: "CATEGORY", label: "Page catégorie" },
  { value: "CHECKOUT", label: "Panier / paiement" },
];

export function NewCampaignDialog() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [advertiser, setAdvertiser] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [placement, setPlacement] = React.useState("HOME_HERO");

  const canSubmit = advertiser.trim() !== "" && title.trim() !== "" && budget.trim() !== "";

  function handleSubmit() {
    toast({
      title: "Campagne créée",
      description: `« ${title} » pour ${advertiser} est en revue.`,
      tone: "success",
    });
    setOpen(false);
    setAdvertiser("");
    setTitle("");
    setBudget("");
    setPlacement("HOME_HERO");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Nouvelle campagne
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle campagne</DialogTitle>
          <DialogDescription>Lancez une campagne publicitaire sur la régie NOVIGO.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ad-advertiser">Annonceur</Label>
            <Input
              id="ad-advertiser"
              placeholder="Ex. Supermarché Fasokan"
              value={advertiser}
              onChange={(e) => setAdvertiser(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad-title">Titre de la campagne</Label>
            <Input
              id="ad-title"
              placeholder="Ex. Menu du midi -20%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ad-budget">Budget (FCFA)</Label>
              <Input
                id="ad-budget"
                type="number"
                inputMode="numeric"
                placeholder="150000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-placement">Emplacement</Label>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger id="ad-placement">
                  <SelectValue placeholder="Emplacement" />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
            Créer la campagne
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
