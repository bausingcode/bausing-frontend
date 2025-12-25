"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

interface Review {
  id: number;
  name: string;
  text: string;
  rating: number;
  link: string;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const baseReviews: Review[] = [
  {
    id: 1,
    name: "Hannss Angulo",
    text: "Vi el catálogo por internet , me asesoraron mediante WhatsApp lo cual lo hicieron muy bien y al día siguiente me trajeron el colchón...",
    rating: 5,
    link: "https://share.google/JGDJHozKLGNTD9dro"
  },
  {
    id: 2,
    name: "Patricia Diaz",
    text: "Excelente la atención el personal, súper expeditivo, amable y dispuesto a resolver cualquier situación. Muy buena mercadería, sin dudas recomendables.",
    rating: 5,
    link: "https://share.google/TlUOz7UAY8mpNRiTZ"
  },
  {
    id: 3,
    name: "Jazmin Roy",
    text: "Hoy compre un respaldar de falso capitone de pana negra. Es todo lo que está bien 😍 el precio excelente!",
    rating: 5,
    link: "https://share.google/4Qho3RFqJYCxDqL2N"
  },
  {
    id: 4,
    name: "Maria Cristina Bazan",
    text: "Llegaron al tiempo prometido, la calidad es muy buena y los precios inmejorable. Altamente recomendados",
    rating: 5,
    link: "https://share.google/6hMvqUqIWr6p2SY2U"
  },
  {
    id: 5,
    name: "Alexia Brajin",
    text: "Muy  lindooo y exelente calidad y trato muy confiableee",
    rating: 5,
    link: "https://share.google/BwB9nXVRcKlIgn0cH"
  }
];

// Generate up to 20 reviews by duplicating base reviews
const generateReviews = (): Review[] => {
  const reviews: Review[] = [];
  for (let i = 0; i < 20; i++) {
    const baseReview = baseReviews[i % baseReviews.length];
    reviews.push({
      ...baseReview,
      id: i + 1
    });
  }
  return reviews;
};

const reviews = generateReviews();

export default function ReviewsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const scrollContent = scrollContentRef.current;
    
    if (!scrollContainer || !scrollContent) return;

    let animationId: number | null = null;

    const initAnimation = () => {
      // Calculate the width of one set of reviews
      const totalWidth = scrollContent.scrollWidth;
      const singleSetWidth = totalWidth / 2;
      
      if (singleSetWidth === 0) {
        // Retry if width is not ready
        setTimeout(initAnimation, 100);
        return;
      }

      let scrollPosition = singleSetWidth; // Start from the right (end of first set)
      const scrollSpeed = 0.5; // pixels per frame

      // Set initial position to the right
      scrollContainer.scrollLeft = singleSetWidth;

      const animate = () => {
        scrollPosition += scrollSpeed; // Move from right to left
        
        // When we reach the end, seamlessly jump back to the start of first set
        if (scrollPosition >= totalWidth) {
          scrollPosition = scrollPosition - singleSetWidth;
        }
        
        scrollContainer.scrollLeft = scrollPosition;
        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);
    };

    // Start animation after a short delay to ensure layout is ready
    const timeoutId = setTimeout(initAnimation, 200);

    return () => {
      clearTimeout(timeoutId);
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <section className="py-16 bg-[#FAFAFA]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="container mx-auto px-4">
        {/* Titles */}
        <div className="text-center mb-12">
          <h2 className="text-3xl text-gray-900 mb-2">
            La colchoneria mejor puntuada de Córdoba
          </h2>
          
          {/* Google Logo and Rating */}
          <div className="flex items-center justify-center gap-3 mb-4 mt-4">
            <img 
              src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
              alt="Google" 
              className="h-6"
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    strokeWidth={0}
                  />
                ))}
              </div>
              <span className="text-gray-600 text-sm">
                +1.000 reseñas en Google
              </span>
            </div>
          </div>
          
          {/* Link to all reviews */}
          <a 
            href="https://maps.app.goo.gl/R5TPRodvyBBw1qZh6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#00C1A7] hover:text-[#00A892] font-medium text-sm underline inline-block"
          >
            Ver todas las reseñas
          </a>
        </div>
      </div>

      {/* Reviews Carousel - Full width, starts from right */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto pb-4 scrollbar-hide w-full"
      >
        <div 
          ref={scrollContentRef}
          className="flex gap-6"
          style={{ width: 'max-content' }}
        >
            {/* Render reviews twice for seamless loop */}
            {[...reviews, ...reviews].map((review, index) => (
              <a
                key={`${review.id}-${index}`}
                href={review.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg border border-[#DEDEDE] p-6 min-w-[400px] max-w-[400px] flex flex-col flex-shrink-0 cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      strokeWidth={0}
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-gray-900 mb-6 flex-1 text-sm leading-relaxed">
                  {review.text}
                </p>

                {/* Customer Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#00C1A7] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(review.name)}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium text-sm">
                    {review.name}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
    </section>
  );
}

