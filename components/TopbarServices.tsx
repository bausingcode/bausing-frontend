"use client";

import { Truck, CreditCard, FactoryIcon } from "lucide-react";

/**
 * Barra superior de servicios (envíos, fábrica, abonar al recibir).
 * Se muestra debajo de la topbar principal en desktop y mobile.
 */
export default function TopbarServices() {
  return (
    <div className="bg-[#00C1A7]/80 py-1.5 md:py-1">
      <div className="container mx-auto px-3 md:px-4">
        {/* Desktop ancho: misma fila con texto completo */}
        <div className="hidden min-[1291px]:flex items-center justify-center gap-6 text-sm text-white">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-white shrink-0" />
            <span className="font-normal">Envíos propios y gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <FactoryIcon className="w-4 h-4 text-white shrink-0" />
            <span className="font-normal">Directo de fábrica</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-white shrink-0" />
            <span className="font-normal">Abonas al recibir</span>
          </div>
        </div>
        {/* Mobile y tablet: scroll horizontal compacto */}
        <div className="flex min-[1291px]:hidden items-center justify-center gap-3 text-[10px] sm:text-xs text-white overflow-x-auto scrollbar-hide pb-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <Truck className="w-3 h-3 text-white shrink-0" />
            <span className="font-normal whitespace-nowrap">Envíos gratis</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <FactoryIcon className="w-3 h-3 text-white shrink-0" />
            <span className="font-normal whitespace-nowrap">Directo fábrica</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CreditCard className="w-3 h-3 text-white shrink-0" />
            <span className="font-normal whitespace-nowrap">Abonas al recibir</span>
          </div>
        </div>
      </div>
    </div>
  );
}
