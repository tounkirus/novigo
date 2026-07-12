"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import { STEPS } from "./constants";

export function Stepper({
  current,
  valid,
  onGo,
}: {
  current: number;
  valid: boolean[];
  onGo: (step: number) => void;
}) {
  /** Une étape est atteignable si toutes les précédentes sont valides. */
  function reachable(target: number): boolean {
    if (target <= current) return true;
    for (let i = 0; i < target; i++) if (!valid[i]) return false;
    return true;
  }

  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const isDone = i < current && valid[i];
        const isActive = i === current;
        const canGo = reachable(i);
        const last = i === STEPS.length - 1;
        return (
          <div key={s.id} className={cn("flex items-center", !last && "flex-1")}>
            <button
              type="button"
              onClick={() => canGo && onGo(i)}
              disabled={!canGo}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Étape ${i + 1} : ${s.label}`}
              className={cn(
                "group flex flex-col items-center gap-1.5 outline-none",
                canGo ? "cursor-pointer" : "cursor-not-allowed",
              )}
            >
              <motion.span
                initial={false}
                animate={{ scale: isActive ? 1.06 : 1 }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                  isActive && "border-brand bg-brand text-white shadow-glow",
                  isDone && "border-success bg-success text-white",
                  !isActive && !isDone && "border-line bg-surface text-muted group-hover:border-brand/40",
                )}
              >
                {isDone ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon name={s.icon} className="h-5 w-5" />}
              </motion.span>
              <span
                className={cn(
                  "hidden text-center text-[11px] font-semibold leading-tight sm:block",
                  isActive ? "text-brand" : isDone ? "text-ink" : "text-muted",
                )}
              >
                {s.short}
              </span>
            </button>
            {!last && (
              <span className="relative mx-1.5 mb-4 h-0.5 flex-1 overflow-hidden rounded-full bg-line sm:mx-2">
                <motion.span
                  initial={false}
                  animate={{ scaleX: i < current ? 1 : 0 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 bg-success"
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
