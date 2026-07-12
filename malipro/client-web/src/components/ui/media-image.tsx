"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { fallbackImage } from "@/mock/media";

/**
 * Image média résiliente : si la source principale échoue (loremflickr lent/rate-limité),
 * bascule automatiquement sur un repli déterministe fiable (picsum) — jamais d'image cassée.
 * API identique à next/image (fill ou width/height, sizes, className…).
 */
export function MediaImage({ src, alt, onError, ...props }: ImageProps) {
  const [current, setCurrent] = React.useState(src);

  React.useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={current}
      alt={alt}
      onError={(e) => {
        if (typeof src === "string" && current === src) setCurrent(fallbackImage(src));
        onError?.(e);
      }}
    />
  );
}
