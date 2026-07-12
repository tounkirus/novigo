import { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: "brand" | "gold";
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span
          className={
            "h-2 w-2 rounded-full " + (accent === "gold" ? "bg-gold" : "bg-brand")
          }
        />
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
