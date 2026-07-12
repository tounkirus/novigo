"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", className)}>
      <Star className={cn("fill-gold text-gold", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      <span className={size === "sm" ? "text-[13px]" : "text-sm"}>{formatRating(value)}</span>
      {count != null && <span className="font-normal text-muted">({count > 999 ? "999+" : count})</span>}
    </span>
  );
}

export function StarInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="transition-transform active:scale-90"
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors",
              (hover || value) >= n ? "fill-gold text-gold" : "fill-transparent text-line",
            )}
          />
        </button>
      ))}
    </div>
  );
}
