"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, suffix, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/40",
          className,
        )}
      >
        {icon && <span className="text-muted">{icon}</span>}
        <input
          ref={ref}
          className="h-full w-full bg-transparent text-ink placeholder:text-muted/80 focus:outline-none"
          {...props}
        />
        {suffix}
      </div>
    );
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[92px] w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/80 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-medium text-ink", className)} {...props} />;
}
