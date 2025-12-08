"use client";

import Image from "next/image";

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
  return (
    <div className="cursor-pointer" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="relative w-full h-80 rounded-[10px] overflow-hidden">
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover"
        />
        {discount && (
          <div className="absolute top-2 right-2 bg-[#00C1A7] text-white px-2 py-1 rounded-[4px] font-bold text-xs">
            {discount}
          </div>
        )}
      </div>
      <div className="pt-3">
        <div className="mb-3">
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
      </div>
    </div>
  );
}

