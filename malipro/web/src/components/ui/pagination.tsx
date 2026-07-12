"use client";
import type { PaginationMeta } from "@/lib/api/types";
import { Button } from "./button";
import { formatNumber } from "@/lib/utils";

export function Pagination({
  meta,
  onPage,
}: {
  meta?: PaginationMeta;
  onPage: (page: number) => void;
}) {
  if (!meta) return null;
  const { page, totalPages, total } = meta;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3">
      <p className="text-xs text-muted">
        {formatNumber(total)} résultat{total > 1 ? "s" : ""} · page {page}/{Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Précédent
        </Button>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
