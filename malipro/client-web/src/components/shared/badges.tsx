import type { Badge as BadgeType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Icon } from "./icon";
import { BADGE_LABEL } from "@/constants";
import { cn } from "@/lib/utils";

export function StoreBadges({ badges, max = 3, className }: { badges: BadgeType[]; max?: number; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.slice(0, max).map((b) => {
        const def = BADGE_LABEL[b];
        if (!def) return null;
        return (
          <span key={b} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", def.className)}>
            <Icon name={def.icon} className="h-3 w-3" />
            {def.label}
          </span>
        );
      })}
    </div>
  );
}

export function OpenStatus({ isOpen }: { isOpen: boolean }) {
  return (
    <Badge tone={isOpen ? "success" : "neutral"}>
      <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-success" : "bg-muted")} />
      {isOpen ? "Ouvert" : "Fermé"}
    </Badge>
  );
}
