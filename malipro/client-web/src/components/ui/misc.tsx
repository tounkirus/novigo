"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Avatar image avec repli initiales. */
export function Avatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden rounded-full bg-shell", className)}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

/** Barre de progression. */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}>
      <div
        className="h-full rounded-full brand-gradient transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** Contrôle segmenté simple. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-full bg-shell p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "focus-ring rounded-full px-4 py-2 text-[13px] font-medium transition-all",
            value === o.value ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Compteur de quantité (stepper). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const s = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10";
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-0.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn("focus-ring flex items-center justify-center rounded-full text-ink transition hover:bg-shell disabled:opacity-40", s)}
        aria-label="Diminuer"
      >
        −
      </button>
      <span className={cn("min-w-6 text-center text-sm font-semibold tabular-nums", size === "sm" && "min-w-5")}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn("focus-ring flex items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40", s)}
        aria-label="Augmenter"
      >
        +
      </button>
    </div>
  );
}

/** Fil d'ariane léger. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}
