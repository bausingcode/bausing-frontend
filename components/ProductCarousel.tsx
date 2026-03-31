"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
  children: ReactNode;
}

/**
 * Carrusel horizontal de productos para mobile.
 * Muestra productos en scroll horizontal con snap y flechas de navegación.
 * Los productos dentro deben tener ancho fijo para funcionar correctamente.
 */
export default function ProductCarousel({ children }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    
    // Re-check on resize
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const contentDiv = container.querySelector('div.flex') as HTMLElement;
    if (!contentDiv) return;
    
    // Buscar el primer producto hijo directo del div flex
    const firstProduct = contentDiv.firstElementChild as HTMLElement;
    if (!firstProduct) {
      // Si no hay primer hijo directo, intentar buscar en los hijos
      const children = Array.from(contentDiv.children) as HTMLElement[];
      if (children.length === 0) return;
      const product = children[0];
      const productWidth = product.offsetWidth || product.clientWidth || 0;
      const gap = 12;
      const scrollAmount = productWidth + gap;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      return;
    }
    
    const productWidth = firstProduct.offsetWidth || firstProduct.clientWidth || 0;
    const gap = 24; // gap-6 = 1.5rem = 24px
    const scrollAmount = productWidth + gap;
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-[1291px]:hidden relative">
      {/* Flecha izquierda */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-[38%] -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}
      
      {/* Flecha derecha */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-[38%] -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      )}

      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ paddingLeft: '2rem', paddingRight: '1rem' }}
      >
        <div className="flex gap-6 [&>*]:min-w-0" style={{ width: "max-content" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
