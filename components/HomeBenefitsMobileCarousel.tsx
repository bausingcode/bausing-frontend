"use client";

import { useEffect, useRef } from "react";

export interface HomeBenefitCard {
  title: string;
  description: string;
}

const AUTO_MS = 4500;

export default function HomeBenefitsMobileCarousel({
  items,
}: {
  items: HomeBenefitCard[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || items.length <= 1) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tick = () => {
      const el = scrollRef.current;
      if (!el) return;
      const slides = el.querySelectorAll<HTMLElement>("[data-benefit-slide]");
      if (slides.length < 2) return;

      const n = items.length;
      const next = (indexRef.current + 1) % n;
      indexRef.current = next;

      const target = slides[next];
      if (!target) {
        timerRef.current = setTimeout(tick, 100);
        return;
      }

      if (next === 0) {
        el.scrollLeft = 0;
      } else {
        el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
      }

      timerRef.current = setTimeout(tick, AUTO_MS);
    };

    timerRef.current = setTimeout(tick, AUTO_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="mt-4 md:hidden max-w-5xl lg:max-w-6xl mx-auto">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        role="region"
        aria-label="Beneficios"
      >
        <div className="flex gap-6 px-1" style={{ width: "max-content" }}>
          {items.map((item) => (
            <div
              key={item.title}
              data-benefit-slide
              className="flex flex-col items-center text-center px-2 min-w-[calc(100vw-2rem)] flex-shrink-0 snap-start"
            >
              <h4 className="text-[#101828] font-semibold text-base mb-[3px]">
                {item.title}
              </h4>
              <p className="text-black/50 text-base leading-relaxed mb-4 flex-1 max-w-xs">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
