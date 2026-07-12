"use client";

import { icons, type LucideProps } from "lucide-react";

/** Rend une icône Lucide à partir de son nom (clé stockée en donnée). */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = icons[name as keyof typeof icons] ?? icons.Circle;
  return <Cmp {...props} />;
}
