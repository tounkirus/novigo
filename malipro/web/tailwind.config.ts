import type { Config } from "tailwindcss";

/**
 * Les jetons de couleur pointent sur des variables CSS (canaux RGB) définies dans
 * globals.css, ce qui permet le mode sombre sans toucher aux composants : les
 * classes existantes (bg-brand, text-ink, border-line…) s'adaptent automatiquement.
 * `<alpha-value>` conserve le support des utilitaires d'opacité (bg-brand/40…).
 */
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: c("--brand"),
          dark: c("--brand-dark"),
          soft: "rgb(var(--brand) / 0.12)",
        },
        gold: {
          DEFAULT: c("--gold"),
          dark: c("--gold-dark"),
          soft: "rgb(var(--gold) / 0.14)",
        },
        ink: {
          DEFAULT: c("--ink"),
          700: c("--ink"),
          500: c("--muted"),
        },
        paper: c("--paper"),
        surface: c("--surface"),
        shell: c("--shell"),
        muted: c("--muted"),
        line: c("--line"),
        success: { DEFAULT: c("--success"), soft: "rgb(var(--success) / 0.14)" },
        error: { DEFAULT: c("--error"), soft: "rgb(var(--error) / 0.14)" },
        info: { DEFAULT: c("--info"), soft: "rgb(var(--info) / 0.14)" },
        warning: { DEFAULT: c("--warning"), soft: "rgb(var(--warning) / 0.16)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--ink) / 0.04), 0 8px 24px rgb(var(--ink) / 0.06)",
        lifted: "0 12px 32px rgb(var(--ink) / 0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
export default config;
