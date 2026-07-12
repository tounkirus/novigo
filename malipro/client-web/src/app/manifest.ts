import type { MetadataRoute } from "next";
import { BRAND } from "@/constants";

/**
 * Manifest PWA NOVIGO — pilote le nom, les couleurs officielles, les icônes
 * Android et l'écran de démarrage (splash) généré par Chrome à partir de
 * name + background_color + theme_color + icône.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: `${BRAND.name}, la Super App du Mali : repas, courses, pharmacies, colis, taxis et services à Bamako.`,
    start_url: "/",
    display: "standalone",
    background_color: "#0F1117",
    theme_color: "#E53935",
    lang: "fr",
    orientation: "portrait",
    icons: [
      { src: "/logo-mark.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/android-icon-192", type: "image/png", sizes: "192x192", purpose: "maskable" },
      { src: "/android-icon-512", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
