"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Plus, Minus, ArrowRight, Layers, Bed, Scale, Package, Maximize, CheckCircle2, Package2, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useLocality } from "@/contexts/LocalityContext";
import { fetchProductById, Product as ApiProduct, fetchProducts, fetchProductCombos, ProductCombo, fetchHeroImages, HeroImage } from "@/lib/api";
import wsrvLoader from "@/lib/wsrvLoader";
import { calculateProductPrice, formatPrice, getVariantPriceByLocality, initializeCatalogCache } from "@/utils/priceUtils";
import { getPromoLabel } from "@/utils/promoUtils";

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

interface ProductVariant {
  id: string;
  name?: string;
  sku?: string;
  stock?: number;
  attributes?: Record<string, string>;
  options?: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
  prices?: Array<{
    id: string;
    price: number;
    locality_id: string;
    locality_name?: string;
  }>;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  promos?: Array<any>; // Promociones aplicables
  // Características principales
  firmness?: string; // "Medio", "Blando", "Firme", etc.
  firmnessLevel?: number; // 1-5 para la barra visual
  withPillow?: string;
  maxWeight?: string;
  boxed?: string;
  size?: string;
  fillingType?: string;
  // Información técnica
  technicalDescription?: string;
  warrantyMonths?: number;
  warrantyDescription?: string;
  materials?: string;
  // Otros campos técnicos
  filling_type?: string;
  max_supported_weight_kg?: number;
  has_pillow_top?: boolean;
  is_bed_in_box?: boolean;
  mattress_firmness?: string;
  size_label?: string;
  // Otras secciones
  warranty?: string;
  // Stock de CRM
  has_crm_stock?: boolean;
}

