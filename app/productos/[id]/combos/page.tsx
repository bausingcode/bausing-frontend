"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { fetchProductCombos, ProductCombo, fetchProductById } from "@/lib/api";
import { Package2, ArrowLeft } from "lucide-react";
import wsrvLoader from "@/lib/wsrvLoader";
import { calculateProductPrice, formatPrice } from "@/utils/priceUtils";

export default function ProductCombosPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [productCombos, setProductCombos] = useState<ProductCombo[]>([]);
  const [productName, setProductName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar nombre del producto
        const product = await fetchProductById(productId);
        if (product) {
          setProductName(product.name);
        }
        
        // Cargar combos
        const combos = await fetchProductCombos(productId);
        setProductCombos(combos);
      } catch (error) {
        console.error("Error loading combos:", error);
        setProductCombos([]);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId]);

  const formatPrice = (price: number): string => {
    return `$${Math.round(price).toLocaleString('es-AR')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">Cargando combos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="mb-8">
          <Link
            href={`/productos/${productId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al producto</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Combos disponibles
          </h1>
          {productName && (
            <p className="text-gray-600">
              Combos que incluyen: <span className="font-medium">{productName}</span>
            </p>
          )}
          <p className="text-gray-600 mt-1">
            {productCombos.filter(combo => combo.is_completed).length === 0
              ? "No hay combos disponibles"
              : `${productCombos.filter(combo => combo.is_completed).length} ${productCombos.filter(combo => combo.is_completed).length === 1 ? "combo disponible" : "combos disponibles"}`}
          </p>
        </div>

        {productCombos.filter(combo => combo.is_completed).length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-[14px] p-12 text-center bg-gray-50">
            <div className="mx-auto w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 mb-4">
              <Package2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay combos disponibles
            </h3>
            <p className="text-gray-600 mb-6">
              Este producto no está incluido en ningún combo por el momento.
            </p>
            <button
              onClick={() => router.push(`/productos/${productId}`)}
              className="inline-flex items-center gap-2 bg-[#00C1A7] text-white px-6 py-3 rounded-[10px] font-semibold hover:bg-[#00a892] transition-colors"
            >
              Volver al producto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productCombos.filter(combo => combo.is_completed).map((combo) => {
              // Construir nombre del combo
              const comboName = combo.product_name || 
                               combo.description || 
                               combo.alt_description || 
                               `Combo ${combo.crm_product_id}`;
              
              // Construir descripción con los items
              const itemsDescription = combo.items
                .map(item => `${item.quantity}x ${item.item_name || `Producto ${item.crm_product_id}`}`)
                .join(", ");
              
              // Obtener precio del combo
              let currentPrice = "";
              let originalPrice: string | undefined = undefined;
              
              if (combo.product) {
                // Usar la función centralizada para calcular precios (incluye promociones)
                const priceInfo = calculateProductPrice(combo.product, 1);
                currentPrice = priceInfo.currentPrice;
                // Solo mostrar precio tachado si hay un descuento real de promoción
                originalPrice = priceInfo.hasDiscount ? priceInfo.originalPrice : undefined;
              } else if (combo.price_sale) {
                currentPrice = formatPrice(combo.price_sale);
              }
              
              // Obtener imagen
              const comboImage = combo.product?.main_image || 
                                (combo.product?.images && combo.product.images.length > 0 
                                  ? combo.product.images[0].image_url 
                                  : "") || 
                                "";
              
              // Si el combo tiene un producto completado, usar ProductCard
              if (combo.product_id && combo.product) {
                // Usar la función centralizada para calcular precios (incluye promociones)
                const priceInfo = calculateProductPrice(combo.product, 1);
                const currentPrice = priceInfo.currentPrice;
                // Solo mostrar precio tachado si hay un descuento real de promoción
                const originalPrice = priceInfo.hasDiscount ? priceInfo.originalPrice : undefined;
                
                let discount: string | undefined;
                if (combo.product.promos && combo.product.promos.length > 0) {
                  const promo = combo.product.promos[0];
                  if (promo.discount_percentage) {
                    discount = "OFERTA";
                  }
                }
                
                return (
                  <ProductCard
                    key={combo.id}
                    id={combo.product_id}
                    image={comboImage}
                    alt={comboName}
                    name={comboName}
                    currentPrice={currentPrice}
                    originalPrice={originalPrice || ""}
                    discount={discount}
                  />
                );
              }
              
              // Si no está completado, mostrar card personalizado
              return (
                <div
                  key={combo.id}
                  className="bg-white border border-gray-200 rounded-[10px] overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {comboImage && (
                    <div className="w-full h-64 bg-gray-100 overflow-hidden">
                      <img
                        src={wsrvLoader({ src: comboImage, width: 400 })}
                        alt={comboName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{comboName}</h3>
                    {itemsDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{itemsDescription}</p>
                    )}
                    {currentPrice && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-semibold text-gray-900">{currentPrice}</span>
                        {originalPrice && (
                          <span className="text-sm text-gray-400 line-through">{originalPrice}</span>
                        )}
                      </div>
                    )}
                    <Link
                      href={combo.product_id ? `/productos/${combo.product_id}` : "#"}
                      className="block w-full text-center bg-[#00C1A7] text-white py-2 px-4 rounded-[6px] hover:bg-[#00a892] transition-colors font-medium"
                    >
                      Ver combo
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
