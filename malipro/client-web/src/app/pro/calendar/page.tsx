"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { api } from "@/mock/api";
import type { Availability } from "@/types/services";
import { QueryState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const WEEK = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const HOURS = ["06:00", "07:00", "08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

export default function ProCalendarPage() {
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["me-provider"], queryFn: () => api.meProvider() });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Disponibilités</h2>
        <p className="text-sm text-muted">Définissez vos créneaux d'intervention pour la semaine.</p>
      </div>
      <QueryState query={query} skeleton={<Skeleton className="h-96 w-full rounded-2xl" />} isEmpty={(d) => d == null}>
        {(me) => <Editor initial={me!.availability} onSave={() => toast({ title: "Disponibilités enregistrées", tone: "success" })} />}
      </QueryState>
    </div>
  );
}

function Editor({ initial, onSave }: { initial: Availability[]; onSave: () => void }) {
  const [avail, setAvail] = React.useState<Availability[]>(initial);

  const toggle = (day: number) => setAvail((a) => a.map((s) => (s.day === day ? { ...s, off: !s.off } : s)));
  const setField = (day: number, field: "from" | "to", value: string) =>
    setAvail((a) => a.map((s) => (s.day === day ? { ...s, [field]: value } : s)));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Semaine type</CardTitle>
          <CardDescription>Activez les jours travaillés et ajustez les horaires.</CardDescription>
        </div>
        <Button size="sm" onClick={onSave}><Save className="h-4 w-4" /> Enregistrer</Button>
      </CardHeader>
      <div className="divide-y divide-line border-t border-line">
        {avail.map((s) => (
          <div key={s.day} className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", s.off && "opacity-60")}>
            <div className="flex w-32 items-center gap-2.5">
              <Switch checked={!s.off} onCheckedChange={() => toggle(s.day)} />
              <span className="text-sm font-semibold text-ink">{WEEK[s.day]}</span>
            </div>
            {s.off ? (
              <span className="text-[13px] font-medium text-muted">Indisponible</span>
            ) : (
              <div className="flex items-center gap-2">
                <TimeSelect value={s.from} onChange={(v) => setField(s.day, "from", v)} />
                <span className="text-muted">→</span>
                <TimeSelect value={s.to} onChange={(v) => setField(s.day, "to", v)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = HOURS.includes(value) ? HOURS : [value, ...HOURS];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink outline-none focus:border-brand"
    >
      {options.map((h) => <option key={h} value={h}>{h}</option>)}
    </select>
  );
}
