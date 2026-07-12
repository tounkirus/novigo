"use client";

import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import type { GeoPoint } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Carte NOVIGO — placeholder stylisé (grille + route + pins) prêt à être
 * remplacé par Google Maps / Mapbox. L'API (markers, route, progress) reste stable.
 */
export interface MapMarker {
  id: string;
  point: GeoPoint;
  label?: string;
  tone?: "brand" | "success" | "muted";
}

export function MapView({
  markers = [],
  progress,
  className,
  height = 220,
}: {
  markers?: MapMarker[];
  progress?: number; // 0..100 : position du mobile sur la route
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border border-line bg-shell", className)}
      style={{ height }}
      role="img"
      aria-label="Carte de localisation"
    >
      {/* Fond quadrillé */}
      <svg className="absolute inset-0 h-full w-full opacity-70" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="rgb(var(--line))" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mp-grid)" />
        {/* Route */}
        <path d="M 24 180 C 120 120, 200 200, 320 80" fill="none" stroke="rgb(var(--brand) / 0.5)" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10" />
        <path d="M 24 180 C 120 120, 200 200, 320 80" fill="none" stroke="rgb(var(--brand))" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Mobile en mouvement */}
      {progress != null && (
        <div
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-glow transition-all duration-700"
          style={{ left: `${8 + progress * 0.84}%`, top: `${80 - progress * 0.32}%` }}
        >
          <Navigation className="h-4 w-4" />
        </div>
      )}

      {/* Pins */}
      <div className="absolute left-4 top-1/2 flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold shadow-card">
        <span className="h-2 w-2 rounded-full bg-success" /> Départ
      </div>
      <div className="absolute right-4 top-6 flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold shadow-card">
        <MapPin className="h-3 w-3 text-brand" /> Arrivée
      </div>

      {markers.slice(0, 4).map((m, i) => (
        <div
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${20 + i * 22}%`, top: `${40 + (i % 2) * 20}%` }}
        >
          <MapPin
            className={cn(
              "h-6 w-6 drop-shadow",
              m.tone === "success" ? "text-success" : m.tone === "muted" ? "text-muted" : "text-brand",
            )}
            fill="currentColor"
          />
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-shell/40 to-transparent" />
    </div>
  );
}
