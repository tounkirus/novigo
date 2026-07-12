"use client";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      "bg-brand text-white hover:bg-brand-dark disabled:opacity-50 disabled:pointer-events-none",
    outline: "border border-line text-ink hover:bg-paper",
    ghost: "text-muted hover:bg-paper hover:text-ink",
  };
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
