import { cn } from "@/lib/utils";
import { formatFcfa, discountPercent } from "@/lib/utils";

export function Price({
  value,
  oldValue,
  className,
  size = "md",
}: {
  value: number;
  oldValue?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = oldValue ? discountPercent(oldValue, value) : 0;
  const sizes = { sm: "text-[13px]", md: "text-sm", lg: "text-lg" };
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className={cn("font-bold text-ink tabular-nums", sizes[size])}>{formatFcfa(value)}</span>
      {pct > 0 && (
        <span className="text-xs font-medium text-muted line-through tabular-nums">{formatFcfa(oldValue!)}</span>
      )}
    </span>
  );
}
