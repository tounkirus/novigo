"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Révèle son contenu au scroll (une seule fois). Réutilisable partout.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof typeof motion;
} & HTMLMotionProps<"div">) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </Comp>
  );
}

/** Conteneur qui anime ses enfants <RevealItem> en cascade. */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      variants={staggerContainer(stagger)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={cn(className)}>
      {children}
    </motion.div>
  );
}
