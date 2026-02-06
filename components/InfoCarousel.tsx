"use client";

import { useEffect, useRef } from "react";
import { Truck, CreditCard, Award, Factory } from "lucide-react";

interface InfoItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const infoItems: InfoItem[] = [
  {
    icon: <Truck className="w-7 h-7 text-[#00C1A7]" strokeWidth={1.5} />,
    title: "Envío gratis",
    description: "Consultar localidades"
  },
  {
    icon: <CreditCard className="w-7 h-7 text-[#00C1A7]" strokeWidth={1.5} />,
    title: "La mejor financiación",
    description: "La mejor opción para tu compra"
  },
  {
    icon: <Award className="w-7 h-7 text-[#00C1A7]" strokeWidth={1.5} />,
    title: "5 años de garantía",
    description: "En todos nuestros colchones"
  },
  {
    icon: <Factory className="w-7 h-7 text-[#00C1A7]" strokeWidth={1.5} />,
    title: "Distribuidor oficial",
    description: "Calidad garantizada"
  }
];

export default function InfoCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const scrollContent = scrollContentRef.current;
    
    if (!scrollContainer || !scrollContent) return;

    const moveToNext = () => {
      if (!scrollContainer || !scrollContent) return;

      // Obtener el primer item para calcular su ancho
      const firstItem = scrollContent.firstElementChild as HTMLElement;
      if (!firstItem) {
        timeoutRef.current = setTimeout(() => {
          moveToNext();
        }, 100);
        return;
      }

      const itemWidth = firstItem.offsetWidth;
      const gap = 8; // gap-2 = 0.5rem = 8px
      
      currentIndexRef.current += 1;
      
      // Si llegamos al final del primer set, volver al inicio
      if (currentIndexRef.current >= infoItems.length) {
        currentIndexRef.current = 0;
        // Saltar al inicio del primer set sin animación
        scrollContainer.scrollLeft = 0;
        // Pequeño delay antes de continuar
        timeoutRef.current = setTimeout(() => {
          moveToNext();
        }, 2000);
        return;
      }

      const targetScroll = currentIndexRef.current * (itemWidth + gap);
      
      scrollContainer.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });

      // Esperar 2 segundos antes de mover al siguiente
      timeoutRef.current = setTimeout(() => {
        moveToNext();
      }, 2000);
    };

    // Iniciar después de un pequeño delay
    const initTimeout = setTimeout(() => {
      moveToNext();
    }, 2000);

    return () => {
      clearTimeout(initTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={scrollContainerRef}
      className="overflow-x-auto pb-4 scrollbar-hide w-full md:hidden snap-x snap-mandatory"
    >
      <div 
        ref={scrollContentRef}
        className="flex gap-2"
        style={{ width: 'max-content' }}
      >
        {/* Render items twice for seamless loop */}
        {[...infoItems, ...infoItems].map((item, index) => (
          <div
            key={`${index}`}
            className="flex flex-col items-center text-center p-4 min-w-[calc(100vw-2rem)] flex-shrink-0 snap-start"
          >
            <div className="w-14 h-14 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 aspect-square">
              {item.icon}
            </div>
            <p className="text-[#101828] mb-1 text-sm font-medium">{item.title}</p>
            <p className="text-xs text-[#4A5565]">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
