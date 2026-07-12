"use client";

import * as React from "react";
import { Heart, Search, Sparkles, Truck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Rating, StarInput } from "@/components/ui/rating";
import { Price } from "@/components/ui/price";
import { Progress, Segmented, QuantityStepper } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { KpiCard } from "@/components/ui/kpi-card";
import { AreaTrend, DonutChart } from "@/components/ui/charts";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { revenueSeries, categoryShare } from "@/mock";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-5 pt-5">{children}</CardContent>
      </Card>
    </section>
  );
}

export default function DesignSystemPage() {
  const { toast } = useToast();
  const [rating, setRating] = React.useState(4);
  const [qty, setQty] = React.useState(2);
  const [seg, setSeg] = React.useState<"jour" | "semaine">("jour");

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Design System</h1>
          <p className="text-sm text-muted">Composants réutilisables NOVIGO — clair & sombre.</p>
        </div>
        <ThemeToggle />
      </header>

      <Block title="Couleurs">
        {[
          ["Rouge", "bg-brand"],
          ["Rouge foncé", "bg-brand-dark"],
          ["Or", "bg-gold"],
          ["Succès", "bg-success"],
          ["Erreur", "bg-error"],
          ["Info", "bg-info"],
          ["Attention", "bg-warning"],
          ["Violet", "bg-violet"],
          ["Surface", "bg-surface border border-line"],
          ["Shell", "bg-shell border border-line"],
        ].map(([label, cls]) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className={`h-14 w-14 rounded-2xl ${cls} shadow-card`} />
            <span className="text-[11px] text-muted">{label}</span>
          </div>
        ))}
      </Block>

      <Block title="Boutons">
        <Button>Primaire</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button variant="gold">Or</Button>
        <Button variant="outline">Contour</Button>
        <Button variant="ghost">Fantôme</Button>
        <Button variant="subtle">Subtil</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Chargement</Button>
        <Button size="pill" onClick={() => toast({ title: "Bravo !", description: "Toast de démonstration." })}>
          <Sparkles className="h-4 w-4" /> Toast
        </Button>
      </Block>

      <Block title="Badges & Chips">
        <Badge tone="brand">Promo</Badge>
        <Badge tone="gold">Premium</Badge>
        <Badge tone="success">Ouvert</Badge>
        <Badge tone="error">Épuisé</Badge>
        <Badge tone="info">Nouveau</Badge>
        <Badge tone="warning">En attente</Badge>
        <Badge tone="violet">Exclusif</Badge>
        <Badge tone="neutral">Standard</Badge>
        <Badge tone="solid">Top vendeur</Badge>
        <Chip active icon={<Truck className="h-4 w-4" />}>Livraison</Chip>
        <Chip count={12}>Filtres</Chip>
      </Block>

      <Block title="Notes & Prix">
        <Rating value={4.7} count={1280} size="md" />
        <StarInput value={rating} onChange={setRating} />
        <Price value={2500} oldValue={3200} size="lg" />
      </Block>

      <Block title="Contrôles">
        <div className="w-full max-w-xs space-y-2">
          <Label>Rechercher</Label>
          <Input icon={<Search className="h-4 w-4" />} placeholder="Un plat, un commerce…" />
        </div>
        <div className="flex items-center gap-2"><Checkbox defaultChecked id="c" /><Label>Sans piment</Label></div>
        <div className="flex items-center gap-2"><Switch defaultChecked /><Label>Notifications</Label></div>
        <RadioGroup defaultValue="om" className="flex gap-4">
          <label className="flex items-center gap-2"><RadioGroupItem value="om" /> Orange Money</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="wave" /> Wave</label>
        </RadioGroup>
        <Select defaultValue="pop">
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pop">Populaire</SelectItem>
            <SelectItem value="note">Meilleures notes</SelectItem>
            <SelectItem value="rapide">Plus rapide</SelectItem>
          </SelectContent>
        </Select>
        <QuantityStepper value={qty} onChange={setQty} />
        <Segmented options={[{ value: "jour", label: "Jour" }, { value: "semaine", label: "Semaine" }]} value={seg} onChange={setSeg} />
      </Block>

      <Block title="Champs texte">
        <div className="w-full space-y-2">
          <Label>Instructions de livraison</Label>
          <Textarea placeholder="Ex : portail bleu, sonner deux fois…" />
        </div>
      </Block>

      <Block title="Progression & Squelettes">
        <div className="w-full max-w-xs space-y-3">
          <Progress value={68} />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Block>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">KPI & Graphiques</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label="Revenus" value="1,2 M FCFA" delta={12} icon={<TrendingUp className="h-5 w-5" />} hint="vs hier" />
          <KpiCard label="Commandes" value="342" delta={-4} icon={<Truck className="h-5 w-5" />} hint="vs hier" />
          <KpiCard label="Favoris" value="18" icon={<Heart className="h-5 w-5" />} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardHeader><CardTitle>Revenus (14 j)</CardTitle></CardHeader><CardContent><AreaTrend data={revenueSeries(14)} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Répartition</CardTitle></CardHeader><CardContent><DonutChart data={categoryShare()} /></CardContent></Card>
        </div>
      </section>

      <Block title="Onglets">
        <Tabs defaultValue="a" className="w-full">
          <TabsList>
            <TabsTrigger value="a">Menu</TabsTrigger>
            <TabsTrigger value="b">Avis</TabsTrigger>
            <TabsTrigger value="c">Infos</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><p className="text-sm text-muted">Contenu du menu…</p></TabsContent>
          <TabsContent value="b"><p className="text-sm text-muted">Avis clients…</p></TabsContent>
          <TabsContent value="c"><p className="text-sm text-muted">Informations pratiques…</p></TabsContent>
        </Tabs>
      </Block>

      <Block title="Overlays">
        <Dialog>
          <DialogTrigger asChild><Button variant="secondary">Ouvrir un dialog</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la commande ?</DialogTitle>
              <DialogDescription>Cette action enverra votre commande au commerce.</DialogDescription>
            </DialogHeader>
            <Button block>Confirmer</Button>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild><Button variant="secondary">Ouvrir un panneau</Button></SheetTrigger>
          <SheetContent side="right">
            <SheetHeader><SheetTitle>Panneau latéral</SheetTitle></SheetHeader>
            <div className="p-5 text-sm text-muted">Contenu du drawer…</div>
          </SheetContent>
        </Sheet>
      </Block>

      <Block title="Accordéon & États">
        <div className="w-full">
          <Accordion type="single" collapsible>
            <AccordionItem value="1"><AccordionTrigger>Délais de livraison ?</AccordionTrigger><AccordionContent>20 à 45 minutes selon le quartier.</AccordionContent></AccordionItem>
            <AccordionItem value="2"><AccordionTrigger>Moyens de paiement ?</AccordionTrigger><AccordionContent>Orange Money, Wave, carte, espèces.</AccordionContent></AccordionItem>
          </Accordion>
          <EmptyState title="Rien à afficher" description="Cet état vide illustre le composant EmptyState." />
        </div>
      </Block>
    </div>
  );
}
