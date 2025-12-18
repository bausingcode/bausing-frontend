"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Edit, Trash2, CreditCard, X } from "lucide-react";

export default function Promos() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [promotions] = useState([
    {
      titulo: "Black Friday 2025",
      estado: "activa",
      tipo: "OFERTA",
      vigencia: "2025-11-20 - 2025-11-30",
      productos: "Fénix, Diamante",
      billetera: true,
      billeteraTexto: "Compatible con Pesos Bausing",
    },
    {
      titulo: "Combo Verano",
      estado: "programada",
      tipo: "2x1 en bases",
      vigencia: "2025-12-01 - 2025-12-31",
      productos: "Base Premium, Base Estándar",
      billetera: false,
      billeteraTexto: "No aplica con billetera",
    },
    {
      titulo: "Descuento Perla",
      estado: "activa",
      tipo: "OFERTA",
      vigencia: "2025-11-15 - 2025-12-15",
      productos: "Perla",
      billetera: true,
      billeteraTexto: "Acumula con Pesos Bausing",
    },
  ]);

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Promos" 
        description="Gestiona las promociones y ofertas" 
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Promociones Activas</h2>
      </div>

      <div className="space-y-4">
        {promotions.map((promo, index) => (
          <div key={index} className="bg-white rounded-[14px] border border-gray-200 p-6 relative">
            {/* Edit and Delete Icons */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
                <Edit className="w-5 h-5" />
              </button>
              <button className="text-red-600 hover:text-red-800 transition-colors cursor-pointer">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Title and Status */}
            <div className="mb-4 pr-20">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-gray-900">{promo.titulo}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  promo.estado === 'activa' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {promo.estado}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Tipo:</span> <span style={{ color: '#F59E0B' }} className="font-semibold">{promo.tipo}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Vigencia:</span> {promo.vigencia}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Productos:</span> {promo.productos}
              </div>
            </div>

            {/* Billetera Info */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <div className="relative">
                {promo.billetera ? (
                  <CreditCard className={`w-5 h-5 text-blue-600`} />
                ) : (
                  <div className="relative">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <X className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
                  </div>
                )}
              </div>
              <span className={`text-sm ${promo.billetera ? 'text-blue-600' : 'text-gray-500'}`}>
                {promo.billeteraTexto}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

