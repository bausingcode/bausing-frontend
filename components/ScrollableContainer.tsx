"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ScrollableContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Mostrar sombra superior si hay scroll hacia abajo
      setShowTopShadow(scrollTop > 0);
      
      // Mostrar sombra inferior si hay más contenido abajo
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
    };

    // Verificar al cargar
    checkScroll();

    // Verificar al hacer scroll
    container.addEventListener("scroll", checkScroll);
    
    // Verificar cuando cambia el tamaño del contenido
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative h-full">
      {/* Sombra superior */}
      {showTopShadow && (
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
      )}
      
      {/* Contenedor con scroll */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide"
      >
        {children}
      </div>
      
      {/* Sombra inferior */}
      {showBottomShadow && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
      )}
      
      {/* Flecha indicadora de scroll */}
      {showBottomShadow && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
          <div className="bg-white rounded-full p-2 shadow-lg border border-gray-200 animate-bounce">
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}

