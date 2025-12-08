"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

interface Review {
  id: number;
  name: string;
  text: string;
  rating: number;
  avatar: string;
}

const baseReviews: Review[] = [
  {
    id: 1,
    name: "María González",
    text: "La relación precio-calidad es increíble. El sommier llegó en perfectas condiciones y el armado fue muy sencillo. Totalmente recomendable.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "María González",
    text: "La relación precio-calidad es increíble. El sommier llegó en perfectas condiciones y el armado fue muy sencillo. Totalmente recomendable.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "María González",
    text: "La relación precio-calidad es increíble. El sommier llegó en perfectas condiciones y el armado fue muy sencillo. Totalmente recomendable.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 4,
    name: "María González",
    text: "La relación precio-calidad es increíble. El sommier llegó en perfectas condiciones y el armado fue muy sencillo. Totalmente recomendable.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 5,
    name: "María González",
    text: "La relación precio-calidad es increíble. El sommier llegó en perfectas condiciones y el armado fue muy sencillo. Totalmente recomendable.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
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
            ¡Gracias por confiar en nosotros!
          </h2>
          <p className="text-lg text-gray-700">
            Opiniones de nuestros clientes.
          </p>
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
              <div
                key={`${review.id}-${index}`}
                className="bg-white rounded-lg border border-[#DEDEDE] p-6 min-w-[400px] max-w-[400px] flex flex-col flex-shrink-0"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
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
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={review.avatar}
                      alt={review.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-gray-900 font-medium text-sm">
                    {review.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
    </section>
  );
}

