"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock, Copy, LayoutDashboard, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCopy } from "@/hooks";
import { spring } from "@/lib/motion";
import { COMMERCE_LABEL, type OnboardingData } from "./constants";

export function SuccessScreen({ data, dossier }: { data: OnboardingData; dossier: string }) {
  const [copied, copy] = useCopy();

  return (
    <div className="mx-auto max-w-lg py-6">
      <Card className="overflow-hidden text-center">
        <div className="relative flex flex-col items-center gap-4 p-8">
          <div className="absolute inset-x-0 top-0 h-32 brand-gradient opacity-10" />

          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...spring, delay: 0.05 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-glow"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check className="h-10 w-10" strokeWidth={3} />
            </motion.span>
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-success/30" />
          </motion.span>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h1 className="text-2xl font-black tracking-tight text-ink">Demande envoyée&nbsp;!</h1>
            <p className="mx-auto max-w-sm text-sm text-muted">
              Merci {data.ownerName || "cher partenaire"}. Votre dossier pour{" "}
              <span className="font-semibold text-ink">{data.businessName}</span> est en cours d'examen.
            </p>
          </motion.div>

          <Badge tone="warning" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Validation sous 24-48h
          </Badge>

          <div className="w-full rounded-2xl border border-line bg-shell p-4">
            <p className="text-[12px] font-medium text-muted">Numéro de dossier</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="font-mono text-lg font-black tracking-wide text-ink">{dossier}</span>
              <button
                type="button"
                onClick={() => copy(dossier)}
                aria-label="Copier le numéro de dossier"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-brand"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="w-full space-y-2 rounded-2xl border border-line p-4 text-left">
            <Row label="Type de commerce" value={COMMERCE_LABEL[data.commerceType] ?? "—"} />
            <Row label="Téléphone" value={data.phone} />
            <Row label="Quartier" value={data.district || "—"} />
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button asChild block>
              <Link href="/merchant">
                <LayoutDashboard className="h-4 w-4" /> Tableau de bord
              </Link>
            </Button>
            <Button asChild variant="secondary" block>
              <Link href="/merchant/orders">
                <FileText className="h-4 w-4" /> Suivre mon dossier
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-center text-[12px] text-muted">
        Un e-mail de confirmation a été envoyé à {data.email || "votre adresse"}.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="truncate font-semibold text-ink">{value}</span>
    </div>
  );
}
