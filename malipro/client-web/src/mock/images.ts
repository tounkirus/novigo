import { slugify } from "@/lib/utils";

/**
 * Images de démonstration déterministes (remplaçables par de vrais visuels).
 * picsum.photos = photos, ui-avatars = avatars. Le seed rend l'URL stable.
 */
export function photo(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/mp-${slugify(seed)}/${w}/${h}`;
}

export function avatar(name: string): string {
  const bg = ["E53935", "C62828", "2E7D32", "1976D2", "F9A825", "6A1B9A", "00838F"];
  const i = Math.abs(hash(name)) % bg.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg[i]}&color=fff&size=160&bold=true`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
