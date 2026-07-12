import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  href,
  action = "Tout voir",
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand transition hover:gap-1.5">
          {action}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("py-4", className)}>{children}</section>;
}
