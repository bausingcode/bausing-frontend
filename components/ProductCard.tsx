"use client";

import wsrvLoader from "@/lib/wsrvLoader";

interface ProductCardProps {
  image: string;
  alt: string;
  name: string;
  currentPrice: string;
  originalPrice: string;
  discount?: string;
}

export default function ProductCard({
  image,
  alt,
  name,
  currentPrice,
  originalPrice,
  discount,
}: ProductCardProps) {
  // Generar URL optimizada con wsrv (usando ancho de 400px para productos)
  const optimizedUrl = wsrvLoader({ src: image, width: 400 });

  // Calcular precio en 12 cuotas
  const calculatePriceInInstallments = (priceStr: string, installments: number = 12): string => {
    // Extraer el número del precio (remover $ y puntos)
    const numericPrice = parseFloat(priceStr.replace(/[$.]/g, '').replace(/\./g, ''));
    if (isNaN(numericPrice)) return '';
    
    const pricePerInstallment = numericPrice / installments;
    // Formatear con puntos de miles
    const formatted = Math.round(pricePerInstallment).toLocaleString('es-AR');
    return `$${formatted}`;
  };

  const priceIn12Installments = calculatePriceInInstallments(currentPrice);

  return (
    <div className="cursor-pointer" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="relative w-full h-80 rounded-[10px] overflow-hidden">
        <img
          src={optimizedUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
        {discount && (
          <div className="absolute top-2 right-2 bg-[#00C1A7] text-white px-2 py-1 rounded-[4px] font-semibold text-xs">
            {discount}
          </div>
        )}
      </div>
      <div className="pt-3">
        <div className="mb-1">
          <h4 className="text-sm font-normal text-gray-900 leading-tight">
            {name}
          </h4>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold text-gray-900">{currentPrice}</span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">{originalPrice}</span>
          )}
        </div>
        {priceIn12Installments && (
          <div className="mt-1">
            <span className="text-sm text-gray-600">
              {priceIn12Installments} en 12 cuotas sin interés
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

