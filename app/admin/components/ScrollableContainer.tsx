"use client";

import { useEffect, useRef, useState } from "react";

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
        className="h-full overflow-y-auto"
      >
        {children}
      </div>
      
      {/* Sombra inferior */}
      {showBottomShadow && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}

