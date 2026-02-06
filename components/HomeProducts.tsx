"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import { useLocality } from "@/contexts/LocalityContext";
import { useHomepageDistribution } from "@/contexts/HomepageDistributionContext";
import { fetchProducts, Product } from "@/lib/api";
import { calculateProductPrice } from "@/utils/priceUtils";

// Helper function to repeat products if not enough
function repeatProducts<T>(products: T[], count: number): T[] {
  if (products.length === 0) return [];
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(products[i % products.length]);
  }
  return result;
}

// Helper function to convert Product to ProductCard props
function productToCardProps(product: Product, isPriceLoading: boolean = false) {
  // Obtener imagen con validación
  let image = "/images/placeholder.png";
  
  if (product.main_image && product.main_image.trim() !== '') {
    image = product.main_image;
  } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    // Buscar la primera imagen válida
    const validImage = product.images.find(
      (img: any) => img?.image_url && img.image_url.trim() !== ''
    );
    if (validImage?.image_url) {
      image = validImage.image_url;
    }
  }
  
  // Si el precio está cargando, usar skeleton
  // Si no hay precio después de cargar, mostrar "Sin Precio"
  // Si hay precio, calcular con promociones
  const hasPrice = product.min_price !== null && product.min_price !== undefined && product.min_price > 0;
  
  let priceInfo;
  if (isPriceLoading) {
    // Mientras carga, usar skeleton
    priceInfo = {
      currentPrice: "",
      originalPrice: undefined,
      discount: undefined,
    };
  } else if (!hasPrice) {
    // Si no hay precio después de cargar, mostrar "Sin Precio"
    priceInfo = {
      currentPrice: "",
      originalPrice: undefined,
      discount: undefined,
    };
  } else {
    // Calcular precio usando función centralizada (esto incluye promociones)
    // Asegurarse de que las promociones estén disponibles
    const productWithPromos = {
      ...product,
      promos: product.promos && Array.isArray(product.promos) ? product.promos : []
    };
    
    priceInfo = calculateProductPrice(productWithPromos, 1);
    
    // Debug: verificar si hay promociones
    if (product.promos && product.promos.length > 0) {
      console.log(`[HomeProducts] Producto ${product.id} tiene ${product.promos.length} promociones:`, product.promos);
      console.log(`[HomeProducts] Precio calculado con descuento:`, priceInfo);
    }
  }
  
  return {
    id: product.id,
    image,
    alt: product.name,
    name: product.name,
    currentPrice: priceInfo.currentPrice || "",
    originalPrice: priceInfo.originalPrice || "",
    discount: priceInfo.discount,
    // Solo mostrar skeleton si está cargando, no si no hay precio
    isPriceLoading: isPriceLoading,
  };
}

interface HomeProductsProps {
  section: "featured" | "discounts" | "mattresses" | "complete_purchase";
  count: number;
}

export default function HomeProducts({ section, count }: HomeProductsProps) {
  const { locality } = useLocality();
  const { distribution, isLoadingPrices, isLoading: distributionLoading } = useHomepageDistribution();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener productos de la sección desde la distribución compartida
  const sectionProducts = useMemo(() => {
    if (!distribution) return [];
    
    switch (section) {
      case "featured":
        return distribution.featured || [];
      case "discounts":
        return distribution.discounts || [];
      case "mattresses":
        return distribution.mattresses || [];
      case "complete_purchase":
        return distribution.complete_purchase || [];
      default:
        return [];
    }
  }, [distribution, section]);

  useEffect(() => {
    // Si hay productos en la distribución, usarlos inmediatamente
    if (sectionProducts.length > 0) {
      // Debug: verificar promociones en productos
      sectionProducts.forEach(p => {
        if (p.promos && p.promos.length > 0) {
          console.log(`[HomeProducts] Producto ${p.id} en sección ${section} tiene promociones:`, p.promos);
        }
      });
      
      // Recalcular props de cards cada vez que cambian los productos o el estado de carga
      // Esto asegura que cuando los precios se cargan, se recalculen con promociones
      const cardProps = repeatProducts(
        sectionProducts.map(p => {
          // Pasar isLoadingPrices para saber si mostrar skeleton
          const card = productToCardProps(p, isLoadingPrices);
          
          // Debug: verificar descuentos calculados
          if (card.discount) {
            console.log(`[HomeProducts] Card ${card.id} tiene descuento:`, card.discount);
          }
          
          return card;
        }),
        count
      ).slice(0, count);
      
      setProducts(cardProps);
      setLoading(false);
      return;
    }
    
    // Si la distribución terminó de cargar y no hay productos, no mostrar nada
    if (!distributionLoading && sectionProducts.length === 0) {
      setProducts([]);
      setLoading(false);
    }
  }, [section, count, sectionProducts, distributionLoading, isLoadingPrices]);

  if (loading) {
    // Skeleton mientras carga
    // Para discounts, mostrar solo 2 en mobile
    const skeletonCount = section === "discounts" ? count : count;
    
    return (
      <>
        {[...Array(skeletonCount)].map((_, index) => (
          <div 
            key={index} 
            className={`relative group block animate-pulse ${section === "discounts" && index >= 2 ? 'hidden md:block' : ''}`}
          >
            <div className={`relative w-full rounded-[10px] overflow-hidden bg-gray-200 ${section === "discounts" ? 'h-48 md:h-80' : 'h-48 md:h-80'}`}></div>
            <div className="pt-3">
              <div className="mb-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="mt-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (products.length === 0) {
    return null;
  }

  // Para la sección de descuentos, necesitamos un wrapper especial
  if (section === "discounts") {
    // En mobile solo mostrar 2 productos, en desktop mostrar todos
    return (
      <>
        {products.map((product, index) => (
          <div 
            key={`${product.id}-${index}-${locality?.id || 'no-locality'}`} 
            className={`bg-white p-4 rounded-[20px] h-full cursor-pointer ${index >= 2 ? 'hidden md:block' : ''}`}
          >
            <div className="h-full flex flex-col">
              <ProductCard
                id={product.id}
                image={product.image}
                alt={product.alt}
                name={product.name}
                currentPrice={product.currentPrice}
                originalPrice={product.originalPrice}
                discount={product.discount}
                isPriceLoading={product.isPriceLoading}
                useNormalHeight={false}
              />
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {products.map((product, index) => (
        <ProductCard
          key={`${product.id}-${index}-${locality?.id || 'no-locality'}`}
          id={product.id}
          image={product.image}
          alt={product.alt}
          name={product.name}
          currentPrice={product.currentPrice}
          originalPrice={product.originalPrice}
          discount={product.discount}
          isPriceLoading={product.isPriceLoading}
        />
      ))}
    </>
  );
}
