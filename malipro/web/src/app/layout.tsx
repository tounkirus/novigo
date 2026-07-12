import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Police Inter auto-hébergée par Next (aucune requête CDN à l'exécution).
// Expose --font-sans, consommé par le body dans globals.css.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOVIGO — Console admin",
  description: "Console d'administration de la super app NOVIGO.",
};

// Anti-FOUC : applique le thème persisté avant le premier rendu (le mode « système »
// est géré par la media query dans globals.css, donc rien à faire sans choix explicite).
const themeInit = `(function(){try{var t=localStorage.getItem('novigo-theme');if(t==='dark'||t==='light'){document.documentElement.classList.add(t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
