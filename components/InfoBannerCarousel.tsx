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
    <section className="hidden md:block bg-white py-4 md:py-6 lg:py-0">
      <div className="container mx-auto px-4">
        <div className="relative flex justify-center">
          <div className="relative rounded-[10px] md:rounded-xl overflow-hidden w-full max-w-[1650px]" style={{ aspectRatio: '1650/350', minHeight: '350px' }}>
            {/* Carousel Images */}
            {images.map((image, index) => {
              const optimizedUrl = wsrvLoader({ src: image.url, width: 1650 });
              const isActive = index === currentIndex;
              return (
                <div
                  key={`${image.id}-${index}`}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={optimizedUrl}
                    alt={image.alt}
                    className="w-full h-full object-cover rounded-[10px] md:rounded-xl"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              );
            })}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                </button>
                <button
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
