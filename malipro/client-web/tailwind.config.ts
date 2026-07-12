import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Design System NOVIGO.
 * Les jetons de couleur pointent vers des variables CSS (canaux RGB) définies dans
 * globals.css, ce qui permet le mode sombre sans toucher aux composants.
 * `<alpha-value>` conserve le support des utilitaires d'opacité (bg-brand/40…).
 */
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: c("--brand"),
          dark: c("--brand-dark"),
          light: c("--brand-light"),
          soft: "rgb(var(--brand) / 0.12)",
        },
        gold: {
          DEFAULT: c("--gold"),
          dark: c("--gold-dark"),
          soft: "rgb(var(--gold) / 0.16)",
        },
        ink: {
          DEFAULT: c("--ink"),
          muted: c("--muted"),
        },
        paper: c("--paper"),
        surface: c("--surface"),
        shell: c("--shell"),
        muted: c("--muted"),
        line: c("--line"),
        gray: c("--gray"),
        success: { DEFAULT: c("--success"), soft: "rgb(var(--success) / 0.14)" },
        error: { DEFAULT: c("--error"), soft: "rgb(var(--error) / 0.14)" },
        info: { DEFAULT: c("--info"), soft: "rgb(var(--info) / 0.14)" },
        warning: { DEFAULT: c("--warning"), soft: "rgb(var(--warning) / 0.16)" },
        violet: { DEFAULT: c("--violet"), soft: "rgb(var(--violet) / 0.14)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.06), 0 8px 24px rgb(var(--shadow) / 0.10)",
        lifted: "0 14px 40px rgb(var(--shadow) / 0.22)",
        glow: "0 8px 30px rgb(var(--brand) / 0.30)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        xl: "0.9rem",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.4s ease-out both",
        "accordion-down": "accordion-down 0.25s ease-out",
        "accordion-up": "accordion-up 0.25s ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
