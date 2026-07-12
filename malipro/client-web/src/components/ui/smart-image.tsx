"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * Image optimisée avec squelette + fondu à l'apparition.
 * Remplace next/image quand on veut un état de chargement propre.
 */
export function SmartImage({ className, alt, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <>
      {!loaded && <span className="absolute inset-0 animate-pulse bg-line/60" aria-hidden />}
      <Image
        alt={alt}
        className={cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        {...props}
      />
    </>
  );
}
