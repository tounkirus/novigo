"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Saisie d'un code OTP à 6 chiffres (6 cases, avance automatique). */
export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, "").slice(-1);
    const chars = value.split("");
    chars[index] = clean;
    const nextValue = chars.join("").slice(0, length);
    onChange(nextValue);
    if (clean && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Code de validation à 6 chiffres">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Chiffre ${i + 1}`}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border-2 bg-surface text-center text-xl font-bold text-ink transition focus:outline-none focus:ring-2 focus:ring-brand-soft",
            value[i] ? "border-brand" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
