"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import wsrvLoader from "@/lib/wsrvLoader";
import { isHeroVideoUrl } from "@/lib/heroMedia";

/** Ancho máx. pedido al CDN para el hero móvil (fit=inside, sin upscale); el layout respeta el ratio del archivo. */
export const MOBILE_HERO_EXPORT_WIDTH = 1280;

export interface HeroBannerSlide {
  id: number;
  heroId: string;
  url: string;
  /** Imagen exclusiva móvil (solo se usa en el hero móvil, no en desktop). */
  urlMobile?: string | null;
  alt: string;
  title?: string | null;
  subtitle?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
}

interface BannerCarouselProps {
  slides: HeroBannerSlide[];
  autoPlayInterval?: number;
  videoSlideInterval?: number;
}

function slideHasOverlay(s: HeroBannerSlide) {
  const t = (s.title || "").trim();
  const st = (s.subtitle || "").trim();
  const cta = (s.cta_text || "").trim() && (s.cta_link || "").trim();
  return Boolean(t || st || cta);
}

function overlayForIndex(slides: HeroBannerSlide[], index: number): HeroBannerSlide | null {
  const cur = slides[index];
  if (cur && slideHasOverlay(cur)) return cur;
  return null;
}

function MobileHeroChrome() {
  return (
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
  );
}

