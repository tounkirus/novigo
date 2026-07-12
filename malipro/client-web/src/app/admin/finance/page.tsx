"use client";

import { Wallet, ArrowUpFromLine, ShieldAlert } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuditProvider, AuditJournal } from "@/features/backoffice/finance/audit";
import { FinanceOverview } from "@/features/backoffice/finance/overview";
import { WalletsTab } from "@/features/backoffice/finance/wallets-tab";
import { PayoutsTab } from "@/features/backoffice/finance/payouts-tab";
import { FraudTab } from "@/features/backoffice/finance/fraud-tab";

export default function AdminFinancePage() {
  return (
    <AuditProvider>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Centre financier</h2>
          <p className="text-sm text-muted">Supervision des portefeuilles, reversements et sécurité financière de la plateforme.</p>
        </div>

        <FinanceOverview />

        <Tabs defaultValue="wallets">
          <TabsList>
            <TabsTrigger value="wallets"><Wallet className="h-4 w-4" /> Tous les wallets</TabsTrigger>
            <TabsTrigger value="payouts"><ArrowUpFromLine className="h-4 w-4" /> Reversements</TabsTrigger>
            <TabsTrigger value="fraud"><ShieldAlert className="h-4 w-4" /> Détection de fraude</TabsTrigger>
          </TabsList>
          <TabsContent value="wallets"><WalletsTab /></TabsContent>
          <TabsContent value="payouts"><PayoutsTab /></TabsContent>
          <TabsContent value="fraud"><FraudTab /></TabsContent>
        </Tabs>

        <AuditJournal />
      </div>
    </AuditProvider>
  );
}
