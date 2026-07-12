"use client";

import * as React from "react";

/** Valeur debouncée (recherche, filtres…). */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Media query réactive (responsive côté client). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatches(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 768px)");
}

/** Copie dans le presse-papier avec retour d'état temporaire. */
export function useCopy(timeout = 1600): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = React.useState(false);
  const copy = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch {
        /* ignore */
      }
    },
    [timeout],
  );
  return [copied, copy];
}

/** Détecte prefers-reduced-motion. */
export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Position de scroll dépassée (headers dynamiques). */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return scrolled;
}

/** Compteur animé (KPIs). Déterministe côté rendu final. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