interface SimilarProduct {
  id: string;
  name: string;
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  image: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { locality } = useLocality();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [productCombos, setProductCombos] = useState<ProductCombo[]>([]);
  const [productBanner, setProductBanner] = useState<HeroImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    characteristics: false,
    description: false,
    warranty: false,
  });

  const { addToCart, addToFavorites, removeFromFavorites, isInFavorites, favorites } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);

  // Sincronizar estado de favorito cuando cambia en el contexto (solo cuando cambia favorites)
  useEffect(() => {
    setIsFavorite(isInFavorites(productId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, favorites]);

  // Inicializar cache de catálogos cuando se carga la localidad
  useEffect(() => {
    if (locality?.id) {
      console.log('[ProductDetailPage] Inicializando cache de catálogos para localidad:', locality.id);
      initializeCatalogCache()
        .then(() => {
          console.log('[ProductDetailPage] Cache de catálogos inicializado correctamente');
        })
        .catch((error) => {
          console.error('[ProductDetailPage] Error inicializando cache de catálogos:', error);
        });
    }
  }, [locality?.id]);

  useEffect(() => {
    const loadProduct = async () => {
      console.log("[ProductDetailPage] Cargando producto con localidad:", locality?.id, locality?.name);
      try {
        setLoading(true);
        
        // Cargar producto, combos y banner en paralelo (productos similares se cargan después para no bloquear)
        const [apiProduct, combos, banners] = await Promise.all([
          fetchProductById(productId, locality?.id),
          fetchProductCombos(productId).catch(() => []),
          fetchHeroImages(4, true).catch(() => []) // Position 4 para banner de productos
        ]);
        
        // Establecer banner si existe
        if (banners && banners.length > 0) {
          setProductBanner(banners[0]);
        }
        
        if (apiProduct) {
          console.log("[ProductDetailPage] Producto cargado - min_price:", apiProduct.min_price, "max_price:", apiProduct.max_price);
          console.log("[ProductDetailPage] Promos cargadas del API:", apiProduct.promos ? apiProduct.promos.length : 0, apiProduct.promos);
          if (apiProduct.promos && apiProduct.promos.length > 0) {
            console.log("[ProductDetailPage] Detalle de promos:", JSON.stringify(apiProduct.promos, null, 2));
          }
        }

        // Establecer combos inmediatamente
        setProductCombos(combos);
        
        // Cargar productos similares de forma asíncrona sin bloquear la renderización
        const similarParams: any = {
          is_active: true,
          page: 1,
          per_page: 10, // Reducido de 20 a 10 para cargar más rápido
          include_images: true,
          include_variants: false, // No necesitamos variantes para productos similares
          include_promos: true,
        };
        
        // Agregar localidad si está disponible
        if (locality?.id) {
          similarParams.locality_id = locality.id;
        }
        
        fetchProducts(similarParams).then((similarProductsResult) => {
          if (similarProductsResult.products) {
            const filteredProducts = similarProductsResult.products.filter(p => p.id !== productId);
            const shuffled = filteredProducts.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 4);
            
            const similarProductsFormatted: SimilarProduct[] = selected.map(p => {
              // Calcular precio usando función centralizada
              const priceInfo = calculateProductPrice(p, 1);
              
              return {
                id: p.id,
                name: p.name,
                currentPrice: priceInfo.currentPrice,
                originalPrice: priceInfo.originalPrice,
                discount: priceInfo.discount,
                image: p.main_image || (p.images && p.images.length > 0 ? p.images[0].image_url : "") || "",
              };
            });
            
            setSimilarProducts(similarProductsFormatted);
          }
        }).catch(() => {
          // Si falla, simplemente no mostrar productos similares
          setSimilarProducts([]);
        });

        if (!apiProduct) {
          // Si no se encuentra en la API, dejar vacío
          setProduct(null);
          setLoading(false);
          return;
        }

        // Transformar datos del API al formato del componente
        // Calcular precio usando función centralizada
        const priceInfo = calculateProductPrice(apiProduct, 1);

        // Transformar imágenes
        const images: ProductImage[] = apiProduct.images?.map((img) => ({
          id: img.id,
          url: img.image_url,
          alt: img.alt_text || apiProduct.name,
        })) || (apiProduct.main_image ? [{
          id: "main",
          url: apiProduct.main_image,
          alt: apiProduct.name,
        }] : []);

        // Transformar variantes - mantener estructura completa del API
        // El backend ahora incluye las options cuando se solicitan variants
        // Las options están en la tabla product_variant_options y tienen name y product_variant_id
        const variants: any[] = (apiProduct.variants || []).map((variant: any) => ({
          ...variant,
          // Asegurar que options sea un array (puede ser undefined si el variant no tiene options)
          options: variant.options || []
        }));

        const apiProductWithTech = apiProduct as any;
        
        // Preservar promos del API explícitamente
        const productPromos = (apiProduct as any).promos || [];
        console.log("[ProductDetailPage] Preservando promos en transformedProduct:", productPromos.length, productPromos);
        
        const transformedProduct: Product = {
          id: apiProduct.id,
          name: apiProduct.name,
          description: apiProduct.description || "",
          currentPrice: priceInfo.currentPrice,
          originalPrice: priceInfo.originalPrice,
          discount: priceInfo.discount,
          images: images.length > 0 ? images : [],
          variants: variants.length > 0 ? variants : [],
          // Preservar promos del API
          promos: productPromos,
          // Información técnica desde el API
          technicalDescription: apiProductWithTech.technical_description || "",
          warrantyMonths: apiProductWithTech.warranty_months,
          warrantyDescription: apiProductWithTech.warranty_description || "",
          materials: apiProductWithTech.materials || "",
          filling_type: apiProductWithTech.filling_type || "",
          max_supported_weight_kg: apiProductWithTech.max_supported_weight_kg,
          has_pillow_top: apiProductWithTech.has_pillow_top,
          is_bed_in_box: apiProductWithTech.is_bed_in_box,
          mattress_firmness: apiProductWithTech.mattress_firmness || "",
          size_label: apiProductWithTech.size_label || "",
          // Características principales (transformadas desde campos técnicos)
          firmness: apiProductWithTech.mattress_firmness || "Medio",
          firmnessLevel: 3, // TODO: calcular desde mattress_firmness si es necesario
          withPillow: apiProductWithTech.has_pillow_top ? "Sí" : "No",
          maxWeight: apiProductWithTech.max_supported_weight_kg ? `${apiProductWithTech.max_supported_weight_kg} kg` : undefined,
          boxed: apiProductWithTech.is_bed_in_box ? "Sí" : "No",
          size: variants.length > 0 ? variants[0].size || variants[0].name : apiProductWithTech.size_label || "Tamaño...",
          fillingType: apiProductWithTech.filling_type || "",
          warranty: apiProductWithTech.warranty_description || 
                   (apiProductWithTech.warranty_months ? `Garantía de ${apiProductWithTech.warranty_months} meses` : ""),
          // Stock de CRM
          has_crm_stock: apiProductWithTech.has_crm_stock !== undefined ? apiProductWithTech.has_crm_stock : true,
        };

        console.log("[ProductDetailPage] Producto transformado guardado, promos:", transformedProduct.promos?.length || 0, transformedProduct.promos);
        setProduct(transformedProduct);
        
        // Inicializar selecciones de variantes y opciones
        // Si hay variantes con solo opción "Default" y nombre "Atributo", autoseleccionarlas
        const initialSelectedOptions: Record<string, string> = {};
        if (variants.length > 0) {
          variants.forEach((variant: any) => {
            const variantKey = variant.id || variant.name || variant.sku || 'default';
            const hasOptions = variant.options && Array.isArray(variant.options) && variant.options.length > 0;
            
            if (hasOptions && variant.options.length === 1) {
              const option = variant.options[0];
              // Si la variante se llama "Atributo" o no tiene nombre/sku, y la opción es "Default", autoseleccionarla
              const variantName = variant.name || variant.sku || '';
              if ((variantName === 'Atributo' || variantName === '' || variant.sku === null || variant.sku === undefined) && option.name === 'Default') {
                initialSelectedOptions[variantKey] = option.id;
              } else if (hasOptions) {
                // Si tiene opciones pero no es el caso especial, seleccionar la primera
                initialSelectedOptions[variantKey] = option.id;
              }
            } else if (hasOptions && variant.options.length > 1) {
              // Si tiene múltiples opciones, seleccionar la primera
              initialSelectedOptions[variantKey] = variant.options[0].id;
            }
          });
          
          setSelectedVariantOptions(initialSelectedOptions);
          setSelectedVariant(variants[0]?.id || "");
        }
        
        setIsFavorite(isInFavorites(productId));
      } catch (error) {
        console.error("Error loading product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, locality?.id]);
  
  // Escuchar cambios de localidad desde el evento personalizado
  useEffect(() => {
    const handleLocalityChange = () => {
      console.log("[ProductDetailPage] Evento localityChanged recibido, forzando recarga");
      // El useEffect anterior se ejecutará automáticamente porque locality?.id cambió
    };
    
    window.addEventListener('localityChanged', handleLocalityChange);
    return () => {
      window.removeEventListener('localityChanged', handleLocalityChange);
    };
  }, [locality?.id]);

  // Los productos similares ahora se cargan en paralelo con el producto principal

  // Mostrar/ocultar indicador de scroll del contenedor de variantes
  useEffect(() => {
    if (!product || !product.variants) return;
    
    const checkScrollIndicator = () => {
      const variantsContainer = document.getElementById('variants-container');
      const variantsIndicator = document.getElementById('variants-scroll-indicator');
      
      if (variantsContainer && variantsIndicator) {
        const hasScroll = variantsContainer.scrollHeight > variantsContainer.clientHeight;
        if (hasScroll) {
          variantsIndicator.classList.remove('opacity-0');
          variantsIndicator.classList.add('opacity-100');
        } else {
          variantsIndicator.classList.remove('opacity-100');
          variantsIndicator.classList.add('opacity-0');
        }
      }
    };
    
    // Verificar después de que el DOM se actualice
    setTimeout(checkScrollIndicator, 100);
    
    // Verificar cuando se hace scroll en el contenedor de variantes
    const variantsContainer = document.getElementById('variants-container');
    let handleVariantsScroll: (() => void) | null = null;
    
    if (variantsContainer) {
      handleVariantsScroll = () => {
        const variantsIndicator = document.getElementById('variants-scroll-indicator');
        if (variantsIndicator && variantsContainer) {
          const isAtBottom = variantsContainer.scrollHeight - variantsContainer.scrollTop <= variantsContainer.clientHeight + 10;
          if (isAtBottom) {
            variantsIndicator.classList.remove('opacity-100');
            variantsIndicator.classList.add('opacity-0');
          } else {
            variantsIndicator.classList.remove('opacity-0');
            variantsIndicator.classList.add('opacity-100');
          }
        }
      };
      variantsContainer.addEventListener('scroll', handleVariantsScroll);
    }
    
    // Verificar en resize
    window.addEventListener('resize', checkScrollIndicator);
    
    return () => {
      window.removeEventListener('resize', checkScrollIndicator);
      if (variantsContainer && handleVariantsScroll) {
        variantsContainer.removeEventListener('scroll', handleVariantsScroll);
      }
    };
  }, [product]);

  // Los combos ahora se cargan en paralelo con el producto principal

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleAddToCart = () => {
    const currentPrice = getCurrentProductPrice();
    if (product && product.has_crm_stock !== false && currentPrice.price > 0) {
      addToCart({
        id: product.id,
        name: product.name,
        image: product.images[0]?.url || "",
        price: currentPrice.formattedPrice,
      });
    } else if (currentPrice.price === 0) {
      alert("Este producto no tiene precio disponible");
    } else {
      alert("Este producto no está disponible en este momento");
    }
  };

  const handleBuyNow = () => {
    const currentPrice = getCurrentProductPrice();
    if (product && product.has_crm_stock !== false && currentPrice.price > 0) {
      handleAddToCart();
      router.push("/checkout");
    } else if (currentPrice.price === 0) {
      alert("Este producto no tiene precio disponible");
    } else {
      alert("Este producto no está disponible en este momento");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product) {
      if (isFavorite) {
        removeFromFavorites(product.id);
        setIsFavorite(false);
      } else {
        addToFavorites({
          id: product.id,
          name: product.name,
          image: product.images[0]?.url || "",
          price: product.currentPrice,
        });
        setIsFavorite(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-6 md:py-14">
          {/* Main Product Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-12 mb-8 md:mb-12 animate-pulse">
            {/* Left: Image Skeleton */}
            <div className="relative flex lg:col-span-4">
              <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[520px] rounded-[10px] overflow-hidden bg-gray-200"></div>
            </div>

            {/* Right: Product Info Skeleton */}
            <div className="flex flex-col lg:h-[520px] lg:col-span-3">
              <div className="flex-1">
                {/* Title Skeleton */}
                <div className="h-6 md:h-8 bg-gray-200 rounded w-3/4 mb-4 md:mb-6"></div>

                {/* Pricing Skeleton */}
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="h-4 md:h-5 bg-gray-200 rounded w-20 md:w-24"></div>
                    <div className="h-5 md:h-6 bg-gray-200 rounded w-14 md:w-16"></div>
                  </div>
                  <div className="h-6 md:h-8 bg-gray-200 rounded w-28 md:w-32 mb-2"></div>
                  <div className="h-3 md:h-4 bg-gray-200 rounded w-36 md:w-40 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-40 md:w-48"></div>
                </div>

                {/* Variant Selection Skeleton */}
                <div className="mb-6 md:mb-8">
                  <div className="h-3 md:h-4 bg-gray-200 rounded w-36 md:w-40 mb-2 md:mb-3"></div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-8 md:h-9 bg-gray-200 rounded-[4px] w-20 md:w-24"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="w-full h-10 md:h-12 bg-gray-200 rounded-[4px]"></div>
                <div className="w-full h-10 md:h-12 bg-gray-200 rounded-[4px]"></div>
              </div>
            </div>
          </div>

          {/* Bottom Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-12 mb-8 md:mb-12">
            {/* Left: Technical Info Skeleton */}
            <div className="lg:col-span-4 order-2 lg:order-1">
              <div className="h-5 md:h-6 bg-gray-200 rounded w-40 md:w-48 mb-4 md:mb-6"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-b border-gray-200">
                    <div className="w-full flex items-center justify-between py-3 md:py-4">
                      <div className="h-4 md:h-5 bg-gray-200 rounded w-28 md:w-32"></div>
                      <div className="h-4 md:h-5 w-4 md:w-5 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Combos Skeleton */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="h-5 md:h-6 bg-gray-200 rounded w-36 md:w-40 mb-4 md:mb-6"></div>
              <div className="space-y-3 md:space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-3 md:p-4">
                    <div className="h-4 md:h-5 bg-gray-200 rounded w-3/4 mb-2 md:mb-3"></div>
                    <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2 mb-1 md:mb-2"></div>
                    <div className="h-5 md:h-6 bg-gray-200 rounded w-20 md:w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Producto no encontrado</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Calcular precio basado en variante/opción seleccionada y localidad
  const getCurrentProductPrice = (): { price: number; formattedPrice: string } => {
    console.log('[getCurrentProductPrice] Iniciando cálculo de precio:', {
      hasProduct: !!product,
      localityId: locality?.id,
      localityName: locality?.name,
      hasVariants: product?.variants && product.variants.length > 0,
      variantsCount: product?.variants?.length || 0,
      selectedVariantOptions,
      selectedVariant
    });

    if (!product) {
      console.log('[getCurrentProductPrice] No hay producto, retornando 0');
      return { price: 0, formattedPrice: formatPrice(0) };
    }

    if (!locality?.id) {
      // Si no hay localidad, usar el precio del producto (ya calculado con min_price/max_price)
      const numericPrice = parseFloat(product.currentPrice.replace(/[$.]/g, '').replace(/\./g, '')) || 0;
      console.log('[getCurrentProductPrice] No hay localidad, usando precio del producto:', numericPrice);
      return { price: numericPrice, formattedPrice: product.currentPrice };
    }

    // Buscar precio de la variante/opción seleccionada
    let selectedPrice = 0;
    let hasSelectedVariant = false;

    // Si hay variantes seleccionadas
    if (product.variants && product.variants.length > 0) {
      console.log('[getCurrentProductPrice] Hay variantes, buscando precio...');
      for (const variant of product.variants) {
        const variantKey = variant.id || variant.name || variant.sku || 'default';
        const selectedOptionId = selectedVariantOptions[variantKey];
        
        console.log('[getCurrentProductPrice] Procesando variante:', {
          variantId: variant.id,
          variantSku: variant.sku,
          variantKey,
          selectedOptionId,
          hasOptions: variant.options && Array.isArray(variant.options),
          optionsCount: variant.options?.length || 0
        });
        
        if (selectedOptionId) {
          // Hay una opción seleccionada para esta variante
          hasSelectedVariant = true;
          // Buscar precio de la opción seleccionada
          console.log('[getCurrentProductPrice] Llamando getVariantPriceByLocality con optionId:', selectedOptionId);
          const price = getVariantPriceByLocality(variant, selectedOptionId, locality.id);
          console.log('[getCurrentProductPrice] Precio obtenido de getVariantPriceByLocality:', price);
          if (price > 0) {
            selectedPrice = price;
            break;
          }
        } else if (selectedVariant === variant.id) {
          // Si no hay opciones pero la variante está seleccionada
          hasSelectedVariant = true;
          console.log('[getCurrentProductPrice] Llamando getVariantPriceByLocality sin optionId para variant:', variant.id);
          const price = getVariantPriceByLocality(variant, undefined, locality.id);
          console.log('[getCurrentProductPrice] Precio obtenido de getVariantPriceByLocality:', price);
          if (price > 0) {
            selectedPrice = price;
            break;
          }
        }
      }
    } else {
      console.log('[getCurrentProductPrice] No hay variantes o el producto no tiene variantes');
    }

    // Si se seleccionó una variante pero no tiene precio, retornar 0 (sin precio)
    if (hasSelectedVariant && selectedPrice === 0) {
      console.log('[getCurrentProductPrice] Variante seleccionada no tiene precio, retornando 0');
      return { price: 0, formattedPrice: 'Sin precio' };
    }

    // Si no se encontró precio específico y no hay variante seleccionada, usar el precio del producto (ya filtrado por localidad en el backend)
    if (selectedPrice === 0 && !hasSelectedVariant) {
      const numericPrice = parseFloat(product.currentPrice.replace(/[$.]/g, '').replace(/\./g, '')) || 0;
      console.log('[getCurrentProductPrice] No se encontró precio específico, usando precio del producto:', numericPrice);
      return { price: numericPrice, formattedPrice: product.currentPrice };
    }

    // Aplicar promociones si existen
    const apiProduct = product as any;
    if (apiProduct.promos && apiProduct.promos.length > 0) {
      console.log('[getCurrentProductPrice] Aplicando promociones');
      // Usar calculateProductPrice para aplicar promociones
      const tempProduct = { ...apiProduct, min_price: selectedPrice, max_price: selectedPrice };
      const priceInfo = calculateProductPrice(tempProduct, 1);
      console.log('[getCurrentProductPrice] Precio final con promociones:', priceInfo.currentPriceValue);
      return { price: priceInfo.currentPriceValue, formattedPrice: priceInfo.currentPrice };
    }

    console.log('[getCurrentProductPrice] Precio final sin promociones:', selectedPrice);
    return { price: selectedPrice, formattedPrice: formatPrice(selectedPrice) };
  };

  const currentPriceInfo = getCurrentProductPrice();
  const hasPrice = currentPriceInfo.price > 0;
  
  // Calcular precio sin impuestos basado en el precio final (con descuento si aplica)
  const tempProductForTaxes = { 
    ...product, 
    min_price: currentPriceInfo.price, 
    max_price: currentPriceInfo.price,
    promos: (product as any).promos || [],
    is_active: true // Required by Product type from @/lib/api
  } as unknown as ApiProduct;
  const priceInfoForTaxes = calculateProductPrice(tempProductForTaxes, 1);
  const priceWithoutTaxes = hasPrice ? priceInfoForTaxes.currentPriceValue * 0.79 : 0;

  // Función helper para verificar si una variante es del tipo "Atributo" con opción "Default"
  const isDefaultAttributeVariant = (variant: any): boolean => {
    const variantName = variant.name || variant.sku || '';
    const hasOptions = variant.options && Array.isArray(variant.options) && variant.options.length > 0;
    
    if (hasOptions && variant.options.length === 1) {
      const option = variant.options[0];
      // Detectar variantes "Atributo" con opción "Default" o variantes sin sku con opción "Default"
      return ((variantName === 'Atributo' || variantName === '' || variant.sku === null || variant.sku === undefined) && option.name === 'Default');
    }
    
    return false;
  };

  // Verificar si todas las variantes son del tipo "Atributo" con opción "Default"
  const shouldHideVariantsSection = (): boolean => {
    if (!product || !product.variants || product.variants.length === 0) {
      return true;
    }
    
    const variantsWithSku = product.variants.filter((variant: any) => variant.sku !== null && variant.sku !== undefined);
    
    if (variantsWithSku.length === 0) {
      return true;
    }
    
    // Si todas las variantes son del tipo "Atributo" con opción "Default", ocultar la sección
    return variantsWithSku.every((variant: any) => isDefaultAttributeVariant(variant));
  };

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes arrowDown {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }
        .arrow-down-animation {
          animation: arrowDown 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />

      <div className="container mx-auto px-4 py-6 md:py-14">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-12 mb-8 md:mb-12">
          {/* Left: Image Carousel */}
          <div className="relative flex lg:col-span-4">
            <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[520px] rounded-[10px] overflow-hidden bg-gray-100">
              {product.images.length > 0 && (
                <>
                  <img
                    src={wsrvLoader({ src: product.images[currentImageIndex].url, width: 800 })}
                    alt={product.images[currentImageIndex].alt || product.name}
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'cover' }}
                  />
                  
                  {/* Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                        aria-label="Imagen siguiente"
                      >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Image Dots */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {product.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex ? "bg-white" : "bg-white/50"
                          }`}
                          aria-label={`Ir a imagen ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`absolute top-2 right-2 md:top-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10 ${
                      isFavorite
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col lg:h-[520px] lg:col-span-3">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">{product.name}</h1>

              {/* Pricing */}
              <div className="mb-4 md:mb-6">
                {hasPrice ? (
                  <>
                    {(() => {
                      // Obtener el precio base SIN promociones aplicadas
                      // Necesitamos el precio original antes de aplicar promociones
                      let basePriceWithoutPromos = 0;
                      
                      // Buscar precio de la variante/opción seleccionada sin promociones
                      if (product.variants && product.variants.length > 0 && locality?.id) {
                        for (const variant of product.variants) {
                          const variantKey = variant.id || variant.name || variant.sku || 'default';
                          const selectedOptionId = selectedVariantOptions[variantKey];
                          
                          if (selectedOptionId) {
                            const price = getVariantPriceByLocality(variant, selectedOptionId, locality.id);
                            if (price > 0) {
                              basePriceWithoutPromos = price;
                              break;
                            }
                          } else if (selectedVariant === variant.id) {
                            const price = getVariantPriceByLocality(variant, undefined, locality.id);
                            if (price > 0) {
                              basePriceWithoutPromos = price;
                              break;
                            }
                          }
                        }
                      }
                      
                      // Si no se encontró precio de variante, usar el precio del producto
                      if (basePriceWithoutPromos === 0) {
                        const numericPrice = parseFloat(product.currentPrice.replace(/[$.]/g, '').replace(/\./g, '')) || 0;
                        basePriceWithoutPromos = numericPrice;
                      }
                      
                      const productPromos = (product as any).promos || [];
                      console.log('[ProductView] Precio base sin promos:', basePriceWithoutPromos, 'Promos:', productPromos.length, productPromos);
                      
                      const tempProduct = { 
                        ...product, 
                        min_price: basePriceWithoutPromos, 
                        max_price: basePriceWithoutPromos,
                        promos: productPromos,
                        is_active: true // Required by Product type from @/lib/api
                      } as unknown as ApiProduct;
                      const priceInfo = calculateProductPrice(tempProduct, 1);
                      const hasDiscount = priceInfo.hasDiscount;
                      
                      // Obtener el label de descuento directamente de priceInfo, o usar getPromoLabel como fallback
                      // Para promotional_message, siempre obtener el label aunque no haya descuento real
                      let discountLabel = priceInfo.discount;
                      if (!discountLabel && tempProduct.promos && tempProduct.promos.length > 0) {
                        discountLabel = getPromoLabel(tempProduct.promos as any, 'product_view');
                        console.log('[ProductView] Label obtenido de getPromoLabel:', discountLabel, 'para promos:', tempProduct.promos);
                      }
                      
                      // Usar el precio con descuento de priceInfo, no de currentPriceInfo
                      const finalPrice = priceInfo.currentPrice;
                      const originalPrice = priceInfo.originalPrice;
                      
                      // Verificar si hay promos de tipo promotional_message que deben mostrarse aunque no haya descuento
                      const hasPromotionalMessage = tempProduct.promos && tempProduct.promos.length > 0 && 
                        tempProduct.promos.some((p: any) => p.type === 'promotional_message');
                      
                      // Para promos de tipo "fixed", siempre mostrar el badge si hay descuento
                      // Para promotional_message, mostrar el badge aunque no haya descuento real
                      // Incluso si no hay precio original tachado (porque el descuento es un monto fijo o es solo mensaje)
                      const shouldShowDiscount = (hasDiscount && discountLabel) || (hasPromotionalMessage && discountLabel);
                      const shouldShowOriginalPrice = hasDiscount && originalPrice && 
                        priceInfo.originalPriceValue > priceInfo.currentPriceValue;
                      
                      // Calcular precio sin impuestos usando el precio final con descuento
                      const priceWithoutTaxes = priceInfo.currentPriceValue * 0.79;
                      
                      console.log('[ProductView] Precio calculado:', {
                        basePriceWithoutPromos,
                        hasDiscount,
                        discountLabel,
                        finalPrice,
                        originalPrice,
                        originalPriceValue: priceInfo.originalPriceValue,
                        currentPriceValue: priceInfo.currentPriceValue,
                        priceWithoutTaxes,
                        shouldShowDiscount,
                        shouldShowOriginalPrice,
                        promos: tempProduct.promos,
                        promosLength: tempProduct.promos?.length || 0
                      });
                      
                      return (
                        <>
                          {shouldShowOriginalPrice && (
                            <>
                              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <span className="text-base md:text-lg text-gray-400 line-through">{originalPrice}</span>
                                {shouldShowDiscount && (
                                  <span className="bg-[#00C1A7] text-white px-2 py-0.5 md:py-1 rounded-[4px] font-semibold text-xs md:text-sm">
                                    {discountLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-xl md:text-2xl font-semibold text-gray-900 mb-1 md:mb-2">{finalPrice}</div>
                            </>
                          )}
                          {!shouldShowOriginalPrice && shouldShowDiscount && (
                            <>
                              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <span className="text-xl md:text-2xl font-semibold text-gray-900">{finalPrice}</span>
                                <span className="bg-[#00C1A7] text-white px-2 py-0.5 md:py-1 rounded-[4px] font-semibold text-xs md:text-sm">
                                  {discountLabel}
                                </span>
                              </div>
                            </>
                          )}
                          {!shouldShowDiscount && (
                            <div className="text-xl md:text-2xl font-semibold text-gray-900 mb-1 md:mb-2">{finalPrice}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            Precio sin impuestos nacionales ${priceWithoutTaxes.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-xl md:text-2xl font-semibold text-gray-500 mb-1 md:mb-2">Sin precio</div>
                )}
              </div>

              {/* Variant Selection */}
              {product.variants && product.variants.filter((variant: any) => variant.sku !== null && variant.sku !== undefined).length > 0 && !shouldHideVariantsSection() && (
                <div className="mb-6 md:mb-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 md:mb-3">Opciones disponibles:</h3>
                  <div className="space-y-2 md:space-y-3">
                    {product.variants
                      .filter((variant: any) => variant.sku !== null && variant.sku !== undefined)
                      .filter((variant: any) => !isDefaultAttributeVariant(variant))
                      .map((variant: any) => {
                      // Siempre mostrar variant como título, y si tiene options, mostrar las options como opciones
                      const variantKey = variant.id || variant.name || variant.sku || 'default';
                      const hasOptions = variant.options && Array.isArray(variant.options) && variant.options.length > 0;
                      const isExpanded = expandedVariants[variantKey] || false;
                      
                      return (
                        <div key={variantKey} className="border border-gray-200 rounded-[8px] overflow-hidden">
                          {/* Header desplegable */}
                          <button
                            onClick={() => {
                              setExpandedVariants(prev => ({
                                ...prev,
                                [variantKey]: !prev[variantKey]
                              }));
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
                          >
                            <h4 className="text-xs md:text-sm font-semibold text-gray-900">
                              {variant.name || variant.sku || variant.id || "Opción"}
                            </h4>
                            <div className="flex items-center gap-2">
                              {hasOptions && (
                                <span className="text-xs text-gray-500">
                                  {variant.options.length} opción{variant.options.length !== 1 ? 'es' : ''}
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-600 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-600 shrink-0" />
                              )}
                            </div>
                          </button>
                          
                          {/* Contenido desplegable */}
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="px-4 pb-3 pt-2 bg-gray-50 border-t border-gray-200">
                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {hasOptions ? (
                                  // Si tiene options, mostrar las options como opciones seleccionables
                                  variant.options.map((option: any) => {
                                    const isSelected = selectedVariantOptions[variantKey] === option.id;
                                    const isOutOfStock = option.stock !== undefined && option.stock <= 0;
                                    return (
                                      <button
                                        key={option.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isOutOfStock) {
                                            setSelectedVariantOptions(prev => ({
                                              ...prev,
                                              [variantKey]: option.id
                                            }));
                                          }
                                        }}
                                        disabled={isOutOfStock}
                                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-[4px] border transition-all text-xs md:text-sm ${
                                          isOutOfStock
                                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                            : isSelected
                                            ? "border-[#00C1A7] bg-[#00C1A7] text-white cursor-pointer"
                                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 cursor-pointer"
                                        }`}
                                      >
                                        {option.name}
                                        {isOutOfStock && (
                                          <span className="ml-1 md:ml-2 text-xs">(Sin stock)</span>
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  // Si no tiene options, mostrar el variant mismo como opción
                                  (() => {
                                    const isVariantOutOfStock = variant.stock !== undefined && variant.stock <= 0;
                                    return (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isVariantOutOfStock) {
                                            setSelectedVariant(variant.id);
                                          }
                                        }}
                                        disabled={isVariantOutOfStock}
                                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-[4px] border transition-all text-xs md:text-sm ${
                                          isVariantOutOfStock
                                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                            : selectedVariant === variant.id
                                            ? "border-[#00C1A7] bg-[#00C1A7] text-white cursor-pointer"
                                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 cursor-pointer"
                                        }`}
                                      >
                                        {variant.name || variant.sku || variant.id}
                                        {isVariantOutOfStock && (
                                          <span className="ml-1 md:ml-2 text-xs">(Sin stock)</span>
                                        )}
                                      </button>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Alineados con el fondo de la imagen */}
            <div className="flex flex-col gap-3 md:gap-4 mt-4 lg:mt-0">
              {product?.has_crm_stock === false ? (
                <div className="w-full bg-gray-300 text-gray-600 py-2.5 md:py-3 px-4 md:px-6 rounded-[4px] text-center font-medium text-sm md:text-base">
                  Sin Stock
                </div>
              ) : !hasPrice ? (
                <div className="w-full bg-gray-300 text-gray-600 py-2.5 md:py-3 px-4 md:px-6 rounded-[4px] text-center font-medium text-sm md:text-base">
                  Sin precio
                </div>
              ) : (
                <>
                  <button
                    onClick={handleBuyNow}
                    className="w-full bg-[#00C1A7] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-[4px] hover:bg-[#00A890] transition-colors cursor-pointer text-sm md:text-base font-medium"
                  >
                    Comprar ahora
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="w-full border border-[#00C1A7] text-[#00C1A7] py-2.5 md:py-3 px-4 md:px-6 rounded-[4px] hover:bg-[#00C1A7] hover:text-white transition-colors cursor-pointer text-sm md:text-base font-medium"
                  >
                    Agregar al carrito
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Technical Info (Left) and Combos (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-12 mb-8 md:mb-12">
          {/* Left: Collapsible Sections */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <h2 className="text-lg md:text-xl text-gray-900 mb-4 md:mb-6">Información técnica</h2>
            <div className="space-y-2">
              {/* Descripción */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection("description")}
                  className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                >
                  <span className="text-md text-gray-500">Descripción</span>
                  {expandedSections.description ? (
                    <Minus className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.description ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-4 text-sm text-gray-600">
                    {product.description}
                  </div>
                </div>
              </div>

              {/* Características principales */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection("characteristics")}
                  className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                >
                  <span className="text-md text-gray-500">Características principales</span>
                  {expandedSections.characteristics ? (
                    <Minus className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.characteristics ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-4">
                    <div className="space-y-4">
                      {/* Firmeza del colchón con barra visual */}
                      {product.firmness && (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <Layers className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-2">Firmeza del colchón</div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((level) => {
                                    const firmnessLevel = product.firmnessLevel || 3;
                                    const isActive = level <= firmnessLevel;
                                    return (
                                      <div
                                        key={level}
                                        className={`flex-1 h-2 rounded-sm ${
                                          isActive ? "bg-[#00C1A7]" : "bg-gray-200"
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-gray-500">
                                  <span>SOFT</span>
                                  <span>FIRME</span>
                                </div>
                              </div>
                              <div className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
                                {product.firmness}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Con pillow */}
                      {product.withPillow && (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <Bed className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">Con pillow</div>
                            <div className="text-sm text-gray-900">{product.withPillow}</div>
                          </div>
                        </div>
                      )}

                      {/* Peso máximo soportado */}
                      {product.maxWeight && (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <Scale className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">Peso máximo soportado</div>
                            <div className="text-sm text-gray-900">{product.maxWeight}</div>
                          </div>
                        </div>
                      )}

                      {/* Colchón en caja */}
                      {product.boxed && (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">Colchón en caja</div>
                            <div className="text-sm text-gray-900">{product.boxed}</div>
                          </div>
                        </div>
                      )}

                      {/* Tamaño */}
                      {product.size_label && (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <Maximize className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">Tamaño</div>
                            <div className="text-sm text-gray-900">{product.size_label}</div>
                          </div>
                        </div>
                      )}

                      {/* Tipo de relleno */}
                      {product.fillingType && (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">Tipo de relleno</div>
                            <div className="text-sm text-gray-900">{product.fillingType}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Garantía */}
              {(product.warrantyDescription || product.warrantyMonths) && (
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection("warranty")}
                    className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                  >
                    <span className="text-md text-gray-500">Garantía</span>
                    {expandedSections.warranty ? (
                      <Minus className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedSections.warranty ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pb-4 text-sm text-gray-600 space-y-2">
                      {product.warrantyMonths && (
                        <div>
                          <span className="font-medium text-gray-700">Duración:</span> {product.warrantyMonths} meses
                        </div>
                      )}
                      {product.warrantyDescription && (
                        <div className="whitespace-pre-wrap">{product.warrantyDescription}</div>
                      )}
                      {!product.warrantyDescription && !product.warrantyMonths && product.warranty && (
                        <div>{product.warranty}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Banner de productos - Último elemento del contenedor de información técnica */}
              {productBanner && (
                <div className="mt-6 mb-6">
                  {productBanner.cta_link ? (
                    <Link href={productBanner.cta_link} className="block">
                      <img
                        src={wsrvLoader({ src: productBanner.image_url, width: 1200 })}
                        alt={productBanner.title || productBanner.subtitle || "Banner promocional"}
                        className="w-full h-auto rounded-[10px] object-cover"
                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                      />
                    </Link>
                  ) : (
                    <img
                      src={wsrvLoader({ src: productBanner.image_url, width: 1200 })}
                      alt={productBanner.title || productBanner.subtitle || "Banner promocional"}
                      className="w-full h-auto rounded-[10px] object-cover"
                      style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Combo Section */}
          {productCombos.filter(combo => combo.is_completed).length > 0 && (
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl text-gray-900">Elegí tu combo</h2>
                {productCombos.filter(combo => combo.is_completed).length > 3 && (
                  <Link
                    href={`/productos/${productId}/combos`}
                    className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors text-xs md:text-sm font-medium"
                  >
                    <span>Ver todos</span>
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                  </Link>
                )}
              </div>
              <div className="space-y-4 md:space-y-6">
                {productCombos.filter(combo => combo.is_completed).slice(0, 3).map((combo) => {
                  const formatPrice = (price: number): string => {
                    return `$${Math.round(price).toLocaleString('es-AR')}`;
                  };
                  
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
                  
                  // Construir nombre del combo desde los items
                  const comboName = combo.product_name || 
                                   combo.description || 
                                   combo.alt_description || 
                                   `Combo ${combo.crm_product_id}`;
                  
                  // Construir descripción con los items
                  const itemsDescription = combo.items
                    .map(item => `${item.quantity}x ${item.item_name || `Producto ${item.crm_product_id}`}`)
                    .join(", ");
                  
                  const comboImage = combo.product?.main_image || 
                                    (combo.product?.images && combo.product.images.length > 0 
                                      ? combo.product.images[0].image_url 
                                      : "") || 
                                    product?.images[0]?.url || 
                                    "";
                  
                  return (
                    <div
                      key={combo.id}
                      className="bg-white border border-gray-200 rounded-[10px] p-3 md:p-4 flex items-center gap-3 md:gap-4"
                    >
                      {comboImage && (
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-[4px] flex-shrink-0 overflow-hidden">
                          <img
                            src={wsrvLoader({ src: comboImage, width: 200 })}
                            alt={comboName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-0.5 md:mb-1 text-sm md:text-base line-clamp-2">{comboName}</h3>
                        {itemsDescription && (
                          <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 line-clamp-1">{itemsDescription}</p>
                        )}
                        {currentPrice && (
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-base md:text-lg font-semibold text-gray-900">{currentPrice}</span>
                            {originalPrice && (
                              <span className="text-xs md:text-sm text-gray-400 line-through">{originalPrice}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <Link 
                        href={combo.product_id ? `/productos/${combo.product_id}` : "#"}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-[#484848] text-[#484848] flex items-center justify-center hover:bg-[#484848] hover:text-white transition-colors cursor-pointer flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-semibold text-gray-900">Productos similares</h2>
              <a href="#" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                <span className="font-medium text-sm md:text-base">Ver todos</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {similarProducts.map((similarProduct, index) => (
                <div key={similarProduct.id} className={index >= 2 ? "hidden md:block" : ""}>
                  <ProductCard
                    id={similarProduct.id}
                    image={similarProduct.image}
                    alt={similarProduct.name}
                    name={similarProduct.name}
                    currentPrice={similarProduct.currentPrice}
                    originalPrice={similarProduct.originalPrice || ""}
                    discount={similarProduct.discount}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        <Footer />
      </div>
    </>
  );
}

