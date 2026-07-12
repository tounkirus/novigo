"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StocksTab } from "@/features/backoffice/erp/stocks-tab";
import { SuppliersTab } from "@/features/backoffice/erp/suppliers-tab";
import { FinancesTab } from "@/features/backoffice/erp/finances-tab";

export default function AdminErpPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">ERP · Gestion</h2>
        <p className="text-sm text-muted">Stocks, fournisseurs et finances de la plateforme.</p>
      </div>

      <Tabs defaultValue="stocks">
        <TabsList className="flex-wrap">
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="stocks">
          <StocksTab />
        </TabsContent>
        <TabsContent value="suppliers">
          <SuppliersTab />
        </TabsContent>
        <TabsContent value="finances">
          <FinancesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
