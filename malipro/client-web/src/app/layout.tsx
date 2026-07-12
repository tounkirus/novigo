import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { BRAND } from "@/constants";

// Inter auto-hébergé (woff2 variable) : aucun appel réseau au build → image Docker offline-safe.
const inter = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "NOVIGO, la Super App du Mali : livraison de repas, supermarchés, pharmacies, marchés, colis, taxis et services locaux à Bamako.",
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon",
  },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: `${BRAND.name}, la Super App du Mali : repas, courses, pharmacies, colis, taxis et services locaux à Bamako.`,
    locale: "fr_FR",
    images: [{ url: "/og", width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    images: ["/og"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E53935" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1117" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
