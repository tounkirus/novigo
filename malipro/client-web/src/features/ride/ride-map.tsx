"use client";

import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carte stylisée (placeholder élégant) : quadrillage, route SVG et pins
 * départ/arrivée. Aucune vraie carte — rendu déterministe.
 */
export function RideMap({
  from,
  to,
  distanceKm,
  durationMin,
  className,
}: {
  from: string;
  to: string;
  distanceKm?: number;
  durationMin?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-52 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-soft via-shell to-surface",
        className,
      )}
    >
      {/* Quadrillage */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      {/* Route */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 208" fill="none" aria-hidden>
        <path
          d="M46 52 C 120 60, 90 150, 274 158"
          stroke="url(#route)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="2 12"
        />
        <path
          d="M46 52 C 120 60, 90 150, 274 158"
          className="text-brand/25"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="route" x1="0" y1="0" x2="320" y2="208" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--brand, #2ec27e)" />
            <stop offset="1" stopColor="var(--brand, #2ec27e)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {/* Pin départ */}
      <span
        className="absolute left-[11%] top-[20%] flex h-9 w-9 items-center justify-center rounded-full bg-surface text-brand shadow-card ring-2 ring-brand/40"
        aria-hidden
      >
        <Navigation className="h-4 w-4" />
      </span>

      {/* Pin arrivée */}
      <span
        className="absolute bottom-[16%] right-[12%] flex h-10 w-10 items-center justify-center rounded-full brand-gradient text-white shadow-glow"
        aria-hidden
      >
        <MapPin className="h-5 w-5" />
      </span>

      {/* Étiquettes trajet */}
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <div className="min-w-0 rounded-xl bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <span className="h-2 w-2 rounded-full bg-brand" /> Départ
          </p>
          <p className="truncate text-[13px] font-bold text-ink">{from}</p>
        </div>
        <div className="min-w-0 rounded-xl bg-surface/95 px-3 py-2 text-right shadow-card backdrop-blur">
          <p className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-muted">
            Arrivée <span className="h-2 w-2 rounded-full bg-ink" />
          </p>
          <p className="truncate text-[13px] font-bold text-ink">{to || "À définir"}</p>
        </div>
      </div>

      {/* Distance / durée */}
      {distanceKm != null && durationMin != null && (
        <div className="absolute right-3 top-3 rounded-full bg-ink/90 px-3 py-1.5 text-[12px] font-bold text-white shadow-card backdrop-blur">
          {distanceKm.toFixed(1).replace(".", ",")} km · {durationMin} min
        </div>
      )}
    </div>
  );
}
