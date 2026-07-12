"use client";
import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";
const KEY = "novigo-theme";

/** Applique le mode au <html> (classe .light/.dark) et persiste le choix. */
function apply(mode: Mode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (mode === "system") {
    localStorage.removeItem(KEY);
  } else {
    root.classList.add(mode);
    localStorage.setItem(KEY, mode);
  }
}

function current(): Mode {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(KEY) as Mode) ?? "system";
}

/**
 * Bascule clair / sombre / système. Le mode « système » suit la préférence OS
 * (géré par la media query dans globals.css). L'anti-FOUC est posé dans layout.tsx.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => setMode(current()), []);

  const cycle = () => {
    const next: Mode = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    apply(next);
    setMode(next);
  };

  const icon = mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "🖥️";
  const label = mode === "light" ? "Clair" : mode === "dark" ? "Sombre" : "Système";

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Thème : ${label} (cliquer pour changer)`}
      aria-label={`Thème : ${label}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm text-muted transition-colors hover:bg-paper hover:text-ink"
    >
      <span aria-hidden className="text-base leading-none">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
