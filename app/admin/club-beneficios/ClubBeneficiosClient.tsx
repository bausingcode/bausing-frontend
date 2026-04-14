"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Gift, Plus, Search, X } from "lucide-react";
import wsrvLoader from "@/lib/wsrvLoader";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  firstProductImageUrl,
} from "@/lib/productImagePlaceholder";
import { calculateProductPrice } from "@/utils/priceUtils";
import {
  fetchClubBeneficiosAdmin,
  fetchProducts,
  saveClubBeneficios,
  type HomepageDistributionItem,
  type Product,
} from "@/lib/api";

const PER_PAGE = 12;

function SelectedProductCard({
  product,
  onRemove,
}: {
  product: Product;
  onRemove: () => void;
}) {
  const image = firstProductImageUrl(product);
  const priceInfo = calculateProductPrice(
    {
      ...product,
      promos: Array.isArray(product.promos) ? product.promos : [],
    },
    1,
  );

  const optimizedImage =
    image === PRODUCT_IMAGE_PLACEHOLDER || image.startsWith("data:")
      ? image
      : image.includes("wsrv.nl")
        ? image
        : wsrvLoader({ src: image, width: 400 });

  return (
    <div className="relative group bg-white border border-gray-200 rounded-[10px] overflow-hidden hover:shadow-lg transition-all">
      <div className="relative w-full h-52 overflow-hidden">
        <img
          src={optimizedImage}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          title="Quitar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-gray-900">
            {priceInfo.currentPrice}
          </span>
          {priceInfo.originalPrice ? (
            <span className="text-sm text-gray-400 line-through">
              {priceInfo.originalPrice}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProductSelectionModal({
  isOpen,
  onClose,
  onSelect,
  products,
  isLoading,
  selectedIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  products: Product[];
  isLoading: boolean;
  selectedIds: Set<string>;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) setSearchQuery("");
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-[14px] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Seleccionar Producto
          </h2>
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
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                Cargando productos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No se encontraron productos
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const priceInfo = calculateProductPrice(
                    {
                      ...product,
                      promos: Array.isArray(product.promos)
                        ? product.promos
                        : [],
                    },
                    1,
                  );

                  const isSelected = selectedIds.has(product.id);

                  return (
                    <button
                      key={product.id}
                      disabled={isSelected}
                      onClick={() => {
                        onSelect(product);
                        onClose();
                      }}
                      className={`w-full text-left bg-white border border-gray-200 rounded-[10px] p-4 transition-all ${
                        isSelected
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-[#00C1A7] hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium text-gray-900 mb-1 truncate">
                            {product.name}
                          </h4>
                          <div className="text-sm text-gray-600 truncate">
                            {product.category_name || "Sin categoría"}
                          </div>
                          {isSelected ? (
                            <div className="text-xs text-gray-500 mt-1">
                              Ya agregado
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-semibold text-gray-900">
                            {priceInfo.currentPrice}
                          </div>
                          {priceInfo.originalPrice ? (
                            <div className="text-sm text-gray-400 line-through">
                              {priceInfo.originalPrice}
                            </div>
                          ) : null}
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

function PublishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  saving,
  error,
  count,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  error: string | null;
  count: number;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-[14px] w-full max-w-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Publicar</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700">
            Se publicarán <span className="font-semibold">{count}</span>{" "}
            {count === 1 ? "producto" : "productos"} en Club Beneficios.
          </p>

          {error ? (
            <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-[10px] border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              className="rounded-[10px] bg-[#00C1A7] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function itemsToProducts(items: HomepageDistributionItem[]): Product[] {
  return items
    .map((i) => i.product)
    .filter((p): p is Product => Boolean(p));
}

export default function ClubBeneficiosClient() {
  const [savedItems, setSavedItems] = useState<HomepageDistributionItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const savedIds = useMemo(
    () => new Set(itemsToProducts(savedItems).map((p) => p.id)),
    [savedItems],
  );

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((p) => p.id)),
    [selectedProducts],
  );

  const hasChanges = useMemo(() => {
    const a = Array.from(savedIds);
    const b = Array.from(selectedIds);
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return true;
    }
    return false;
  }, [savedIds, selectedIds]);

  const totalPages = Math.max(1, Math.ceil(selectedProducts.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage]);

  const pageProducts = useMemo(() => {
    const start = (safePage - 1) * PER_PAGE;
    return selectedProducts.slice(start, start + PER_PAGE);
  }, [selectedProducts, safePage]);

  const loadAdmin = async () => {
    setLoading(true);
    try {
      const data = await fetchClubBeneficiosAdmin();
      const items = data.items || [];
      setSavedItems(items);
      setSelectedProducts(itemsToProducts(items));
      setPage(1);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Error al cargar Club Beneficios");
    } finally {
      setLoading(false);
    }
  };

  const loadAllProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const all: Product[] = [];
      let currentPage = 1;
      let total = 1;
      do {
        const result = await fetchProducts({
          is_active: true,
          sort: "created_at_desc",
          page: currentPage,
          per_page: 100,
          include_images: true,
          include_promos: true,
        });
        all.push(...(result.products || []));
        total = result.total_pages || 1;
        currentPage += 1;
      } while (currentPage <= total && currentPage <= 50);
      setAllProducts(all);
    } catch (e) {
      console.error("Error cargando productos para selector:", e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const handleOpenAdd = async () => {
    setIsModalOpen(true);
    if (allProducts.length === 0 && !isLoadingProducts) {
      await loadAllProducts();
    }
  };

  const handleAddProduct = (product: Product) => {
    if (selectedIds.has(product.id)) return;
    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handlePublish = () => {
    setPublishError(null);
    setIsPublishModalOpen(true);
  };

  const confirmPublish = async () => {
    setSaving(true);
    setPublishError(null);
    try {
      const productIds = selectedProducts.map((p) => p.id);
      await saveClubBeneficios(productIds);
      setIsPublishModalOpen(false);
      await loadAdmin();
    } catch (e: any) {
      setPublishError(e?.message || "Error publicando");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Club Beneficios"
          description="Seleccioná los productos que se muestran en la página pública."
          icon={<Gift className="w-5 h-5" />}
        />
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Club Beneficios" icon={<Gift className="w-5 h-5" />} />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Club Beneficios"
          description="Los cambios se aplican al tocar Publicar."
          icon={<Gift className="w-5 h-5" />}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleOpenAdd}
            className="rounded-[10px] border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
          <button
            type="button"
            disabled={saving || !hasChanges}
            onClick={handlePublish}
            className="rounded-[10px] bg-[#00C1A7] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            Publicar
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          {selectedProducts.length} {selectedProducts.length === 1 ? "producto" : "productos"}
          {hasChanges ? (
            <span className="ml-2 text-amber-700">(cambios sin publicar)</span>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Página {safePage} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </div>

      {selectedProducts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-10 text-center">
          <p className="text-gray-700 font-medium">No hay productos cargados</p>
          <p className="text-gray-500 text-sm mt-1">
            Tocá <span className="font-semibold">Agregar</span> para sumar productos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pageProducts.map((p) => (
            <SelectedProductCard
              key={p.id}
              product={p}
              onRemove={() => handleRemoveProduct(p.id)}
            />
          ))}
        </div>
      )}

      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAddProduct}
        products={allProducts}
        isLoading={isLoadingProducts}
        selectedIds={selectedIds}
      />

      <PublishConfirmModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={confirmPublish}
        saving={saving}
        error={publishError}
        count={selectedProducts.length}
      />
    </div>
  );
}
