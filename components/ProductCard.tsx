"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import wsrvLoader from "@/lib/wsrvLoader";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImagePlaceholder";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id?: string;
  image: string;
  alt: string;
  name: string;
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  /** Leyenda bajo el precio (ej. precio efectivo / transferencia) */
  priceNote?: string;
  isPriceLoading?: boolean;
  useNormalHeight?: boolean;
}

export default function ProductCard({
  id,
  image,
  alt,
  name,
  currentPrice,
  originalPrice,
  discount,
  priceNote,
  isPriceLoading = false,
  useNormalHeight = false,
}: ProductCardProps) {
  // Generar ID único si no se proporciona
  const productId = id || `product-${name.toLowerCase().replace(/\s+/g, "-")}`;
  
  const { addToCart, addToFavorites, removeFromFavorites, isInCart, isInFavorites } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [showCartAnimation, setShowCartAnimation] = useState(false);
  const [showFavoriteAnimation, setShowFavoriteAnimation] = useState(false);

  // Sincronizar estado local con el contexto
  useEffect(() => {
    setIsFavorite(isInFavorites(productId));
    setIsAddedToCart(isInCart(productId));
  }, [productId, isInFavorites, isInCart]);

  // Generar URL optimizada con wsrv (usando ancho de 400px para productos)
  // Validar que la imagen sea válida antes de procesarla
  const getOptimizedUrl = () => {
    const trimmed = (image || "").trim();
    if (!trimmed || trimmed === "/images/placeholder.png") {
      return PRODUCT_IMAGE_PLACEHOLDER;
    }
    if (trimmed === PRODUCT_IMAGE_PLACEHOLDER || trimmed.startsWith("data:")) {
      return trimmed;
    }
    if (trimmed.includes("wsrv.nl")) {
      return trimmed;
    }
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/")
    ) {
      try {
        return wsrvLoader({ src: trimmed, width: 400 });
      } catch (error) {
        console.error("[ProductCard] Error processing image:", image, error);
        return PRODUCT_IMAGE_PLACEHOLDER;
      }
    }
    return PRODUCT_IMAGE_PLACEHOLDER;
  };
  
  const optimizedUrl = getOptimizedUrl();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: productId,
      name,
      image: optimizedUrl,
      price: currentPrice,
    });
    setIsAddedToCart(true);
    setShowCartAnimation(true);
    setTimeout(() => setShowCartAnimation(false), 600);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      removeFromFavorites(productId);
      setIsFavorite(false);
    } else {
      // Guardar la URL original, no la optimizada, para mayor flexibilidad
      addToFavorites({
        id: productId,
        name,
        image: image,
        price: currentPrice,
        originalPrice:
          originalPrice &&
          originalPrice.trim() !== "" &&
          originalPrice !== currentPrice
            ? originalPrice
            : undefined,
        priceNote: priceNote?.trim() ? priceNote : undefined,
      });
      setIsFavorite(true);
      setShowFavoriteAnimation(true);
      setTimeout(() => setShowFavoriteAnimation(false), 600);
    }
  };

  return (
    <Link
      href={`/productos/${productId}`}
      className="relative group block w-full min-w-0 cursor-pointer"
      style={{ fontFamily: "DM Sans, sans-serif" }}
    >
      <div className={`relative w-full rounded-[10px] overflow-hidden ${useNormalHeight ? 'h-80' : 'h-48 md:h-80'}`}>
        <img
          src={optimizedUrl}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = PRODUCT_IMAGE_PLACEHOLDER;
          }}
          loading="lazy"
        />
        {discount && (
          <div className="absolute top-2 left-2 md:top-2 md:right-2 bg-[#00C1A7] text-white px-2 py-1 rounded-[4px] font-semibold text-xs z-10">
            {discount}
          </div>
        )}
        
        {/* Botones de acción - Solo visible en desktop */}
        <div 
          className="hidden md:flex absolute bottom-3 right-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Botón de favoritos */}
          <button
            onClick={handleToggleFavorite}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer relative z-30 ${
              isFavorite
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } ${showFavoriteAnimation ? "scale-125" : ""}`}
            aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          {/* Botón de carrito */}
          <button
            onClick={handleAddToCart}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer bg-white text-gray-700 hover:bg-gray-50 relative z-30 ${showCartAnimation ? "scale-125" : ""}`}
            aria-label="Agregar al carrito"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        className={`w-full min-w-0 overflow-hidden ${useNormalHeight ? "pt-3" : "pt-2 md:pt-3"}`}
      >
        <div className="mb-1 min-w-0 w-full">
          <h4
            title={name}
            className={`truncate min-w-0 max-w-full ${
              useNormalHeight
                ? "text-sm font-normal text-gray-900 leading-tight"
                : "text-xs md:text-sm font-normal text-gray-900 leading-tight"
            }`}
          >
            {name}
          </h4>
        </div>
        <div className="flex items-baseline gap-2">
          {isPriceLoading ? (
            <div className="animate-pulse">
              <div className={useNormalHeight ? "h-6 bg-gray-200 rounded w-24" : "h-5 md:h-6 bg-gray-200 rounded w-20 md:w-24"}></div>
            </div>
          ) : currentPrice ? (
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                {originalPrice && (
                  <span className={useNormalHeight ? "text-sm text-gray-400 line-through" : "text-xs md:text-sm text-gray-400 line-through"}>{originalPrice}</span>
                )}
                <span className={useNormalHeight ? "text-xl font-semibold text-gray-900" : "text-lg md:text-xl font-semibold text-gray-900"}>{currentPrice}</span>
              </div>
              {priceNote && (
                <span className={useNormalHeight ? "text-xs text-gray-600" : "text-[10px] md:text-xs text-gray-600"}>{priceNote}</span>
              )}
            </div>
          ) : (
            <span className={useNormalHeight ? "text-xl font-semibold text-gray-500" : "text-lg md:text-xl font-semibold text-gray-500"}>Sin Precio</span>
          )}
        </div>
      </div>
    </Link>
  );
}

