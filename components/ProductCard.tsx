"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import wsrvLoader from "@/lib/wsrvLoader";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id?: string;
  image: string;
  alt: string;
  name: string;
  currentPrice: string;
  originalPrice: string;
  discount?: string;
  isPriceLoading?: boolean;
}

export default function ProductCard({
  id,
  image,
  alt,
  name,
  currentPrice,
  originalPrice,
  discount,
  isPriceLoading = false,
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
    // Si no hay imagen o está vacía, usar placeholder
    if (!image || image.trim() === '' || image === '/images/placeholder.png') {
      return '/images/placeholder.png';
    }
    
    // Si la imagen ya es una URL de wsrv, no la optimizamos de nuevo
    if (image.includes('wsrv.nl')) {
      return image;
    }
    
    // Si la imagen es una URL válida (http/https), procesarla con wsrv
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      try {
        return wsrvLoader({ src: image, width: 400 });
      } catch (error) {
        console.error('[ProductCard] Error processing image:', image, error);
        return '/images/placeholder.png';
      }
    }
    
    // Si no es una URL válida, usar placeholder
    return '/images/placeholder.png';
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
      });
      setIsFavorite(true);
      setShowFavoriteAnimation(true);
      setTimeout(() => setShowFavoriteAnimation(false), 600);
    }
  };

  return (
    <Link href={`/productos/${productId}`} className="relative group block cursor-pointer" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="relative w-full h-80 rounded-[10px] overflow-hidden">
        <img
          src={optimizedUrl}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Si la imagen falla al cargar, usar placeholder
            const target = e.target as HTMLImageElement;
            if (target.src !== '/images/placeholder.png') {
              target.src = '/images/placeholder.png';
            }
          }}
          loading="lazy"
        />
        {discount && (
          <div className="absolute top-2 right-2 bg-[#00C1A7] text-white px-2 py-1 rounded-[4px] font-semibold text-xs z-10">
            {discount}
          </div>
        )}
        
        {/* Botones de acción */}
        <div 
          className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
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
      <div className="pt-3">
        <div className="mb-1">
          <h4 className="text-sm font-normal text-gray-900 leading-tight">
            {name}
          </h4>
        </div>
        <div className="flex items-baseline gap-2">
          {isPriceLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          ) : currentPrice ? (
            <>
              <span className="text-xl font-semibold text-gray-900">{currentPrice}</span>
              {originalPrice && (
                <span className="text-sm text-gray-400 line-through">{originalPrice}</span>
              )}
            </>
          ) : (
            <span className="text-xl font-semibold text-gray-500">Sin Precio</span>
          )}
        </div>
      </div>
    </Link>
  );
}

