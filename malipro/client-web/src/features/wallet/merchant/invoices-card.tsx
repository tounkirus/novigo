"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { NOW } from "@/constants";
import { formatFcfa } from "@/lib/utils";

interface MerchantInvoice {
  id: string;
  ref: string;
  period: string;
  commissions: number;
  subscription: number;
  total: number;
  paid: boolean;
}

/** Facteurs déterministes (aucun aléatoire) pour 6 mois glissants. */
const MONTH_FACTORS = [1, 0.92, 1.11, 0.86, 1.18, 0.97];
const SUBSCRIPTION = 25000;

function buildInvoices(): MerchantInvoice[] {
  const base = new Date(NOW);
  return MONTH_FACTORS.map((factor, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const period = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const commissions = Math.round((312000 * factor) / 500) * 500;
    return {
      id: `merchant-invoice-${d.getFullYear()}-${d.getMonth() + 1}`,
      ref: `FAC-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      period: period.charAt(0).toUpperCase() + period.slice(1),
      commissions,
      subscription: SUBSCRIPTION,
      total: commissions + SUBSCRIPTION,
      paid: i > 0,
    };
  });
}

/** Factures mensuelles du commerçant (commissions NOVIGO + abonnement), déterministe. */
export function MerchantInvoicesCard() {
  const { toast } = useToast();
  const invoices = React.useMemo(buildInvoices, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factures</CardTitle>
        <CardDescription>Vos relevés mensuels : commissions NOVIGO et abonnement.</CardDescription>
      </CardHeader>
      <div className="divide-y divide-line border-t border-line">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink">{inv.period}</p>
                <Badge tone={inv.paid ? "success" : "warning"}>{inv.paid ? "Payée" : "En cours"}</Badge>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-muted">
                {inv.ref} · Commissions {formatFcfa(inv.commissions)} · Abonnement {formatFcfa(inv.subscription)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-ink">{formatFcfa(inv.total)}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Télécharger la facture ${inv.period}`}
              onClick={() =>
                toast({
                  title: "Téléchargement lancé",
                  description: `Facture ${inv.period} (${inv.ref})`,
                  tone: "success",
                })
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
