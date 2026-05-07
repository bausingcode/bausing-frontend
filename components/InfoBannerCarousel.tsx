"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import wsrvLoader from "@/lib/wsrvLoader";

interface BannerImage {
  id: number;
  url: string;
  alt: string;
}

interface InfoBannerCarouselProps {
  images: BannerImage[];
  autoPlayInterval?: number;
}

export default function InfoBannerCarousel({ 
  images, 
  autoPlayInterval = 5000 
}: InfoBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(0, images.length - 1)));
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [images, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <section className="bg-white py-4 md:py-6 lg:py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative flex justify-center">
          <div
            className="relative rounded-[10px] md:rounded-xl overflow-hidden w-full max-w-[1290px] min-[1920px]:max-w-none max-lg:bg-neutral-100 lg:aspect-[1290/350]"
          >
            {/* Carousel Images — móvil: slide activa en flujo (img h-auto) para que el alto = al de la foto; desktop: capas absolutas + cover */}
            {images.map((image, index) => {
              const optimizedUrl = wsrvLoader({ src: image.url, width: 1290 });
              const isActive = index === currentIndex;
              return (
                <div
                  key={`${image.id}-${index}`}
                  className={[
                    "w-full transition-opacity duration-1000 ease-in-out",
                    /* Desktop: siempre apiladas */
                    "lg:absolute lg:inset-0 lg:h-full",
                    isActive
                      ? "lg:z-10 lg:opacity-100"
                      : "lg:z-0 lg:opacity-0 lg:pointer-events-none",
                    /* Mobile: la activa define el alto del bloque; el resto ocupa el mismo rectángulo para el crossfade */
                    isActive
                      ? "max-lg:relative max-lg:z-[1] max-lg:opacity-100"
                      : "max-lg:absolute max-lg:inset-0 max-lg:z-0 max-lg:opacity-0 max-lg:pointer-events-none",
                  ].join(" ")}
                >
                  <img
                    src={optimizedUrl}
                    alt={image.alt}
                    className={[
                      "w-full rounded-[10px] md:rounded-xl",
                      isActive
                        ? "max-lg:h-auto max-lg:block max-lg:object-contain"
                        : "max-lg:absolute max-lg:inset-0 max-lg:h-full max-lg:object-contain",
                      "lg:h-full lg:object-cover",
                    ].join(" ")}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              );
            })}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5 md:gap-2">
                {images.map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-white w-6 md:w-8'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
