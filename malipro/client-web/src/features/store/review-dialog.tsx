"use client";

import * as React from "react";
import { PenLine } from "lucide-react";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { StarInput } from "@/components/ui/rating";
import { useToast } from "@/components/ui/toast";

/** Dialog « Écrire un avis » — sans persistance réelle (toast au submit). */
export function ReviewDialog({ storeName }: { storeName: string }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setRating(0);
      setComment("");
    }
  }, [open]);

  function submit() {
    if (rating === 0) {
      toast({ title: "Sélectionnez une note", description: "Attribuez au moins une étoile.", tone: "error" });
      return;
    }
    toast({ title: "Merci pour votre avis !", description: `Votre note pour ${storeName} a bien été prise en compte.`, tone: "success" });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PenLine className="h-4 w-4" /> Écrire un avis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Votre avis sur {storeName}</DialogTitle>
          <DialogDescription>Partagez votre expérience avec la communauté NOVIGO.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Votre note</Label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">Votre commentaire</Label>
            <Textarea
              id="review-comment"
              placeholder="Qu'avez-vous pensé des plats, du service, de la livraison ?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Annuler</Button>
          </DialogClose>
          <Button size="sm" onClick={submit}>Publier</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
