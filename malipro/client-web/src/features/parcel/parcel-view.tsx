"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SendStepper } from "./send-stepper";
import { ParcelsSection } from "./parcels-section";

export function ParcelView() {
  const [tab, setTab] = React.useState("send");

  return (
    <div className="px-4 py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Envoi de colis</h1>
        <p className="text-[13px] text-muted">Livraison de colis partout à Bamako</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="send" className="flex-1">
            Envoyer
          </TabsTrigger>
          <TabsTrigger value="parcels" className="flex-1">
            Mes colis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <SendStepper onGoToParcels={() => setTab("parcels")} />
        </TabsContent>

        <TabsContent value="parcels">
          <ParcelsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
