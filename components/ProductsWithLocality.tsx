"use client";

import { useEffect, useState } from "react";
import { useLocality } from "@/contexts/LocalityContext";
import { fetchProducts, Product } from "@/lib/api";
import { calculateProductPrice } from "@/utils/priceUtils";
import ProductCard from "@/components/ProductCard";

interface ProductsWithLocalityProps {
  initialProducts: Product[];
  section: "featured" | "discounts" | "mattresses" | "complete_purchase";
  count: number;
}

export default function ProductsWithLocality({
  initialProducts,
  section,
  count,
}: ProductsWithLocalityProps) {
  const { locality, isLoading: localityLoading } = useLocality();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProductsWithLocality = async () => {
      // Si no hay localidad o está cargando, usar productos iniciales
      if (localityLoading || !locality) {
        return;
      }

      // Si la localidad cambió, recargar productos con la localidad
      setLoading(true);
      try {
        const result = await fetchProducts({
          is_active: true,
          include_images: true,
          include_promos: true,
          locality_id: locality.id,
          per_page: count * 2, // Obtener más productos para tener opciones
        });

        setProducts(result.products.slice(0, count));
      } catch (error) {
        console.error("Error loading products with locality:", error);
        // En caso de error, mantener productos iniciales
      } finally {
        setLoading(false);
      }
    };

    loadProductsWithLocality();
  }, [locality?.id, localityLoading, count]);

  // Helper function to convert Product to ProductCard props
  const productToCardProps = (product: Product) => {
    const image =
      product.main_image ||
      (product.images && product.images[0]?.image_url) ||
      "/images/placeholder.png";

    // Calcular precio usando función centralizada
    const priceInfo = calculateProductPrice(product, 1);

    return {
      id: product.id,
      image,
      alt: product.name,
      name: product.name,
      currentPrice: priceInfo.currentPrice,
      originalPrice: priceInfo.originalPrice,
      discount: priceInfo.discount,
    };
  };

  if (loading) {
    // Mostrar skeleton mientras carga
    return (
      <>
        {[...Array(count)].map((_, index) => (
          <div key={index} className="relative group block animate-pulse">
            <div className="relative w-full h-80 rounded-[10px] overflow-hidden bg-gray-200"></div>
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

  // Usar productos iniciales si no hay localidad o si hay error
  const displayProducts = products.length > 0 ? products : initialProducts;

  return (
    <>
      {displayProducts.slice(0, count).map((product, index) => {
        const props = productToCardProps(product);
        return (
          <ProductCard
            key={`${product.id}-${index}`}
            id={props.id}
            image={props.image}
            alt={props.alt}
            name={props.name}
            currentPrice={props.currentPrice}
            originalPrice={props.originalPrice}
            discount={props.discount}
          />
        );
      })}
    </>
  );
}
