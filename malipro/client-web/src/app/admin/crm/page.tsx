"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CrmOverview } from "@/features/backoffice/crm/crm-overview";
import { CrmCustomers } from "@/features/backoffice/crm/crm-customers";
import { CrmSegments } from "@/features/backoffice/crm/crm-segments";
import { CrmTickets } from "@/features/backoffice/crm/crm-tickets";

export default function AdminCrmPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">CRM Clients</h2>
        <p className="text-sm text-muted">Connaissez, segmentez et fidélisez la base clients NOVIGO.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="tickets">Tickets support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CrmOverview />
        </TabsContent>
        <TabsContent value="customers">
          <CrmCustomers />
        </TabsContent>
        <TabsContent value="segments">
          <CrmSegments />
        </TabsContent>
        <TabsContent value="tickets">
          <CrmTickets />
        </TabsContent>
      </Tabs>
    </div>
  );
}
