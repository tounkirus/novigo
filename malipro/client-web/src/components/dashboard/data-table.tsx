import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  headClassName?: string;
}

const alignClass: Record<NonNullable<Column<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/** Table de données réutilisable, présentation seule (utilisable côté serveur ou client). */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  className,
  minWidth = 720,
  empty = "Aucune donnée à afficher",
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  className?: string;
  minWidth?: number;
  empty?: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-line bg-surface shadow-card", className)}>
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line bg-shell/50">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted",
                  alignClass[c.align ?? "left"],
                  c.headClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={getRowKey(row, i)} className="border-b border-line transition last:border-0 hover:bg-shell/60">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-ink",
                      alignClass[c.align ?? "left"],
                      c.align === "right" && "tabular-nums",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Contrôle de pagination réutilisable. */
export function Pagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-muted">
        {total} résultat(s) · page {page + 1} sur {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0}>
          <ChevronLeft className="h-4 w-4" /> Précédent
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onPage(Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1}>
          Suivant <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
