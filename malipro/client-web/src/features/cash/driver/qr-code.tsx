"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * QR code stylisé DÉTERMINISTE (damier) — purement décoratif.
 * La trame est générée depuis une graine (jamais Math.random) et reste stable.
 */
export function QrCode({
  seed,
  size = 208,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const modules = 25;
  const cell = size / modules;

  const filled = React.useMemo(() => {
    // Hash FNV-1a déterministe de la graine.
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let state = h >>> 0;
    const next = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return (state >>> 8) & 0xff;
    };
    const inFinder = (r: number, c: number) => {
      const box = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
      return box(0, 0) || box(0, modules - 7) || box(modules - 7, 0);
    };
    const grid: boolean[] = [];
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        grid.push(!inFinder(r, c) && next() > 128);
      }
    }
    return grid;
  }, [seed]);

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (filled[r * modules + c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell}
            height={cell}
            rx={cell * 0.18}
          />,
        );
      }
    }
  }

  // Motifs de repérage (finder patterns) dans 3 coins.
  const finder = (br: number, bc: number, key: string) => (
    <g key={key} fill="currentColor">
      <rect x={bc * cell} y={br * cell} width={cell * 7} height={cell * 7} rx={cell} />
      <rect
        x={(bc + 1) * cell}
        y={(br + 1) * cell}
        width={cell * 5}
        height={cell * 5}
        rx={cell * 0.8}
        fill="#fff"
      />
      <rect
        x={(bc + 2) * cell}
        y={(br + 2) * cell}
        width={cell * 3}
        height={cell * 3}
        rx={cell * 0.6}
        fill="currentColor"
      />
    </g>
  );

  return (
    <div className={cn("inline-flex rounded-2xl bg-white p-4 shadow-card", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="QR code de remise de caisse"
        className="text-emerald-700"
      >
        <g fill="currentColor">{rects}</g>
        {finder(0, 0, "tl")}
        {finder(0, modules - 7, "tr")}
        {finder(modules - 7, 0, "bl")}
      </svg>
    </div>
  );
}