export default function BannerCarousel({
  slides,
  autoPlayInterval = 5000,
  videoSlideInterval = 15000,
}: BannerCarouselProps) {
  const mobileSlides = useMemo(
    () =>
      slides.filter(
        (s) => Boolean(s.urlMobile?.trim()) && !isHeroVideoUrl(s.url)
      ),
    [slides]
  );
  const hasMobileExclusiveHero = mobileSlides.length > 0;

  const [desktopIndex, setDesktopIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [fallbackMobileIndex, setFallbackMobileIndex] = useState(0);
  /** Dimensiones intrínsecas por slide (tras cargar la imagen) para fijar el alto del hero sin recortar. */
  const [mobileImgDimsByHeroId, setMobileImgDimsByHeroId] = useState<
    Record<string, { w: number; h: number }>
  >({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const fallbackVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    setDesktopIndex((i) => Math.min(i, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    setMobileIndex((i) => Math.min(i, Math.max(0, mobileSlides.length - 1)));
  }, [mobileSlides.length]);

  useEffect(() => {
    setFallbackMobileIndex((i) => Math.min(i, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  const desktopOverlay = useMemo(
    () => overlayForIndex(slides, desktopIndex),
    [slides, desktopIndex]
  );

  const mobileExclusiveOverlay = useMemo(
    () => overlayForIndex(mobileSlides, mobileIndex),
    [mobileSlides, mobileIndex]
  );

  const fallbackSlide = slides[fallbackMobileIndex];

  const fallbackOverlay = useMemo(
    () => overlayForIndex(slides, fallbackMobileIndex),
    [slides, fallbackMobileIndex]
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const slide = slides[desktopIndex];
    const ms = isHeroVideoUrl(slide.url) ? videoSlideInterval : autoPlayInterval;
    const t = window.setTimeout(() => {
      setDesktopIndex((i) => (i + 1) % slides.length);
    }, ms);
    return () => clearTimeout(t);
  }, [
    desktopIndex,
    slides,
    slides.length,
    autoPlayInterval,
    videoSlideInterval,
  ]);

  useEffect(() => {
    if (!hasMobileExclusiveHero || mobileSlides.length <= 1) return;
    const t = window.setTimeout(() => {
      setMobileIndex((i) => (i + 1) % mobileSlides.length);
    }, autoPlayInterval);
    return () => clearTimeout(t);
  }, [mobileIndex, mobileSlides.length, hasMobileExclusiveHero, autoPlayInterval]);

  useEffect(() => {
    if (hasMobileExclusiveHero || slides.length <= 1) return;
    const slide = slides[fallbackMobileIndex];
    const ms = isHeroVideoUrl(slide.url) ? videoSlideInterval : autoPlayInterval;
    const t = window.setTimeout(() => {
      setFallbackMobileIndex((i) => (i + 1) % slides.length);
    }, ms);
    return () => clearTimeout(t);
  }, [
    fallbackMobileIndex,
    hasMobileExclusiveHero,
    slides,
    slides.length,
    autoPlayInterval,
    videoSlideInterval,
  ]);

  useEffect(() => {
    slides.forEach((slide, i) => {
      const el = videoRefs.current[i];
      if (!el || !isHeroVideoUrl(slide.url)) return;
      if (i === desktopIndex) {
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
  }, [desktopIndex, slides]);

  useEffect(() => {
    if (hasMobileExclusiveHero) return;
    slides.forEach((slide, i) => {
      const el = fallbackVideoRefs.current[i];
      if (!el || !isHeroVideoUrl(slide.url)) return;
      if (i === fallbackMobileIndex) {
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
  }, [fallbackMobileIndex, hasMobileExclusiveHero, slides]);

  if (slides.length === 0) return null;

  const showDesktopOverlay =
    desktopOverlay &&
    ((desktopOverlay.title || "").trim() ||
      (desktopOverlay.subtitle || "").trim() ||
      ((desktopOverlay.cta_text || "").trim() && (desktopOverlay.cta_link || "").trim()));

  const showMobileExclusiveOverlay =
    mobileExclusiveOverlay &&
    ((mobileExclusiveOverlay.title || "").trim() ||
      (mobileExclusiveOverlay.subtitle || "").trim() ||
      ((mobileExclusiveOverlay.cta_text || "").trim() &&
        (mobileExclusiveOverlay.cta_link || "").trim()));

  const showFallbackOverlay =
    fallbackOverlay &&
    ((fallbackOverlay.title || "").trim() ||
      (fallbackOverlay.subtitle || "").trim() ||
      ((fallbackOverlay.cta_text || "").trim() && (fallbackOverlay.cta_link || "").trim()));

  const activeMobileHeroId = mobileSlides[mobileIndex]?.heroId;
  const activeMobileDims = activeMobileHeroId
    ? mobileImgDimsByHeroId[activeMobileHeroId]
    : undefined;

  return (
    <>
      {/* ——— Móvil: hero exclusivo, ancho pantalla, ratio del archivo (sin recorte) ——— */}
      {hasMobileExclusiveHero ? (
        <section
          className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#0f0f0f] md:hidden"
          style={
            activeMobileDims
              ? { aspectRatio: `${activeMobileDims.w} / ${activeMobileDims.h}` }
              : {
                  height: "min(calc(100vw * 16 / 9), min(52svh, 360px))",
                }
          }
        >
          <MobileHeroChrome />
          <div className="absolute inset-0 z-[1] min-h-0 min-w-0">
            {mobileSlides.map((slide, index) => {
              const src = slide.urlMobile!.trim();
              return (
                <div
                  key={`m-${slide.heroId}-${index}`}
                  className={`absolute inset-0 min-h-0 min-w-0 bg-[#0a0a0a] transition-opacity duration-1000 ${
                    index === mobileIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={wsrvLoader({ src, width: MOBILE_HERO_EXPORT_WIDTH })}
                    alt={slide.alt}
                    className="h-full w-full min-h-0 object-contain object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                    onLoad={(e) => {
                      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                      if (!w || !h) return;
                      setMobileImgDimsByHeroId((prev) =>
                        prev[slide.heroId]?.w === w && prev[slide.heroId]?.h === h
                          ? prev
                          : { ...prev, [slide.heroId]: { w, h } }
                      );
                    }}
                  />
                </div>
              );
            })}
          </div>

          {showMobileExclusiveOverlay && (
            <div className="absolute inset-0 z-[15] pointer-events-none flex flex-col justify-end">
              <div className="w-full min-h-[34%] max-md:min-h-0 max-md:max-h-[60%] flex flex-col justify-end bg-gradient-to-t from-black/25 via-black/10 to-transparent pointer-events-auto">
                <div className="pl-3 pr-3 pt-2 pb-1 mb-1">
                  <div
                    key={mobileSlides[mobileIndex]?.heroId ?? String(mobileIndex)}
                    className="animate-in fade-in duration-500 max-w-2xl text-left max-md:space-y-0.5"
                  >
                    {(mobileExclusiveOverlay!.title || "").trim() ? (
                      <h1 className="text-white text-[15px] leading-tight font-bold tracking-tight mb-0 max-md:line-clamp-2">
                        {(mobileExclusiveOverlay!.title || "").trim()}
                      </h1>
                    ) : null}
                    {(mobileExclusiveOverlay!.subtitle || "").trim() ? (
                      <p className="text-white/90 text-[11px] max-w-xl leading-tight mb-1 line-clamp-2">
                        {(mobileExclusiveOverlay!.subtitle || "").trim()}
                      </p>
                    ) : null}
                    {(mobileExclusiveOverlay!.cta_text || "").trim() &&
                    (mobileExclusiveOverlay!.cta_link || "").trim() ? (
                      <a
                        href={(mobileExclusiveOverlay!.cta_link || "").trim()}
                        className="inline-flex items-center justify-center rounded-full bg-[#00C1A7] hover:bg-[#00A892] text-white font-semibold text-[11px] px-3 py-1.5 transition-colors max-md:mt-0.5"
                      >
                        {(mobileExclusiveOverlay!.cta_text || "").trim()}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mobileSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setMobileIndex((i) =>
                    i === 0 ? mobileSlides.length - 1 : i - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all"
                aria-label="Diapositiva anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setMobileIndex((i) => (i + 1) % mobileSlides.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all"
                aria-label="Diapositiva siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {mobileSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setMobileIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === mobileIndex
                        ? "bg-white w-6"
                        : "bg-white/50 hover:bg-white/75 w-1.5"
                    }`}
                    aria-label={`Ir a diapositiva ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] max-md:h-[clamp(140px,24svh,260px)] md:hidden">
          <MobileHeroChrome />
          <div className="absolute inset-0 min-w-0 z-[1]">
            {slides.map((slide, index) => {
              const video = isHeroVideoUrl(slide.url);
              return (
                <div
                  key={`fb-${slide.id}-${index}`}
                  className={`absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] transition-opacity duration-1000 ${
                    index === fallbackMobileIndex
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  {video ? (
                    <video
                      ref={(el) => {
                        fallbackVideoRefs.current[index] = el;
                      }}
                      src={slide.url}
                      className="h-full w-full min-h-0 object-cover object-[center_20%]"
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
                      className="h-full w-full min-h-0 object-cover object-[center_20%]"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {showFallbackOverlay && (
            <div className="absolute inset-0 z-[15] pointer-events-none flex flex-col justify-end">
              <div className="w-full min-h-[34%] max-md:min-h-0 max-md:max-h-[60%] flex flex-col justify-end bg-gradient-to-t from-black/20 via-black/10 to-transparent pointer-events-auto">
                <div className="pl-3 pr-3 pt-2 pb-1 mb-1">
                  <div
                    key={fallbackSlide?.heroId ?? String(fallbackMobileIndex)}
                    className="animate-in fade-in duration-500 max-w-2xl text-left max-md:space-y-0.5"
                  >
                    {(fallbackOverlay!.title || "").trim() ? (
                      <h1 className="text-white text-[15px] leading-tight font-bold tracking-tight mb-0 max-md:line-clamp-2">
                        {(fallbackOverlay!.title || "").trim()}
                      </h1>
                    ) : null}
                    {(fallbackOverlay!.subtitle || "").trim() ? (
                      <p className="text-white/90 text-[11px] max-w-xl leading-tight mb-1 line-clamp-1">
                        {(fallbackOverlay!.subtitle || "").trim()}
                      </p>
                    ) : null}
                    {(fallbackOverlay!.cta_text || "").trim() &&
                    (fallbackOverlay!.cta_link || "").trim() ? (
                      <a
                        href={(fallbackOverlay!.cta_link || "").trim()}
                        className="inline-flex items-center justify-center rounded-full bg-[#00C1A7] hover:bg-[#00A892] text-white font-semibold text-[11px] px-3 py-1.5 transition-colors max-md:mt-0.5"
                      >
                        {(fallbackOverlay!.cta_text || "").trim()}
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
                type="button"
                onClick={() =>
                  setFallbackMobileIndex((i) =>
                    i === 0 ? slides.length - 1 : i - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all"
                aria-label="Diapositiva anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setFallbackMobileIndex((i) => (i + 1) % slides.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all"
                aria-label="Diapositiva siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFallbackMobileIndex(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === fallbackMobileIndex
                        ? "bg-white w-6"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Ir a diapositiva ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ——— Desktop (y tablet md+): hero ancho, mismos slides que siempre ——— */}
      <section className="relative hidden md:block w-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] aspect-[1440/450] h-auto">
        <MobileHeroChrome />
        <div className="absolute inset-0 min-w-0 z-[1]">
          {slides.map((slide, index) => {
            const video = isHeroVideoUrl(slide.url);
            return (
              <div
                key={`d-${slide.id}-${index}`}
                className={`absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f] transition-opacity duration-1000 ${
                  index === desktopIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                {video ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    src={slide.url}
                    className="h-full w-full min-h-0 object-cover object-center"
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
                    className="h-full w-full min-h-0 object-cover object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                )}
              </div>
            );
          })}
        </div>

        {showDesktopOverlay && (
          <div className="absolute inset-0 z-[15] pointer-events-none flex flex-col justify-end">
            <div className="w-full min-h-[34%] sm:min-h-[38%] max-h-[52%] flex flex-col justify-end bg-gradient-to-t from-black/20 via-black/10 to-transparent pointer-events-auto">
              <div className="pl-3 pr-3 pt-2 pb-1 mb-1 sm:pl-14 sm:pr-10 sm:pb-5 sm:pt-10 sm:mb-7 md:pl-24 lg:pl-28 xl:pl-32 md:mb-8">
                <div
                  key={slides[desktopIndex]?.heroId ?? String(desktopIndex)}
                  className="animate-in fade-in duration-500 max-w-2xl lg:max-w-3xl text-left sm:space-y-0"
                >
                  {(desktopOverlay!.title || "").trim() ? (
                    <h1 className="text-white text-[15px] leading-tight sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-0 sm:mb-2 md:mb-3 sm:line-clamp-none">
                      {(desktopOverlay!.title || "").trim()}
                    </h1>
                  ) : null}
                  {(desktopOverlay!.subtitle || "").trim() ? (
                    <p className="text-white/90 text-[11px] sm:text-base md:text-lg lg:text-xl max-w-xl leading-tight sm:leading-relaxed mb-1 sm:mb-4 md:mb-6 line-clamp-1 sm:line-clamp-none">
                      {(desktopOverlay!.subtitle || "").trim()}
                    </p>
                  ) : null}
                  {(desktopOverlay!.cta_text || "").trim() &&
                  (desktopOverlay!.cta_link || "").trim() ? (
                    <a
                      href={(desktopOverlay!.cta_link || "").trim()}
                      className="inline-flex items-center justify-center rounded-full bg-[#00C1A7] hover:bg-[#00A892] text-white font-semibold text-[11px] sm:text-base px-3 py-1.5 sm:px-8 sm:py-3.5 transition-colors sm:mt-0"
                    >
                      {(desktopOverlay!.cta_text || "").trim()}
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
              type="button"
              onClick={() =>
                setDesktopIndex((i) => (i === 0 ? slides.length - 1 : i - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
              aria-label="Diapositiva anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() =>
                setDesktopIndex((i) => (i + 1) % slides.length)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
              aria-label="Diapositiva siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setDesktopIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === desktopIndex
                      ? "bg-white w-8"
                      : "bg-white/50 hover:bg-white/75 w-2"
                  }`}
                  aria-label={`Ir a diapositiva ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
