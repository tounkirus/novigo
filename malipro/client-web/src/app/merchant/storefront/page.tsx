"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Star, Upload } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { stores, menuOf, productsOf } from "@/mock";
import { cn, formatFcfa } from "@/lib/utils";

export default function MerchantStorefrontPage() {
  const { toast } = useToast();
  const store = stores()[0];
  const products = React.useMemo(() => productsOf(store).slice(0, 6), [store]);

  const [slogan, setSlogan] = React.useState(store.slogan ?? "Le meilleur de Bamako, livré chez vous");
  const [description, setDescription] = React.useState(store.description);
  const [sections, setSections] = React.useState<string[]>(() => menuOf(store).map((s) => s.name));
  const [featured, setFeatured] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p, i) => [p.id, i < 3])),
  );

  const move = (i: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const featuredList = products.filter((p) => featured[p.id]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Ma vitrine</h2>
          <p className="text-sm text-muted">Personnalisez la page publique de votre commerce.</p>
        </div>
        <Button variant="primary" onClick={() => toast({ title: "Vitrine enregistrée", description: "Vos modifications sont en ligne.", tone: "success" })}>
          <Upload className="h-4 w-4" /> Publier
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Édition */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bannière & logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative h-36 overflow-hidden rounded-xl bg-shell">
                <Image src={store.cover} alt="Bannière" fill sizes="(max-width:1024px) 100vw, 480px" className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Button size="sm" variant="secondary">
                    <ImagePlus className="h-4 w-4" /> Changer la bannière
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                  <Image src={store.logo} alt="Logo" fill sizes="56px" className="object-cover" />
                </span>
                <Button size="sm" variant="secondary">
                  <ImagePlus className="h-4 w-4" /> Modifier le logo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sf-name">Nom du commerce</Label>
                <Input id="sf-name" defaultValue={store.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sf-slogan">Slogan</Label>
                <Input id="sf-slogan" value={slogan} onChange={(e) => setSlogan(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sf-desc">Description</Label>
                <Textarea id="sf-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ordre des sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((s, i) => (
                <div key={s} className="flex items-center gap-2 rounded-xl border border-line bg-shell/50 px-3 py-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-soft text-[12px] font-bold text-brand">{i + 1}</span>
                  <span className="flex-1 truncate text-sm font-medium text-ink">{s}</span>
                  <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Descendre">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produits mis en avant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFeatured((f) => ({ ...f, [p.id]: !f[p.id] }))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
                    featured[p.id] ? "border-brand/40 bg-brand-soft" : "border-line bg-surface hover:bg-shell",
                  )}
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-shell">
                    <Image src={p.image} alt={p.name} fill sizes="36px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
                  <Star className={cn("h-4 w-4", featured[p.id] ? "fill-gold text-gold" : "text-line")} />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Aperçu */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-shell/60 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
              Aperçu en direct
            </div>
            <div className="relative h-40 bg-shell">
              <Image src={store.cover} alt={store.name} fill sizes="(max-width:1024px) 100vw, 480px" className="object-cover" />
            </div>
            <div className="p-5">
              <div className="-mt-12 flex items-end gap-3">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-surface">
                  <Image src={store.logo} alt={store.name} fill sizes="80px" className="object-cover" />
                </span>
                <Badge tone="success" className="mb-1">Ouvert</Badge>
              </div>
              <h3 className="mt-3 text-lg font-black text-ink">{store.name}</h3>
              <p className="text-sm font-medium text-brand">{slogan}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {sections.map((s) => (
                  <span key={s} className="rounded-full bg-shell px-3 py-1 text-[12px] font-medium text-muted">{s}</span>
                ))}
              </div>

              {featuredList.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-bold text-ink">À la une</p>
                  <div className="grid grid-cols-3 gap-2">
                    {featuredList.map((p) => (
                      <div key={p.id} className="overflow-hidden rounded-xl border border-line">
                        <span className="relative block aspect-square bg-shell">
                          <Image src={p.image} alt={p.name} fill sizes="120px" className="object-cover" />
                        </span>
                        <div className="p-1.5">
                          <p className="truncate text-[11px] font-medium text-ink">{p.name}</p>
                          <p className="text-[11px] font-bold text-brand">{formatFcfa(p.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
