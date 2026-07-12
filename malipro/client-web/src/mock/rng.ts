/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 * Déterminisme = mêmes données au serveur et au client → aucune erreur d'hydratation.
 * Aucune dépendance à Math.random / Date.now.
 */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s |= 0;
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Entier dans [min, max]. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  /** Flottant dans [min, max]. */
  float(min: number, max: number, decimals = 2): number {
    const v = this.next() * (max - min) + min;
    const p = Math.pow(10, decimals);
    return Math.round(v * p) / p;
  }
  /** Élément aléatoire d'un tableau. */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  /** n éléments distincts d'un tableau. */
  sample<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    const count = Math.min(n, copy.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(this.next() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }
  /** Vrai avec la probabilité p. */
  bool(p = 0.5): boolean {
    return this.next() < p;
  }
  /** Un identifiant court déterministe. */
  id(prefix: string): string {
    return `${prefix}_${Math.floor(this.next() * 1e9).toString(36)}`;
  }
}

/** Combine une graine de base avec un index. */
export function seededRng(base: number, index = 0): Rng {
  return new Rng((base * 2654435761 + index * 40503 + 1013904223) >>> 0);
}

/** Hash déterministe d'une chaîne (pour graines stables par slug). */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
