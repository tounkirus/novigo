"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rangée horizontale à défilement fluide (rails de cartes). */
export function HScroll({
  children,
  className,
  itemClassName,
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1", className)}>
      {React.Children.map(children, (child) => (
        <div className={cn("snap-start", itemClassName)}>{child}</div>
      ))}
    </div>
  );
}

export interface CarouselSlide {
  id: string;
  content: React.ReactNode;
}

/** Carrousel plein largeur avec pagination et transitions. */
export function Carousel({ slides, className }: { slides: CarouselSlide[]; className?: string }) {
  const [index, setIndex] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const count = slides.length;

  const go = React.useCallback(
    (next: number) => {
      setDir(next > index ? 1 : -1);
      setIndex((next + count) % count);
    },
    [index, count],
  );

  React.useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % count);
    }, 5000);
    return () => clearInterval(t);
  }, [count]);

  if (!count) return null;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={slides[index].id}
          custom={dir}
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {slides[index].content}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur transition hover:bg-black/50 sm:block"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur transition hover:bg-black/50 sm:block"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50",
                )}
                aria-label={`Aller à la diapositive ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
