"use client";

import { useSyncExternalStore, useCallback } from "react";

/** Store de favoris minimaliste basé sur localStorage + useSyncExternalStore. */
const KEY = "novigo.favorites.v1";
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = []);
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: string[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => cache ?? []);

  const toggle = useCallback((id: string) => {
    const cur = read();
    write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, []);

  const has = useCallback((id: string) => read().includes(id), [ids]);

  return { ids, toggle, has };
}
