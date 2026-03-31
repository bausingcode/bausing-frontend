"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import wsrvLoader from "@/lib/wsrvLoader";
import { isHeroVideoUrl } from "@/lib/heroMedia";

export interface HeroBannerSlide {
  id: number;
  /** UUID del hero en backend (claves estables por slide) */
  heroId: string;
  url: string;
  alt: string;
  title?: string | null;
  subtitle?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
}

interface BannerCarouselProps {
  slides: HeroBannerSlide[];
  /** Intervalo en ms para slides que son imagen */
  autoPlayInterval?: number;
  /** Intervalo en ms para slides que son video (más largo para que se vea el clip) */
  videoSlideInterval?: number;
}

function slideHasOverlay(s: HeroBannerSlide) {
  const t = (s.title || "").trim();
  const st = (s.subtitle || "").trim();
  const cta = (s.cta_text || "").trim() && (s.cta_link || "").trim();
  return Boolean(t || st || cta);
}

/** Solo el texto de la diapositiva actual (cada foto/video tiene su propio copy en el admin) */
function overlayForIndex(slides: HeroBannerSlide[], index: number): HeroBannerSlide | null {
  const cur = slides[index];
  if (cur && slideHasOverlay(cur)) return cur;
  return null;
}

export default function BannerCarousel({
  slides,
  autoPlayInterval = 5000,
  videoSlideInterval = 15000,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const overlay = useMemo(
    () => overlayForIndex(slides, currentIndex),
    [slides, currentIndex]
  );

  useEffect(() => {
    if (slides.length <= 1) return;

    const slide = slides[currentIndex];
    const ms = isHeroVideoUrl(slide.url) ? videoSlideInterval : autoPlayInterval;
    const t = window.setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, ms);
    return () => clearTimeout(t);
  }, [
    currentIndex,
    slides,
    slides.length,
    autoPlayInterval,
    videoSlideInterval,
  ]);

  useEffect(() => {
    slides.forEach((slide, i) => {
      const el = videoRefs.current[i];
      if (!el || !isHeroVideoUrl(slide.url)) return;
      if (i === currentIndex) {
        el.play().catch(() => {});
      } else {
        el.pause();
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    });
  }, [currentIndex, slides]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (slides.length === 0) return null;

  const showOverlay = overlay && (
    (overlay.title || "").trim() ||
    (overlay.subtitle || "").trim() ||
    ((overlay.cta_text || "").trim() && (overlay.cta_link || "").trim())
  );

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] max-md:h-[clamp(92px,14svh,136px)] md:aspect-[1440/450] md:h-auto">
      <div className="absolute inset-0 opacity-10 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="absolute inset-0 min-w-0 z-[1]">
        {slides.map((slide, index) => {
          const video = isHeroVideoUrl(slide.url);
          return (
            <div
              key={`${slide.id}-${index}`}
              className={`absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] transition-opacity duration-1000 ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {video ? (
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={slide.url}
                  className="h-full w-full min-h-0 object-cover object-[center_20%] md:object-center"
                  muted
                  playsInline
                  loop
                  preload={index === 0 ? "auto" : "metadata"}
                  aria-label={slide.alt}
                />
              ) : (
                <img
                  src={wsrvLoader({ src: slide.url, width: 1920 })}
                  alt={slide.alt}
                  className="h-full w-full min-h-0 object-cover object-[center_20%] md:object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
            </div>
          );
        })}
      </div>

      {showOverlay && (
        <div className="absolute inset-0 z-[15] pointer-events-none flex flex-col justify-end">
          {/* Banda inferior con gradiente (altura fija para que el degradado sea visible) */}
          <div className="w-full min-h-[34%] max-md:min-h-0 max-md:max-h-[60%] sm:min-h-[38%] max-h-[52%] flex flex-col justify-end bg-gradient-to-t from-black/20 via-black/10 to-transparent pointer-events-auto">
            <div className="pl-3 pr-3 pt-2 pb-1 mb-1 sm:pl-14 sm:pr-10 sm:pb-5 sm:pt-10 sm:mb-7 md:pl-24 lg:pl-28 xl:pl-32 md:mb-8">
            <div
              key={slides[currentIndex]?.heroId ?? String(currentIndex)}
              className="animate-in fade-in duration-500 max-w-2xl lg:max-w-3xl text-left max-md:space-y-0.5"
            >
              {(overlay!.title || "").trim() ? (
                <h1 className="text-white text-[15px] leading-tight sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-0 sm:mb-2 md:mb-3 max-md:line-clamp-2">
                  {(overlay!.title || "").trim()}
                </h1>
              ) : null}
              {(overlay!.subtitle || "").trim() ? (
                <p className="text-white/90 text-[11px] sm:text-base md:text-lg lg:text-xl max-w-xl leading-tight sm:leading-relaxed mb-1 sm:mb-4 md:mb-6 line-clamp-1 sm:line-clamp-none">
                  {(overlay!.subtitle || "").trim()}
                </p>
              ) : null}
              {(overlay!.cta_text || "").trim() && (overlay!.cta_link || "").trim() ? (
                <a
                  href={(overlay!.cta_link || "").trim()}
                  className="inline-flex items-center justify-center rounded-full bg-[#00C1A7] hover:bg-[#00A892] text-white font-semibold text-[11px] sm:text-base px-3 py-1.5 sm:px-8 sm:py-3.5 transition-colors max-md:mt-0.5"
                >
                  {(overlay!.cta_text || "").trim()}
                </a>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all"
            aria-label="Diapositiva anterior"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all"
            aria-label="Diapositiva siguiente"
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-1 md:bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5 md:gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-6 md:w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir a diapositiva ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
