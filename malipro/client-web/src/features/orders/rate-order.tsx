"use client";

import * as React from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarInput } from "@/components/ui/rating";
import { useToast } from "@/components/ui/toast";

export function RateOrder({ storeName }: { storeName: string }) {
  const { toast } = useToast();
  const [value, setValue] = React.useState(0);
  const [done, setDone] = React.useState(false);

  function submit() {
    if (value === 0) {
      toast({ title: "Sélectionnez une note", tone: "error" });
      return;
    }
    setDone(true);
    toast({ title: "Merci pour votre avis !", description: `Vous avez noté ${storeName} ${value}/5.`, tone: "success" });
  }

  if (done) {
    return (
      <Card className="flex items-center gap-3 p-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-ink">Avis envoyé</p>
          <p className="text-[13px] text-muted">Merci d'aider la communauté NOVIGO.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-gold" />
        <h2 className="text-base font-bold text-ink">Notez votre commande</h2>
      </div>
      <p className="mb-4 text-[13px] text-muted">Comment s'est passée votre expérience avec {storeName} ?</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <StarInput value={value} onChange={setValue} />
        <Button onClick={submit} className="w-full sm:w-auto">
          Envoyer mon avis
        </Button>
      </div>
    </Card>
  );
}
