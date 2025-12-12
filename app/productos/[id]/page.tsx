"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Plus, Minus, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/app/contexts/CartContext";
import { fetchProductById, Product as ApiProduct } from "@/lib/api";
import wsrvLoader from "@/lib/wsrvLoader";

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

interface ProductVariant {
  id: string;
  name: string;
  size?: string;
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
  technicalInfo?: string;
  materials?: string;
  warranty?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    technical: false,
    description: false,
    materials: false,
    warranty: false,
  });

  const { addToCart, addToFavorites, removeFromFavorites, isInFavorites } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const apiProduct = await fetchProductById(productId);
        
        // Producto de prueba por defecto
        const mockProduct: Product = {
          id: productId,
          name: "Colchón Lumma 2 plazas (140x190cm) de resortes",
          description: "Colchón de alta calidad con resortes bonell de acero de alta resistencia. Diseñado para brindar el máximo confort y soporte durante toda la noche. Ideal para personas que buscan un descanso reparador.",
          currentPrice: "$400.000",
          originalPrice: "$800.000",
          discount: "%50 OFF",
          images: [
            { id: "1", url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=800&fit=crop" },
            { id: "2", url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=800&fit=crop" },
            { id: "3", url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=800&fit=crop" },
          ],
          variants: [
            { id: "1", name: "140x190cm", size: "140x190cm" },
            { id: "2", name: "90x190cm", size: "90x190cm" },
            { id: "3", name: "80x190cm", size: "80x190cm" },
            { id: "4", name: "200x200cm", size: "200x200cm" },
            { id: "5", name: "180x200cm", size: "180x200cm" },
            { id: "6", name: "160x200cm", size: "160x200cm" },
            { id: "7", name: "100x200cm", size: "100x200cm" },
          ],
          technicalInfo: "Sistema de resortes bonell de acero de alta resistencia. Densidad de espuma de poliuretano: 25kg/m³. Altura total: 30cm. Peso máximo recomendado: 150kg por persona.",
          materials: "Fabricado con resortes bonell de acero, espuma de poliuretano de alta densidad, tela de algodón transpirable y base de soporte reforzada.",
          warranty: "Garantía de 5 años contra defectos de fabricación. Cobertura completa de resortes y materiales. Servicio técnico incluido.",
        };

        if (!apiProduct) {
          // Si no se encuentra en la API, usar producto de prueba
          setProduct(mockProduct);
          setSelectedVariant(mockProduct.variants[0]?.id || "");
          setIsFavorite(isInFavorites(productId));
          setLoading(false);
          return;
        }

        // Transformar datos del API al formato del componente
        const formatPrice = (price: number): string => {
          return `$${Math.round(price).toLocaleString('es-AR')}`;
        };

        const minPrice = apiProduct.min_price || 0;
        const maxPrice = apiProduct.max_price || minPrice;
        const currentPrice = formatPrice(minPrice);
        const originalPrice = maxPrice > minPrice ? formatPrice(maxPrice) : undefined;
        
        // Calcular descuento si hay promoción
        let discount: string | undefined;
        if (apiProduct.promos && apiProduct.promos.length > 0) {
          const promo = apiProduct.promos[0];
          if (promo.discount_percentage) {
            discount = `%${promo.discount_percentage} OFF`;
          }
        }

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

        // Transformar variantes
        const variants: ProductVariant[] = apiProduct.variants?.map((variant) => {
          // Intentar extraer el tamaño de los atributos o del nombre
          const size = variant.attributes?.size || variant.attributes?.dimension || 
                      variant.name.match(/\d+x\d+/)?.[0] || variant.name;
          return {
            id: variant.id,
            name: variant.name,
            size: size,
          };
        }) || [];

        const transformedProduct: Product = {
          id: apiProduct.id,
          name: apiProduct.name,
          description: apiProduct.description || "",
          currentPrice,
          originalPrice,
          discount,
          images: images.length > 0 ? images : mockProduct.images,
          variants: variants.length > 0 ? variants : mockProduct.variants,
          technicalInfo: "Información técnica del producto...", // TODO: Agregar al backend si es necesario
          materials: "Materiales utilizados en la fabricación...", // TODO: Agregar al backend si es necesario
          warranty: "Garantía de 5 años...", // TODO: Agregar al backend si es necesario
        };

        setProduct(transformedProduct);
        setSelectedVariant((variants.length > 0 ? variants : mockProduct.variants)[0]?.id || "");
        setIsFavorite(isInFavorites(productId));
      } catch (error) {
        console.error("Error loading product:", error);
        // En caso de error, mostrar producto de prueba
        const mockProduct: Product = {
          id: productId,
          name: "Colchón Lumma 2 plazas (140x190cm) de resortes",
          description: "Colchón de alta calidad con resortes bonell de acero de alta resistencia. Diseñado para brindar el máximo confort y soporte durante toda la noche. Ideal para personas que buscan un descanso reparador.",
          currentPrice: "$400.000",
          originalPrice: "$800.000",
          discount: "%50 OFF",
          images: [
            { id: "1", url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=800&fit=crop" },
            { id: "2", url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=800&fit=crop" },
            { id: "3", url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=800&fit=crop" },
          ],
          variants: [
            { id: "1", name: "140x190cm", size: "140x190cm" },
            { id: "2", name: "90x190cm", size: "90x190cm" },
            { id: "3", name: "80x190cm", size: "80x190cm" },
            { id: "4", name: "200x200cm", size: "200x200cm" },
            { id: "5", name: "180x200cm", size: "180x200cm" },
            { id: "6", name: "160x200cm", size: "160x200cm" },
            { id: "7", name: "100x200cm", size: "100x200cm" },
          ],
          technicalInfo: "Sistema de resortes bonell de acero de alta resistencia. Densidad de espuma de poliuretano: 25kg/m³. Altura total: 30cm. Peso máximo recomendado: 150kg por persona.",
          materials: "Fabricado con resortes bonell de acero, espuma de poliuretano de alta densidad, tela de algodón transpirable y base de soporte reforzada.",
          warranty: "Garantía de 5 años contra defectos de fabricación. Cobertura completa de resortes y materiales. Servicio técnico incluido.",
        };
        setProduct(mockProduct);
        setSelectedVariant(mockProduct.variants[0]?.id || "");
        setIsFavorite(isInFavorites(productId));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, isInFavorites]);

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
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        image: product.images[0]?.url || "",
        price: product.currentPrice,
      });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handleToggleFavorite = () => {
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

  const calculatePriceInInstallments = (priceStr: string, installments: number = 12): string => {
    const numericPrice = parseFloat(priceStr.replace(/[$.]/g, '').replace(/\./g, ''));
    if (isNaN(numericPrice)) return '';
    const pricePerInstallment = numericPrice / installments;
    return `$${pricePerInstallment.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Cargando producto...</div>
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

  const priceIn12Installments = calculatePriceInInstallments(product.currentPrice);
  const priceWithoutTaxes = parseFloat(product.currentPrice.replace(/[$.]/g, '').replace(/\./g, '')) * 1.21;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-14">
        {/* Main Product Section */}
        <div className="grid grid-cols-7 gap-12 mb-12">
          {/* Left: Image Carousel */}
          <div className="relative flex col-span-4">
            <div className="relative w-full h-[520px] rounded-[10px] overflow-hidden bg-gray-100">
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                        aria-label="Imagen siguiente"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
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
                    onClick={handleToggleFavorite}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10 ${
                      isFavorite
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col h-[520px] col-span-3">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 mb-6">{product.name}</h1>

              {/* Pricing */}
              <div className="mb-6">
                {product.originalPrice && (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg text-gray-400 line-through">{product.originalPrice}</span>
                      {product.discount && (
                        <span className="bg-[#00C1A7] text-white px-2 py-1 rounded-[4px] font-semibold text-sm">
                          {product.discount}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 mb-2">{product.currentPrice}</div>
                  </>
                )}
                {!product.originalPrice && (
                  <div className="text-2xl font-semibold text-gray-900 mb-2">{product.currentPrice}</div>
                )}
                <div className="text-sm text-gray-600 mb-1">
                  En 12 cuotas de {priceIn12Installments}
                </div>
                <div className="text-xs text-gray-500">
                  Precio sin impuestos nacionales ${priceWithoutTaxes.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Variant Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Opciones disponibles:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`px-4 py-2 rounded-[4px] border transition-all cursor-pointer ${
                        selectedVariant === variant.id
                          ? "border-[#00C1A7] bg-[#00C1A7] text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {variant.size || variant.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons - Alineados con el fondo de la imagen */}
            <div className="flex flex-col gap-4">
              <button
                onClick={handleBuyNow}
                className="w-full bg-[#00C1A7] text-white py-3 px-6 rounded-[4px] hover:bg-[#00A890] transition-colors cursor-pointer"
              >
                Comprar ahora
              </button>
              <button
                onClick={handleAddToCart}
                className="w-full border border-[#00C1A7] text-[#00C1A7] py-3 px-6 rounded-[4px] hover:bg-[#00C1A7] hover:text-white transition-colors cursor-pointer"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Technical Info (Left) and Combos (Right) */}
        <div className="grid grid-cols-7 gap-12 mb-12">
          {/* Left: Collapsible Sections */}
          <div className="col-span-4">
            <h2 className="text-xl text-gray-900 mb-6">Información técnica</h2>
            <div className="space-y-2">
              {[
                { key: "description", title: "Descripción" },
                { key: "materials", title: "Materiales" },
                { key: "warranty", title: "Garantía del producto" },
              ].map((section) => (
                <div key={section.key} className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                  >
                    <span className="text-md text-gray-500">{section.title}</span>
                    {expandedSections[section.key] ? (
                      <Minus className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedSections[section.key] && (
                    <div className="pb-4 text-sm text-gray-600">
                      {section.key === "description" && product.description}
                      {section.key === "materials" && product.materials}
                      {section.key === "warranty" && product.warranty}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Combo Section */}
          <div className="col-span-3">
            <h2 className="text-xl text-gray-900 mb-6">Elegí tu combo</h2>
            <div className="space-y-6">
              {[
                {
                  name: "Colchón Luuma + base de hierro",
                  size: "2 plazas (140x190) cm",
                  currentPrice: "$920.000",
                  originalPrice: "$1.620.000",
                },
                {
                  name: "Colchón Luuma + base de hierro + Respaldo de pluma",
                  size: "2 plazas (140x190) cm",
                  currentPrice: "$1.120.000",
                  originalPrice: "$1.920.000",
                },
              ].map((combo, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-[10px] p-4 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-[4px] flex-shrink-0 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop"
                      alt={combo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{combo.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{combo.size}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">{combo.currentPrice}</span>
                      <span className="text-sm text-gray-400 line-through">{combo.originalPrice}</span>
                    </div>
                  </div>
                  <Link 
                    href={`/productos/${productId}`}
                    className="w-8 h-8 rounded-full border border-[#484848] text-[#484848] flex items-center justify-center hover:bg-[#484848] hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Productos similares</h2>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium">Ver todos</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[
              {
                id: "1",
                name: "Colchón Lumma 2 plazas (140x190cm) de resortes",
                currentPrice: "$400.000",
                originalPrice: "$800.000",
                discount: "%50 OFF",
                image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
              },
              {
                id: "2",
                name: "Colchón Vitto 2 plazas (140x190cm) de resortes",
                currentPrice: "$750.000",
                originalPrice: "$1.500.000",
                discount: "%50 OFF",
                image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
              },
              {
                id: "3",
                name: "Colchón Lumma 2 plazas (140x190cm) de resortes",
                currentPrice: "$650.000",
                originalPrice: "$1.300.000",
                discount: "%50 OFF",
                image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
              },
              {
                id: "4",
                name: "Colchón Vitto 2 plazas (140x190cm) de resortes",
                currentPrice: "$900.000",
                originalPrice: "",
                discount: undefined,
                image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
              },
            ].map((similarProduct) => (
              <ProductCard
                key={similarProduct.id}
                id={similarProduct.id}
                image={similarProduct.image}
                alt={similarProduct.name}
                name={similarProduct.name}
                currentPrice={similarProduct.currentPrice}
                originalPrice={similarProduct.originalPrice}
                discount={similarProduct.discount}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

