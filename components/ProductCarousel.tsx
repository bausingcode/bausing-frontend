"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ItemsPerViewConfig =
  | number
  | { base?: number; md?: number; lg?: number; xl?: number; xxl?: number };

interface ProductCarouselProps {
  children: ReactNode;
  alwaysShow?: boolean;
  itemsPerView?: ItemsPerViewConfig;
  scrollStep?: number;
}

function resolveItemsPerView(
  config: ItemsPerViewConfig | undefined,
  clientWidth: number
): number | undefined {
  if (config === undefined) return undefined;
  if (typeof config === "number") return config;
  const { base = 1, md, lg, xl, xxl } = config;
  if (xxl !== undefined && clientWidth >= 1536) return xxl;
  if (xl !== undefined && clientWidth >= 1280) return xl;
  if (lg !== undefined && clientWidth >= 1024) return lg;
  if (md !== undefined && clientWidth >= 768) return md;
  return base;
}

/**
 * Carrusel horizontal de productos para mobile.
 * Muestra productos en scroll horizontal con snap y flechas de navegación.
 * Los productos dentro deben tener ancho fijo para funcionar correctamente.
 */
export default function ProductCarousel({ children, alwaysShow = false, itemsPerView, scrollStep }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const applyItemWidths = () => {
    if (!itemsPerView || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const contentDiv = container.querySelector('div.flex') as HTMLElement;
    if (!contentDiv) return;

    const current = resolveItemsPerView(itemsPerView, container.clientWidth);
    if (!current || current < 1) return;

    const edgePadding = 16;
    const gap = 24;
    const availableWidth = container.clientWidth - 2 * edgePadding;
    const itemWidth = (availableWidth - (current - 1) * gap) / current;

    Array.from(contentDiv.children).forEach((child) => {
      const el = child as HTMLElement;
      el.style.width = `${itemWidth}px`;
      el.style.minWidth = `${itemWidth}px`;
      el.style.maxWidth = `${itemWidth}px`;
    });
  };

  useEffect(() => {
    setShowLeftArrow(false);
    setShowRightArrow(false);

    const container = scrollContainerRef.current;
    if (!container) return;

    const update = () => {
      applyItemWidths();
      checkScrollPosition();
    };

    let raf = requestAnimationFrame(update);
    container.addEventListener('scroll', checkScrollPosition);

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    // Re-aplicar cuando HomeProducts agrega hijos al flex div (carga async)
    const contentDiv = container.querySelector('div.flex');
    const mutationObserver = new MutationObserver(update);
    if (contentDiv) {
      mutationObserver.observe(contentDiv, { childList: true });
      resizeObserver.observe(contentDiv);
    }

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('scroll', checkScrollPosition);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children, itemsPerView]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const contentDiv = container.querySelector('div.flex') as HTMLElement;
    if (!contentDiv) return;

    const firstProduct = contentDiv.firstElementChild as HTMLElement;
    if (!firstProduct) return;

    const gap = 24;
    const productWidth = firstProduct.offsetWidth || firstProduct.clientWidth || 0;
    const resolved = resolveItemsPerView(itemsPerView, container.clientWidth);
    const steps = scrollStep ?? resolved ?? 1;
    const scrollAmount = (productWidth + gap) * steps;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`${alwaysShow ? "" : "min-[1291px]:hidden"} relative`}>
      {/* Flecha izquierda */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-[38%] -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Flecha derecha */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-[38%] -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
      >
        <div className="flex gap-6 [&>*]:min-w-0" style={{ width: "max-content", paddingLeft: itemsPerView ? '1rem' : '2rem', paddingRight: itemsPerView ? '1rem' : '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
