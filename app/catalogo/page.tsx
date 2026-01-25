"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchProducts, fetchCategories, Product, Category } from "@/lib/api";
import { ChevronDown } from "lucide-react";
import { calculateProductPrice } from "@/utils/priceUtils";
import { useLocality } from "@/contexts/LocalityContext";

// Esta página maneja /catalogo sin slug (solo con query params como search)
// Es básicamente la misma lógica que [...slug]/page.tsx pero sin manejo de categorías
export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const { locality } = useLocality();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [perPage, setPerPage] = useState(20);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);
  
  // Obtener el término de búsqueda de la URL
  const searchQuery = searchParams?.get("search") || "";
  
  // Resetear página cuando cambia la búsqueda, perPage o localidad
  useEffect(() => {
    setPage(1);
  }, [searchQuery, perPage, locality?.id]);
  
  // Obtener productos
  useEffect(() => {
    const loadProducts = async () => {
      console.log("[CatalogoPage] Cargando productos con localidad:", locality?.id, locality?.name);
      setLoading(true);
      try {
        const fetchParams: any = {
          is_active: true,
          sort: sortBy,
          page,
          per_page: perPage,
          include_images: true,
          include_promos: true,
        };
        
        // Agregar localidad si está disponible
        if (locality?.id) {
          fetchParams.locality_id = locality.id;
          console.log("[CatalogoPage] Agregando locality_id a fetchParams:", locality.id);
        } else {
          console.log("[CatalogoPage] No hay localidad disponible");
        }
        
        // Si hay búsqueda, agregar el parámetro de búsqueda
        if (searchQuery) {
          fetchParams.search = searchQuery;
        }
        
        const result = await fetchProducts(fetchParams);
        console.log("[CatalogoPage] Productos cargados:", result.products.length, "productos");
        if (result.products.length > 0) {
          console.log("[CatalogoPage] Primer producto - min_price:", result.products[0].min_price, "max_price:", result.products[0].max_price);
        }
        
        setProducts(result.products);
        setTotalPages(result.total_pages);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [page, sortBy, searchQuery, perPage, locality?.id]);
  
  // Escuchar cambios de localidad desde el evento personalizado
  useEffect(() => {
    const handleLocalityChange = () => {
      console.log("[CatalogoPage] Evento localityChanged recibido, forzando recarga");
      // Forzar recarga de productos
      setPage(1);
    };
    
    window.addEventListener('localityChanged', handleLocalityChange);
    return () => {
      window.removeEventListener('localityChanged', handleLocalityChange);
    };
  }, []);
  
  const sortOptions = [
    { value: "created_at_desc", label: "Más recientes" },
    { value: "created_at", label: "Más antiguos" },
    { value: "name", label: "Nombre A-Z" },
    { value: "price_asc", label: "Precio: menor a mayor" },
    { value: "price_desc", label: "Precio: mayor a menor" },
  ];
  
  const getProductCardProps = (product: Product) => {
    const image = product.main_image || (product.images && product.images[0]?.image_url) || "/images/placeholder.png";
    
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
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li>
              <a href="/" className="hover:text-gray-900 transition-colors">Inicio</a>
            </li>
            {searchQuery && (
              <>
                <li>/</li>
                <li>
                  <span className="text-gray-900 font-medium">Búsqueda</span>
                </li>
              </>
            )}
          </ol>
        </nav>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Resultados de búsqueda` : "Catálogo"}
          </h1>
          {searchQuery && (
            <p className="text-gray-600 mb-2">
              Buscando: <span className="font-semibold text-gray-900">"{searchQuery}"</span>
            </p>
          )}
          <p className="text-gray-600">
            {products.length} {products.length === 1 ? "producto encontrado" : "productos encontrados"}
          </p>
        </div>
        
        {/* Barra superior con ordenar y items por página */}
        <div className="sticky top-[150px] z-30 bg-white -mx-4 px-4 pb-3 pt-4 mb-6">
          <div className="container mx-auto flex items-center justify-between">
            {/* Items por página */}
            <div className="relative">
              <button
                onClick={() => setShowPerPageMenu(!showPerPageMenu)}
                className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span>
                  Mostrar: {perPage} por página
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showPerPageMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showPerPageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPerPageMenu(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[180px]">
                    {[20, 50, 100].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setPerPage(value);
                          setShowPerPageMenu(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          perPage === value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"
                        }`}
                      >
                        {value} por página
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span>
                  Ordenar por: {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[200px]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          sortBy === option.value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(8)].map((_, index) => (
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
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-lg mb-2">No se encontraron productos</p>
                <p className="text-gray-500 text-sm">
                  {searchQuery 
                    ? `No hay resultados para "${searchQuery}". Intenta con otros términos.`
                    : "Intenta con otros filtros o vuelve más tarde"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} {...getProductCardProps(product)} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

