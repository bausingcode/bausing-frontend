"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Package, Search, X, Loader2, Plus } from "lucide-react";
import {
  fetchHomepageDistribution,
  setHomepageDistribution,
  publishHomepageDistribution,
  discardHomepageDraft,
  HomepageDistribution,
  HomepageDistributionItem,
  fetchProducts,
  Product,
} from "@/lib/api";
import { calculateProductPrice } from "@/utils/priceUtils";
import wsrvLoader from "@/lib/wsrvLoader";

interface ProductCardProps {
  product: Product | null;
  section: string;
  position: number;
  onSelect: () => void;
  onRemove: () => void;
  readOnly?: boolean;
}

function BrokenRefSlot({
  productId,
  onSelect,
  onRemove,
  readOnly = false,
}: {
  productId?: string | null;
  onSelect: () => void;
  onRemove: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="relative flex min-h-[320px] flex-col justify-between rounded-[10px] border-2 border-dashed border-amber-300 bg-amber-50/50 p-4">
      <p className="text-sm text-amber-900">
        Referencia rota: el producto ya no existe o no se pudo cargar.
      </p>
      {productId ? (
        <p className="mt-2 font-mono text-xs text-gray-600 break-all">{productId}</p>
      ) : null}
      {readOnly ? null : (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="flex-1 rounded-[8px] bg-[#00C1A7] px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Reemplazar
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-[8px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCardSlot({
  product,
  section,
  position,
  onSelect,
  onRemove,
  readOnly = false,
}: ProductCardProps) {
  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  if (!product) {
    return (
      <div
        onClick={readOnly ? undefined : onSelect}
        className={
          readOnly
            ? "bg-gray-50 border-2 border-dashed border-gray-200 rounded-[10px] p-6 flex flex-col items-center justify-center min-h-[320px] cursor-default"
            : "bg-gray-50 border-2 border-dashed border-gray-300 rounded-[10px] p-6 flex flex-col items-center justify-center min-h-[320px] cursor-pointer hover:border-[#00C1A7] hover:bg-gray-100 transition-all group"
        }
      >
        <Plus className={`w-12 h-12 mb-3 ${readOnly ? "text-gray-300" : "text-gray-400 group-hover:text-[#00C1A7] transition-colors"}`} />
        <p className={`text-sm ${readOnly ? "text-gray-400" : "text-gray-500 group-hover:text-[#00C1A7] transition-colors"}`}>
          {readOnly ? "Vacío" : "Seleccionar producto"}
        </p>
      </div>
    );
  }

  const image = product.main_image || (product.images && product.images[0]?.image_url) || "/images/placeholder.png";
  const priceInfo = calculateProductPrice(product, 1);
  const optimizedImage = image.includes('wsrv.nl') ? image : wsrvLoader({ src: image, width: 400 });

  return (
    <div className={`relative group bg-white border border-gray-200 rounded-[10px] overflow-hidden ${readOnly ? "" : "hover:shadow-lg"} transition-all`}>
      <div className="relative w-full h-64 overflow-hidden">
        <img
          src={optimizedImage}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {readOnly ? null : (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Eliminar producto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-gray-900">
            {priceInfo.currentPrice}
          </span>
          {priceInfo.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {priceInfo.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect,
  products
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (product: Product) => void;
  products: Product[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Resetear búsqueda cuando se abre el modal
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-[14px] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Seleccionar Producto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#00C1A7] placeholder:text-gray-500 placeholder:opacity-100"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? "No se encontraron productos" : "Cargando productos..."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const priceInfo = calculateProductPrice(product, 1);

                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        onSelect(product);
                        onClose();
                      }}
                      className="w-full text-left bg-white border border-gray-200 rounded-[10px] p-4 hover:border-[#00C1A7] hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium text-gray-900 mb-1 truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {product.category_name && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Categoría:</span>
                                <span>{product.category_name}</span>
                              </span>
                            )}
                            {product.category_option_value && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Tipo:</span>
                                <span>{product.category_option_value}</span>
                              </span>
                            )}
                            {product.sku && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">SKU:</span>
                                <span className="font-mono text-xs">{product.sku}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {priceInfo.currentPrice}
                            </span>
                            {priceInfo.originalPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                {priceInfo.originalPrice}
                              </span>
                            )}
                          </div>
                          {product.is_active !== undefined && (
                            <span className={`mt-1 text-xs px-2 py-0.5 rounded ${
                              product.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {product.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DistribucionInicioClient() {
  const [distribution, setDistribution] = useState<HomepageDistribution | null>(null);
  const [publishedGrid, setPublishedGrid] = useState<HomepageDistribution | null>(null);
  const [adminView, setAdminView] = useState<"draft" | "published">("draft");
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ section: string; position: number } | null>(null);
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) {
      m.set(p.id, p);
    }
    return m;
  }, [products]);

  const resolveSlotProduct = (
    item: HomepageDistributionItem | null | undefined
  ): Product | null => {
    if (!item) return null;
    if (item.product) return item.product;
    if (item.product_id) return productById.get(item.product_id) ?? null;
    return null;
  };

  useEffect(() => {
    // Cargar distribución y productos al montar el componente
    const loadData = async () => {
      await Promise.all([
        loadDistribution(),
        loadAllProducts()
      ]);
    };
    loadData();
  }, []);

  const loadDistribution = async () => {
    setIsLoading(true);
    try {
      setLoadError(null);
      const data = await fetchHomepageDistribution();
      setDistribution(data.draft);
      setPublishedGrid(data.published);
      setHasUnpublishedChanges(data.has_unpublished_changes);
    } catch (error) {
      console.error("Error loading distribution:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la distribución del inicio"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllProducts = async () => {
    setIsLoadingProducts(true);
    try {
      // Cargar todos los productos activos de una vez
      const allProducts: Product[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await fetchProducts({
          is_active: true,
          include_images: true,
          per_page: 100,
          page: page,
        });
        
        allProducts.push(...result.products);
        hasMore = result.products.length === 100;
        page++;
      }

      setProducts(allProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadDistributionSilent = async (section?: string) => {
    // Si se especifica una sección, mostrar loader solo en esa sección
    if (section) {
      setLoadingSections(prev => new Set(prev).add(section));
    }
    
    try {
      setLoadError(null);
      const data = await fetchHomepageDistribution();
      setDistribution(data.draft);
      setPublishedGrid(data.published);
      setHasUnpublishedChanges(data.has_unpublished_changes);
    } catch (error) {
      console.error("Error loading distribution:", error);
      setLoadError(
        error instanceof Error ? error.message : "Error al sincronizar la distribución"
      );
    } finally {
      if (section) {
        setLoadingSections((prev) => {
          const newSet = new Set(prev);
          newSet.delete(section);
          return newSet;
        });
      }
    }
  };

  const handlePublish = async () => {
    if (
      !window.confirm(
        "¿Publicar el borrador? Los visitantes verán esta distribución en el inicio."
      )
    ) {
      return;
    }
    setIsPublishing(true);
    try {
      await publishHomepageDistribution();
      await loadDistribution();
    } catch (error) {
      console.error(error);
      alert("No se pudo publicar. Reintentá o revisá la consola.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (
      !window.confirm(
        "¿Descartar todo el borrador? Volvé a la distribución que está publicada ahora."
      )
    ) {
      return;
    }
    setIsDiscarding(true);
    try {
      await discardHomepageDraft();
      await loadDistribution();
    } catch (error) {
      console.error(error);
      alert("No se pudo descartar el borrador.");
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    if (!selectedSlot) return;

    const section = selectedSlot.section;
    const position = selectedSlot.position;

    // Actualización optimista - actualizar el estado local inmediatamente
    setDistribution((prev) => {
      if (!prev) return prev;
      const newDist = { ...prev };
      const sectionKey = section as keyof HomepageDistribution;
      const sectionArray = [...(newDist[sectionKey] || [])];
      sectionArray[position] = {
        id: `temp-${Date.now()}`,
        section: section,
        position: position,
        product_id: product.id,
        product: product,
      };
      newDist[sectionKey] = sectionArray as any;
      return newDist;
    });

    setSelectedSlot(null);

    // Mostrar loader en la sección específica
    setLoadingSections(prev => new Set(prev).add(section));

    // Hacer la llamada al backend en segundo plano
    try {
      await setHomepageDistribution({
        section: section as any,
        position: position,
        product_id: product.id,
      });
      // Sincronizar para obtener el ID real del servidor
      await loadDistributionSilent(section);
    } catch (error) {
      console.error("Error setting distribution:", error);
      // Revertir el cambio optimista en caso de error
      await loadDistributionSilent(section);
      alert("Error al guardar la distribución");
    }
  };

  const handleRemoveProduct = async (section: string, position: number) => {
    // Actualización optimista - actualizar el estado local inmediatamente
    setDistribution((prev) => {
      if (!prev) return prev;
      const newDist = { ...prev };
      const sectionKey = section as keyof HomepageDistribution;
      const sectionArray = [...(newDist[sectionKey] || [])];
      sectionArray[position] = null;
      newDist[sectionKey] = sectionArray as any;
      return newDist;
    });

    // Mostrar loader en la sección específica
    setLoadingSections(prev => new Set(prev).add(section));

    // Hacer la llamada al backend en segundo plano
    try {
      await setHomepageDistribution({
        section: section as any,
        position: position,
        product_id: null,
      });
      // Sincronizar con el servidor
      await loadDistributionSilent(section);
    } catch (error) {
      console.error("Error removing product:", error);
      // Revertir el cambio optimista en caso de error
      await loadDistributionSilent(section);
      alert("Error al eliminar el producto");
    }
  };

  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      featured: "Productos Destacados",
      discounts: "Descuentazos",
      mattresses: "Nuestros Colchones",
      complete_purchase: "Completa tu compra",
    };
    return titles[section] || section;
  };

  const getSectionDescription = (section: string) => {
    const descriptions: Record<string, string> = {
      featured: "4 productos destacados en la primera sección",
      discounts: "3 productos en la sección de descuentazos",
      mattresses: "4 productos en la sección 'Nuestros Colchones'",
      complete_purchase: "4 productos en la sección 'Completa tu compra'",
    };
    return descriptions[section] || "";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#00C1A7]" />
      </div>
    );
  }

  const sections = [
    { key: "featured", count: 4 },
    { key: "discounts", count: 3 },
    { key: "mattresses", count: 4 },
    { key: "complete_purchase", count: 4 },
  ];

  const activeGrid =
    adminView === "draft" ? distribution : publishedGrid ?? distribution;
  const gridReadOnly = adminView === "published";

  return (
    <div className="p-6">
      <PageHeader
        title="Distribución de Productos en el Inicio"
        icon={<Package className="w-6 h-6" />}
      />

      <p className="mt-4 text-sm text-gray-600 max-w-3xl">
        Los cambios en los casilleros quedan en borrador. La web pública no se actualiza hasta que
        tocás &quot;Publicar cambios&quot;.
      </p>

      {loadError ? (
        <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 whitespace-pre-wrap">
          {loadError}
        </div>
      ) : null}

      {hasUnpublishedChanges ? (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">
            Hay cambios en borrador que aún no están en el sitio.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || isDiscarding}
              className="rounded-[8px] bg-[#00C1A7] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPublishing ? "Publicando…" : "Publicar cambios"}
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              disabled={isPublishing || isDiscarding}
              className="rounded-[8px] border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isDiscarding ? "Descartando…" : "Descartar borrador"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-[10px] border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setAdminView("draft")}
          className={`rounded-[8px] px-4 py-2 text-sm font-medium transition-colors ${
            adminView === "draft"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Borrador (editable)
        </button>
        <button
          type="button"
          onClick={() => setAdminView("published")}
          className={`rounded-[8px] px-4 py-2 text-sm font-medium transition-colors ${
            adminView === "published"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Publicado en el sitio
        </button>
      </div>

      {adminView === "published" ? (
        <p className="mt-2 text-xs text-gray-500">
          Vista de solo lectura: es lo que ven los visitantes hoy (si no hay borrador sin publicar
          pendiente coincide con el borrador).
        </p>
      ) : null}

      <div className="mt-6 space-y-8">
        {sections.map(({ key, count }) => {
          const isLoadingSection = loadingSections.has(key);
          
          return (
            <div key={key} className="bg-white rounded-[14px] p-6 border border-gray-200 relative">
              {isLoadingSection && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[14px] flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00C1A7]" />
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getSectionTitle(key)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {getSectionDescription(key)}
                </p>
              </div>
              
              <div className={`grid gap-4 ${count === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {Array.from({ length: count }).map((_, index) => {
                  const item = activeGrid?.[key as keyof HomepageDistribution]?.[index];
                  const product = resolveSlotProduct(item);
                  const brokenRef = Boolean(item?.product_id && !product);

                  return (
                    <div key={index}>
                      {brokenRef ? (
                        <BrokenRefSlot
                          productId={item?.product_id}
                          readOnly={gridReadOnly}
                          onSelect={() => setSelectedSlot({ section: key, position: index })}
                          onRemove={() => handleRemoveProduct(key, index)}
                        />
                      ) : (
                        <ProductCardSlot
                          product={product}
                          section={key}
                          position={index}
                          readOnly={gridReadOnly}
                          onSelect={() => setSelectedSlot({ section: key, position: index })}
                          onRemove={() => handleRemoveProduct(key, index)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ProductSelectionModal
        isOpen={selectedSlot !== null}
        onClose={() => setSelectedSlot(null)}
        onSelect={handleSelectProduct}
        products={products}
      />
    </div>
  );
}
