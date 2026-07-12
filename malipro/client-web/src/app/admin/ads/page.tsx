"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaTrend, BarSeries } from "@/components/ui/charts";
import { revenueSeries } from "@/mock";
import { NewCampaignDialog } from "@/features/backoffice/ads/new-campaign-dialog";
import { AdsKpis } from "@/features/backoffice/ads/ads-kpis";
import { AdsCampaignsTable } from "@/features/backoffice/ads/ads-campaigns-table";

export default function AdminAdsPage() {
  const spend = React.useMemo(() => revenueSeries(14, 21), []);
  const impressions = React.useMemo(() => revenueSeries(14, 34), []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Publicité</h2>
          <p className="text-sm text-muted">Régie publicitaire — campagnes, budgets et performances.</p>
        </div>
        <NewCampaignDialog />
      </div>

      <AdsKpis />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dépenses publicitaires (14 jours)</CardTitle>
            <CardDescription>Budget consommé par jour, toutes campagnes.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <AreaTrend data={spend} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Impressions par jour</CardTitle>
            <CardDescription>Volume d'affichages servis quotidiennement.</CardDescription>
          </CardHeader>
          <div className="px-2 pb-4">
            <BarSeries data={impressions} height={240} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campagnes</CardTitle>
          <CardDescription>Gérez le statut et suivez la performance de chaque campagne.</CardDescription>
        </CardHeader>
        <div className="p-4 pt-0 sm:p-5 sm:pt-0">
          <AdsCampaignsTable />
        </div>
      </Card>
    </div>
  );
}
