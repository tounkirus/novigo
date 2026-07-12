"use client";
import { ReactNode } from "react";
import { Skeleton } from "./skeleton";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyTitle = "Aucune donnée",
}: {
  columns: Column<T>[];
  rows?: T[];
  loading?: boolean;
  emptyTitle?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted " +
                  (c.align === "right" ? "text-right" : "")
                }
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-line/60">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          {!loading &&
            rows?.map((row) => (
              <tr key={row.id} className="border-b border-line/60 hover:bg-paper">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={
                      "px-4 py-3.5 text-ink " + (c.align === "right" ? "text-right tabular-nums font-mono" : "")
                    }
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      {!loading && (!rows || rows.length === 0) && <EmptyState title={emptyTitle} />}
    </div>
  );
}
