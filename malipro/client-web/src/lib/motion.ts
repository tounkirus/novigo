import type { Variants, Transition } from "framer-motion";

/**
 * Presets d'animation NOVIGO — réutilisables sur tout l'écran.
 * Respecte prefers-reduced-motion via le CSS global (durées ~0).
 */

export const spring: Transition = { type: "spring", stiffness: 320, damping: 30 };
export const springSoft: Transition = { type: "spring", stiffness: 220, damping: 26 };
export const easeOut: Transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: easeOut },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: spring },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: easeOut },
};

/** Conteneur pour animation en cascade des enfants. */
export const staggerContainer = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Enfant d'un conteneur staggeré. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

/** Micro-interaction tactile standard (boutons/cartes cliquables). */
export const tap = { scale: 0.97 } as const;
export const hoverLift = { y: -4, transition: spring } as const;

/** Transition de page (utilisée par le wrapper PageTransition). */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};
