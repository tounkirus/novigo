"use client";

import { useRef, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Home } from "lucide-react";
import type { Address } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Input, Label } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { user } from "@/mock";
import { BAMAKO_DISTRICTS, CITY_CENTER } from "@/constants";

export default function AddressesPage() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>(user.addresses);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [line, setLine] = useState("");
  const [district, setDistrict] = useState(BAMAKO_DISTRICTS[0]);
  const [note, setNote] = useState("");
  const idSeq = useRef(0);

  const reset = () => {
    setLabel("");
    setLine("");
    setDistrict(BAMAKO_DISTRICTS[0]);
    setNote("");
  };

  const submit = () => {
    if (!label.trim() || !line.trim()) {
      toast({ title: "Champs requis", description: "Renseignez au moins un libellé et une rue.", tone: "error" });
      return;
    }
    const next: Address = {
      id: `addr_new_${++idSeq.current}`,
      label: label.trim(),
      line: line.trim(),
      district,
      city: "Bamako",
      location: CITY_CENTER,
      note: note.trim() || undefined,
    };
    setAddresses((prev) => [...prev, next]);
    toast({ title: "Adresse ajoutée", description: `« ${next.label} » enregistrée avec succès.`, tone: "success" });
    reset();
    setOpen(false);
  };

  const remove = (a: Address) => {
    setAddresses((prev) => prev.filter((x) => x.id !== a.id));
    toast({ title: "Adresse supprimée", description: `« ${a.label} » a été retirée.`, tone: "info" });
  };

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Mes adresses</h1>
          <p className="text-[13px] text-muted">Gérez vos lieux de livraison à Bamako</p>
        </div>
      </div>

      {addresses.length === 0 && (
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="Aucune adresse enregistrée"
          description="Ajoutez un lieu de livraison pour commander plus vite la prochaine fois."
        />
      )}

      <div className="space-y-3">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                {a.label.toLowerCase() === "maison" ? <Home className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{a.label}</p>
                  {a.isDefault && <Badge tone="brand">Par défaut</Badge>}
                </div>
                <p className="mt-0.5 text-[13px] text-muted">{a.line}</p>
                <p className="text-[13px] text-muted">{a.district} · {a.city}</p>
                {a.note && <p className="mt-1 text-[12px] italic text-muted">« {a.note} »</p>}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toast({ title: "Modifier l'adresse", description: `Édition de « ${a.label} ».`, tone: "info" })}
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
              <Button size="sm" variant="ghost" className="text-error hover:bg-error-soft" onClick={() => remove(a)}>
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button block size="lg">
            <Plus className="h-5 w-5" />
            Ajouter une adresse
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-4">
          <SheetHeader>
            <SheetTitle>Nouvelle adresse</SheetTitle>
            <SheetDescription>Ajoutez un lieu de livraison à votre carnet.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="addr-label">Libellé</Label>
              <Input id="addr-label" placeholder="Maison, Bureau…" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-line">Rue / point de repère</Label>
              <Input id="addr-line" placeholder="Rue 224, porte 12" value={line} onChange={(e) => setLine(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quartier</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un quartier" />
                </SelectTrigger>
                <SelectContent>
                  {BAMAKO_DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-note">Note pour le livreur (optionnel)</Label>
              <Input id="addr-note" placeholder="Portail bleu, sonner deux fois" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <SheetFooter className="flex items-center gap-3">
            <SheetClose asChild>
              <Button variant="secondary" block>Annuler</Button>
            </SheetClose>
            <Button block onClick={submit}>Enregistrer</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
