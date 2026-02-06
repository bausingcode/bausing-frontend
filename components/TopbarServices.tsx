"use client";

import { Truck, CreditCard, FactoryIcon } from "lucide-react";

/**
 * Barra superior de servicios (envíos, fábrica, abonar al recibir).
 * Se muestra debajo de la topbar principal y se oculta en móvil.
 */
export default function TopbarServices() {
  return (
    <div className="hidden md:block bg-[#00C1A7]/80 py-1">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6 text-sm text-white">
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
      </div>
    </div>
  );
}
