"use client";

import * as React from "react";
import { ChevronRight, Clock } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { useToast } from "@/components/ui/toast";
import { person } from "@/components/dashboard/people";
import { stores, productsOf } from "@/mock";
import { ORDER_STATUS, ORDER_FLOW, NOW } from "@/constants";
import type { OrderStatus } from "@/types";
import { formatFcfa, formatTime } from "@/lib/utils";

interface MerchantOrder {
  id: string;
  ref: string;
  customer: string;
  items: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Accepter",
  CONFIRMED: "Préparer",
  PREPARING: "Marquer prête",
  READY: "Assigner livreur",
  ASSIGNED: "Envoyer",
};

function nextStatus(s: OrderStatus): OrderStatus {
  const i = ORDER_FLOW.indexOf(s);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : s;
}

const INIT_STATUS: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERING", "PENDING"];

export default function MerchantOrdersPage() {
  const { toast } = useToast();
  const store = stores()[0];
  const products = React.useMemo(() => productsOf(store), [store]);

  const [orders, setOrders] = React.useState<MerchantOrder[]>(() =>
    Array.from({ length: 18 }, (_, i) => {
      const p = person(i * 3 + 1);
      const prod = products[(i * 5) % products.length];
      const items = 1 + (i % 4);
      return {
        id: `ord_${i}`,
        ref: `#${9100 + i * 4}`,
        customer: p.name,
        items,
        total: prod.price * items + 1000,
        status: INIT_STATUS[i % INIT_STATUS.length],
        createdAt: new Date(NOW - i * 22 * 60000).toISOString(),
      };
    }),
  );
  const [tab, setTab] = React.useState("all");

  const advance = (o: MerchantOrder) => {
    const ns = nextStatus(o.status);
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: ns } : x)));
    toast({ title: `Commande ${o.ref}`, description: ORDER_STATUS[ns].label, tone: "success" });
  };

  const matchTab = (o: MerchantOrder) => {
    if (tab === "pending") return o.status === "PENDING";
    if (tab === "preparing") return o.status === "CONFIRMED" || o.status === "PREPARING";
    if (tab === "ready") return o.status === "READY";
    if (tab === "delivering") return o.status === "DELIVERING" || o.status === "ASSIGNED";
    return true;
  };

  const filtered = orders.filter(matchTab);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  const columns: Column<MerchantOrder>[] = [
    { key: "ref", header: "Réf.", cell: (o) => <span className="font-semibold text-ink">{o.ref}</span> },
    { key: "customer", header: "Client", cell: (o) => o.customer },
    {
      key: "time",
      header: "Heure",
      cell: (o) => (
        <span className="flex items-center gap-1 text-muted">
          <Clock className="h-3.5 w-3.5" /> {formatTime(o.createdAt)}
        </span>
      ),
    },
    { key: "items", header: "Articles", align: "right", cell: (o) => o.items },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-bold text-ink">{formatFcfa(o.total)}</span> },
    { key: "status", header: "Statut", cell: (o) => <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge> },
    {
      key: "action",
      header: "Action",
      align: "right",
      cell: (o) =>
        NEXT_LABEL[o.status] ? (
          <Button size="sm" variant="primary" onClick={() => advance(o)}>
            {NEXT_LABEL[o.status]} <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-[12px] text-muted">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Commandes à traiter</h2>
        <p className="text-sm text-muted">Gérez le flux de vos commandes en temps réel.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="À traiter" value={String(pendingCount)} hint="en attente d'acceptation" />
        <KpiCard label="Commandes actives" value={String(orders.length)} hint="aujourd'hui" />
        <KpiCard label="Chiffre du jour" value={formatFcfa(revenue)} hint="commandes en cours" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="preparing">En préparation</TabsTrigger>
          <TabsTrigger value="ready">Prêtes</TabsTrigger>
          <TabsTrigger value="delivering">En livraison</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <DataTable columns={columns} rows={filtered} getRowKey={(o) => o.id} minWidth={820} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
