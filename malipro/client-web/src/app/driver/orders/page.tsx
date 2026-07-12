"use client";

import * as React from "react";
import Image from "next/image";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { popularStores } from "@/mock";
import { NOW, BAMAKO_DISTRICTS, ORDER_STATUS } from "@/constants";
import type { OrderStatus } from "@/types";
import { formatFcfa, formatDistance, formatDate } from "@/lib/utils";
import { CheckCircle2, Package, Bike, Wallet } from "lucide-react";

interface Course {
  id: string;
  ref: string;
  store: string;
  logo: string;
  district: string;
  distanceKm: number;
  payout: number;
  status: OrderStatus;
  createdAt: string;
}

const STATUS_CYCLE: OrderStatus[] = [
  "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "CANCELLED",
  "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED",
];

function buildCourses(): Course[] {
  return popularStores(16).map((s, i) => {
    const status: OrderStatus = i === 0 ? "DELIVERING" : STATUS_CYCLE[i % STATUS_CYCLE.length];
    return {
      id: s.id,
      ref: `CRS-${String(48210 + i * 13)}`,
      store: s.name,
      logo: s.logo,
      district: BAMAKO_DISTRICTS[(i * 5 + 1) % BAMAKO_DISTRICTS.length],
      distanceKm: 0.9 + (i % 7) * 0.7,
      payout: 700 + (i % 8) * 300,
      status,
      createdAt: new Date(NOW - i * 5.5 * 3600_000).toISOString(),
    };
  });
}

export default function DriverOrdersPage() {
  const courses = React.useMemo(buildCourses, []);
  const [tab, setTab] = React.useState("all");

  const filtered = courses.filter((c) => {
    if (tab === "active") return c.status === "DELIVERING";
    if (tab === "done") return c.status === "DELIVERED";
    if (tab === "cancelled") return c.status === "CANCELLED";
    return true;
  });

  const delivered = courses.filter((c) => c.status === "DELIVERED");
  const totalEarned = delivered.reduce((s, c) => s + c.payout, 0);

  const columns: Column<Course>[] = [
    {
      key: "store",
      header: "Commerce",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-shell">
            <Image src={c.logo} alt={c.store} fill sizes="36px" className="object-cover" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{c.store}</p>
            <p className="text-[12px] text-muted">{c.ref}</p>
          </div>
        </div>
      ),
    },
    { key: "district", header: "Quartier", cell: (c) => <span className="text-muted">{c.district}</span> },
    { key: "distance", header: "Distance", align: "right", cell: (c) => formatDistance(c.distanceKm) },
    { key: "date", header: "Date", cell: (c) => <span className="text-muted">{formatDate(c.createdAt)}</span> },
    {
      key: "status",
      header: "Statut",
      cell: (c) => <Badge tone={ORDER_STATUS[c.status].tone}>{ORDER_STATUS[c.status].label}</Badge>,
    },
    {
      key: "payout",
      header: "Gain",
      align: "right",
      cell: (c) => <span className="font-bold text-ink">{formatFcfa(c.payout)}</span>,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Historique des courses</h2>
        <p className="text-sm text-muted">Retrouvez toutes vos livraisons et leurs gains.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total courses" value={String(courses.length)} icon={<Package className="h-5 w-5" />} />
        <KpiCard label="Livrées" value={String(delivered.length)} icon={<CheckCircle2 className="h-5 w-5" />} />
        <KpiCard label="En cours" value={String(courses.filter((c) => c.status === "DELIVERING").length)} icon={<Bike className="h-5 w-5" />} />
        <KpiCard label="Gains cumulés" value={formatFcfa(totalEarned)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="active">En cours</TabsTrigger>
          <TabsTrigger value="done">Livrées</TabsTrigger>
          <TabsTrigger value="cancelled">Annulées</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <DataTable columns={columns} rows={filtered} getRowKey={(c) => c.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
