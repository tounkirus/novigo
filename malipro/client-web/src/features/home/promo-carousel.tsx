"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Promotion } from "@/types";
import { Carousel } from "@/components/ui/carousel";

export function PromoCarousel({ promotions, storeSlugs }: { promotions: Promotion[]; storeSlugs: Record<string, string> }) {
  const slides = promotions.map((p) => ({
    id: p.id,
    content: (
      <Link href={p.storeId ? `/store/${storeSlugs[p.storeId] ?? ""}` : "/coupons"} className="relative block aspect-[21/9] w-full sm:aspect-[3/1]">
        <Image src={p.image} alt={p.title} fill sizes="(max-width:768px) 100vw, 1024px" className="object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${p.accent} opacity-85 mix-blend-multiply`} />
        <div className="absolute inset-0 flex flex-col justify-center p-6 text-white sm:p-8">
          <span className="mb-1 w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
            {p.title}
          </span>
          <p className="max-w-sm text-xl font-black leading-tight sm:text-2xl">{p.subtitle}</p>
          <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-ink">
            {p.cta} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    ),
  }));

  return <Carousel slides={slides} className="shadow-card" />;
}
