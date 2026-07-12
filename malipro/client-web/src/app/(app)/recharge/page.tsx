"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Phone, Check } from "lucide-react";
import { api } from "@/mock/api";
import { QueryState } from "@/components/ui/async-state";
import { Input, Label } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Reveal } from "@/components/ui/reveal";
import { GridSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/states";
import { RechargeBundleGrid } from "@/features/recharge/bundle-grid";
import type { AirtimeBundle, Operator } from "@/types/modules";
import { tap } from "@/lib/motion";

type BundleType = AirtimeBundle["type"];

const TABS: { value: BundleType; label: string }[] = [
  { value: "AIRTIME", label: "Crédit" },
  { value: "DATA", label: "Internet" },
  { value: "COMBO", label: "Combo" },
];

export default function RechargePage() {
  const operatorsQuery = useQuery({ queryKey: ["operators"], queryFn: () => api.operators() });
  const [phone, setPhone] = useState("");
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
  const [type, setType] = useState<BundleType>("AIRTIME");

  const bundlesQuery = useQuery({
    queryKey: ["bundles", selectedOpId],
    queryFn: () => api.bundles(selectedOpId as string),
    enabled: selectedOpId !== null,
  });

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-ink">Recharge téléphonique</h1>

      <QueryState
        query={operatorsQuery}
        skeleton={
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-surface" />
            ))}
          </div>
        }
      >
        {(operators) => {
          const selectedOp: Operator | undefined = operators.find((o) => o.id === selectedOpId);

          function handlePhone(value: string) {
            const digits = value.replace(/\D/g, "").slice(0, 8);
            setPhone(digits);
            const prefix = digits.slice(0, 2);
            if (prefix.length === 2) {
              const match = operators.find((o) => o.prefixes.includes(prefix));
              if (match) setSelectedOpId(match.id);
            }
          }

          return (
            <div className="space-y-6">
              <Reveal>
                <div className="space-y-3">
                  <Label>Opérateur</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {operators.map((op) => {
                      const active = op.id === selectedOpId;
                      return (
                        <motion.button
                          key={op.id}
                          type="button"
                          whileTap={tap}
                          onClick={() => setSelectedOpId(op.id)}
                          className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center shadow-card transition ${
                            active ? "border-brand ring-2 ring-brand-soft" : "border-line hover:bg-shell"
                          }`}
                        >
                          {active && (
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${op.color} text-white font-black`}>
                            {op.name.charAt(0)}
                          </span>
                          <span className="text-[12px] font-semibold leading-tight text-ink">{op.name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    icon={<Phone className="h-4 w-4" />}
                    value={phone}
                    onChange={(e) => handlePhone(e.target.value)}
                    placeholder="Ex : 76 12 34 56"
                    suffix={
                      selectedOp ? (
                        <span className="whitespace-nowrap text-[12px] font-semibold text-brand">{selectedOp.name}</span>
                      ) : undefined
                    }
                  />
                  <p className="text-[12px] text-muted">L'opérateur est détecté automatiquement selon le préfixe.</p>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                {selectedOp ? (
                  <Tabs value={type} onValueChange={(v) => setType(v as BundleType)} className="space-y-4">
                    <TabsList className="w-full">
                      {TABS.map((t) => (
                        <TabsTrigger key={t.value} value={t.value} className="flex-1">
                          {t.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {TABS.map((t) => (
                      <TabsContent key={t.value} value={t.value}>
                        <QueryState query={bundlesQuery} skeleton={<GridSkeleton count={6} card="product" />}>
                          {(bundles) => {
                            const filtered = bundles.filter((b) => b.type === t.value);
                            if (filtered.length === 0) {
                              return <EmptyState title="Aucun forfait" description="Aucun forfait disponible pour cette catégorie." />;
                            }
                            return <RechargeBundleGrid bundles={filtered} operator={selectedOp} phone={phone} />;
                          }}
                        </QueryState>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <EmptyState
                    icon={<Phone className="h-8 w-8" />}
                    title="Choisissez un opérateur"
                    description="Sélectionnez un opérateur ou saisissez un numéro pour voir les forfaits disponibles."
                  />
                )}
              </Reveal>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
