"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { RotateCcw, ChevronRight } from "lucide-react";
import type { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/states";
import { ORDER_STATUS } from "@/constants";
import { formatFcfa, formatDate } from "@/lib/utils";

export interface OrderRow {
  order: Order;
  slug: string;
}

type Filter = "current" | "delivered" | "cancelled";

const OPTIONS: { value: Filter; label: string }[] = [
  { value: "current", label: "En cours" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
];

function bucket(status: Order["status"]): Filter {
  if (status === "DELIVERED") return "delivered";
  if (status === "CANCELLED" || status === "REFUNDED") return "cancelled";
  return "current";
}

export function OrdersList({ rows }: { rows: OrderRow[] }) {
  const [filter, setFilter] = React.useState<Filter>("current");
  const visible = rows.filter((r) => bucket(r.order.status) === filter);

  const emptyCopy: Record<Filter, string> = {
    current: "Vous n'avez aucune commande en cours.",
    delivered: "Aucune commande livrée pour le moment.",
    cancelled: "Aucune commande annulée. Tant mieux !",
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Segmented options={OPTIONS} value={filter} onChange={(v) => setFilter(v)} className="w-full sm:w-auto" />
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            title="Rien par ici"
            description={emptyCopy[filter]}
            action={
              <Button asChild variant="secondary">
                <Link href="/restaurants">Explorer les commerces</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map(({ order, slug }) => (
            <OrderCard key={order.id} order={order} slug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, slug }: { order: Order; slug: string }) {
  const meta = ORDER_STATUS[order.status];
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  const delivered = order.status === "DELIVERED";

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-shell">
          <Image src={order.storeLogo} alt={order.storeName} fill sizes="48px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="line-clamp-1 text-sm font-bold text-ink">{order.storeName}</p>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <p className="mt-0.5 text-[12px] text-muted">
            {order.ref} · {formatDate(order.createdAt)}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {itemCount} article{itemCount > 1 ? "s" : ""} · <span className="font-semibold text-ink">{formatFcfa(order.total)}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button asChild variant="secondary" size="sm" className="flex-1">
          <Link href={`/orders/${order.id}`}>
            Détails
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        {slug && (
          <Button asChild variant={delivered ? "subtle" : "ghost"} size="sm" className="flex-1">
            <Link href={`/store/${slug}`}>
              <RotateCcw className="h-4 w-4" />
              Recommander
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
