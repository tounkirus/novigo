import Link from "next/link";
import Image from "next/image";
import { Truck, ChevronRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import type { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrdersList, type OrderRow } from "@/features/orders/orders-list";
import { orders, activeOrder, storeById } from "@/mock";
import { ORDER_STATUS, ORDER_FLOW } from "@/constants";
import { formatFcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes commandes · NOVIGO",
  description: "Suivez vos commandes en cours et retrouvez votre historique NOVIGO.",
};

export default function OrdersPage() {
  const all = orders();
  const active = activeOrder();
  const rows: OrderRow[] = all
    .filter((o) => o.id !== active?.id)
    .map((o) => ({ order: o, slug: storeById(o.storeId)?.slug ?? "" }));

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-ink">Mes commandes</h1>

      {active && <ActiveOrderCard order={active} />}

      <OrdersList rows={rows} />
    </div>
  );
}

function ActiveOrderCard({ order }: { order: Order }) {
  const meta = ORDER_STATUS[order.status];
  const progress = Math.round(((meta.step + 1) / ORDER_FLOW.length) * 100);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-brand-soft/40 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-brand">
          <Truck className="h-4 w-4" />
          Commande en cours
        </span>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-shell">
            <Image src={order.storeLogo} alt={order.storeName} fill sizes="56px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-base font-bold text-ink">{order.storeName}</p>
            <p className="text-[13px] text-muted">
              {order.ref} · {formatFcfa(order.total)}
            </p>
          </div>
          {order.etaMinutes > 0 && (
            <div className="shrink-0 text-right">
              <p className="flex items-center justify-end gap-1 text-lg font-black text-ink">
                <Clock className="h-4 w-4 text-brand" />
                {order.etaMinutes} min
              </p>
              <p className="text-[12px] text-muted">Arrivée estimée</p>
            </div>
          )}
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full brand-gradient transition-all" style={{ width: `${progress}%` }} />
        </div>

        <Button asChild block className="mt-4">
          <Link href={`/orders/${order.id}`}>
            Suivre ma commande
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
