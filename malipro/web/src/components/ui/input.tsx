"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted",
          "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
          className
        )}
        {...props}
      />
    );
  }
);
