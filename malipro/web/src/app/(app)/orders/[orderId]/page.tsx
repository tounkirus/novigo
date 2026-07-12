"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, trackOrder, cancelOrder } from "@/lib/api/endpoints";
import { Topbar } from "@/components/shell/topbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderTimeline } from "@/components/ui/order-timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { OrderStatus } from "@/lib/api/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "ASSIGNED"];

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const qc = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const order = useQuery({ queryKey: ["order", orderId], queryFn: () => getOrder(orderId) });
  const tracking = useQuery({
    queryKey: ["order", orderId, "tracking"],
    queryFn: () => trackOrder(orderId),
    refetchInterval: 15_000,
    retry: false,
  });

  const cancel = useMutation({
    mutationFn: () => cancelOrder(orderId, "Annulée depuis la console admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => setCancelError(e instanceof ApiError ? e.message : "Annulation impossible."),
  });

  const o = order.data?.data;
  const t = tracking.data?.data;

  return (
    <>
      <Topbar title="Détail commande" />
      <main className="flex-1 space-y-4 p-6">
        <Link href="/orders" className="text-sm text-brand hover:underline">
          ← Retour aux commandes
        </Link>

        {order.isLoading && <Skeleton className="h-40 w-full rounded-xl" />}

        {order.isError && (
          <div className="rounded-xl bg-[#FBE9E7] px-4 py-3 text-sm text-[#B23A2E]">
            Commande introuvable.
          </div>
        )}

        {o && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-semibold text-ink">
                  {o.reference ?? o.id}
                </p>
                <p className="text-xs text-muted">Créée le {formatDate(o.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={o.status} />
                {CANCELLABLE.includes(o.status) && (
                  <Button
                    variant="outline"
                    onClick={() => cancel.mutate()}
                    disabled={cancel.isPending}
                  >
                    {cancel.isPending ? "Annulation…" : "Annuler la commande"}
                  </Button>
                )}
              </div>
            </div>

            {cancelError && (
              <p className="rounded-lg bg-[#FBE9E7] px-3 py-2 text-xs text-[#B23A2E]">{cancelError}</p>
            )}

            <Card title="Progression">
              <OrderTimeline status={o.status} />
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Articles">
                {o.items && o.items.length > 0 ? (
                  <div className="divide-y divide-line">
                    {o.items.map((it) => (
                      <div key={it.productId} className="flex justify-between py-2 text-sm">
                        <span className="text-ink">
                          {it.quantity} × {it.name}
                        </span>
                        <span className="font-mono tabular-nums text-ink">
                          {formatMoney({ amount: it.unitPrice.amount * it.quantity, currency: "XOF" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Aucun article détaillé.</p>
                )}
                <div className="mt-3 border-t border-line pt-3">
                  <Row label="Sous-total" value={formatMoney(o.subtotal)} />
                  <Row label="Livraison" value={formatMoney(o.deliveryFee)} />
                  <Row label="Total" value={<span className="text-brand-dark">{formatMoney(o.total)}</span>} />
                </div>
              </Card>

              <div className="space-y-4">
                <Card title="Paiement & livraison">
                  <Row label="Type" value={o.type} />
                  <Row label="Moyen de paiement" value={o.paymentMethod ?? "—"} />
                  {o.deliveryAddress && (
                    <Row
                      label="Adresse"
                      value={
                        <span className="text-right">
                          {o.deliveryAddress.line1}
                          <br />
                          {o.deliveryAddress.district ? `${o.deliveryAddress.district}, ` : ""}
                          {o.deliveryAddress.city}
                        </span>
                      }
                    />
                  )}
                </Card>

                <Card title="Suivi en temps réel">
                  {tracking.isError ? (
                    <p className="text-sm text-muted">Suivi indisponible pour cette commande.</p>
                  ) : t ? (
                    <>
                      <Row label="Statut" value={<StatusBadge status={t.status} />} />
                      <Row label="ETA" value={t.etaMinutes != null ? `${t.etaMinutes} min` : "—"} />
                      {t.driverLocation && (
                        <Row
                          label="Position livreur"
                          value={
                            <span className="font-mono text-xs">
                              {t.driverLocation.lat.toFixed(4)}, {t.driverLocation.lng.toFixed(4)}
                            </span>
                          }
                        />
                      )}
                      <p className="mt-1 text-[11px] text-muted">Rafraîchi toutes les 15 s.</p>
                    </>
                  ) : (
                    <Skeleton className="h-16 w-full" />
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
