import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const FLOW: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PREPARING", "READY",
  "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED",
];

const LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée", PREPARING: "Préparation",
  READY: "Prête", ASSIGNED: "Assignée", PICKED_UP: "Récupérée",
  IN_TRANSIT: "En route", DELIVERED: "Livrée",
  CANCELLED: "Annulée", REFUNDED: "Remboursée",
};

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const terminal = status === "CANCELLED" || status === "REFUNDED";
  if (terminal) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-[#FBE9E7] px-3 py-2 text-sm text-[#B23A2E]">
        <span className="h-2 w-2 rounded-full bg-[#B23A2E]" />
        Commande {LABELS[status].toLowerCase()}
      </div>
    );
  }
  const currentIdx = FLOW.indexOf(status);
  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-3">
      {FLOW.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold",
                  done && "bg-brand text-white",
                  active && "bg-brand text-white ring-4 ring-brand-soft",
                  !done && !active && "bg-line text-muted"
                )}
              >
                {i + 1}
              </span>
              <span className={cn("mt-1 text-[10px]", active ? "font-medium text-ink" : "text-muted")}>
                {LABELS[step]}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <span className={cn("mb-4 h-0.5 w-6", i < currentIdx ? "bg-brand" : "bg-line")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
