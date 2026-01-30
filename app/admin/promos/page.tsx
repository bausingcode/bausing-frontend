"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Edit, Trash2, CreditCard, X, Plus, Search, ChevronDown } from "lucide-react";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { fetchPromos, createPromo, updatePromo, deletePromo, type Promo, fetchCategories, fetchProducts, type Category, type Product } from "@/lib/api";

export default function Promos() {
  const [promotions, setPromotions] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<Promo | null>(null);

  useEffect(() => {
    const loadPromos = async () => {
      try {
        setLoading(true);
        const promos = await fetchPromos({ 
          include_applicability: true 
        });
        setPromotions(promos);
        setError(null);
      } catch (err) {
        console.error("Error loading promos:", err);
        setError("Error al cargar las promociones");
      } finally {
        setLoading(false);
      }
    };

    loadPromos();
  }, []);

  const handleCreatePromo = () => {
    setEditingPromo(null);
    setShowCreateModal(true);
  };

  const handleEditPromo = (promo: Promo) => {
    setEditingPromo(promo);
    setShowCreateModal(true);
  };

  const handleDeletePromo = async (promo: Promo) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la promoción "${promo.title}"?`)) {
      return;
    }

    try {
      await deletePromo(promo.id);
      await reloadPromos();
      setDeletingPromo(null);
    } catch (err: any) {
      alert(`Error al eliminar la promoción: ${err.message}`);
    }
  };

  const reloadPromos = async () => {
    try {
      const promos = await fetchPromos({ 
        include_applicability: true 
      });
      setPromotions(promos);
    } catch (err) {
      console.error("Error reloading promos:", err);
    }
  };

  // Helper para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Helper para obtener texto del tipo
  const getTypeText = (type: string, value: number, extraConfig?: Record<string, any>) => {
    switch (type) {
      case "percentage":
        return `${value}% OFF`;
      case "fixed":
        return `$${value.toLocaleString("es-AR")} OFF`;
      case "2x1":
        return "2x1";
      case "bundle":
        if (extraConfig?.buy && extraConfig?.pay) {
          return `${extraConfig.buy}x${extraConfig.pay}`;
        }
        return "Combo";
      case "wallet_multiplier":
        return `x${value} Pesos Bausing`;
      default:
        return type.toUpperCase();
    }
  };

  // Helper para obtener lista de productos
  const getProductNames = (promo: Promo): string => {
    if (!promo.applicability || promo.applicability.length === 0) {
      return "Todos los productos";
    }

    const names: string[] = [];
    promo.applicability.forEach((app) => {
      if (app.applies_to === "all") {
        names.push("Todos los productos");
      } else if (app.applies_to === "product" && app.product_name) {
        names.push(app.product_name);
      } else if (app.applies_to === "category" && app.category_name) {
        names.push(app.category_name);
      }
    });

    return names.length > 0 ? names.join(", ") : "Sin productos específicos";
  };

  // Helper para obtener estado en español
  const getEstado = (promo: Promo): string => {
    const now = new Date();
    const startAt = new Date(promo.start_at);
    const endAt = new Date(promo.end_at);

    if (!promo.is_active) {
      return "inactiva";
    }
    if (now < startAt) {
      return "programada";
    }
    if (now >= startAt && now <= endAt) {
      return "activa";
    }
    return "expirada";
  };

  if (loading) {
    return (
      <div className="px-8 pt-6 pb-8 min-h-screen">
        <PageHeader title="Promos" description="Gestiona las promociones y ofertas" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Promociones Activas</h2>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-[14px] border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-4 bg-gray-200 rounded w-36"></div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 pt-6 pb-8 min-h-screen">
        <PageHeader title="Promos" description="Gestiona las promociones y ofertas" />
        <div className="flex items-center justify-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Promos" 
        description="Gestiona las promociones y ofertas" 
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Promociones Activas</h2>
        <button
          onClick={handleCreatePromo}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Promo</span>
        </button>
      </div>

      <div className="space-y-4">
        {promotions.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-gray-200 p-6 text-center">
            <p className="text-gray-600">No hay promociones disponibles</p>
          </div>
        ) : (
          promotions.map((promo) => {
            const estado = getEstado(promo);
            const vigencia = `${formatDate(promo.start_at)} - ${formatDate(promo.end_at)}`;
            const tipo = getTypeText(promo.type, promo.value, promo.extra_config);
            const productos = getProductNames(promo);
            
            return (
              <div key={promo.id} className="bg-white rounded-[14px] border border-gray-200 p-6 relative">
                {/* Edit and Delete Icons */}
                <div className="absolute top-6 right-6 flex items-center gap-3">
                  <button 
                    onClick={() => handleEditPromo(promo)}
                    className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeletePromo(promo)}
                    className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Title and Status */}
                <div className="mb-4 pr-20">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900">{promo.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      estado === 'activa' 
                        ? 'bg-green-100 text-green-700' 
                        : estado === 'programada'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {estado}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Tipo:</span> <span style={{ color: '#F59E0B' }} className="font-semibold">{tipo}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Vigencia:</span> {vigencia}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Productos:</span> {productos}
                  </div>
                </div>

                {/* Billetera Info */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <div className="relative">
                    {promo.allows_wallet ? (
                      <CreditCard className={`w-5 h-5 text-blue-600`} />
                    ) : (
                      <div className="relative">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <X className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
                      </div>
                    )}
                  </div>
                  <span className={`text-sm ${promo.allows_wallet ? 'text-blue-600' : 'text-gray-500'}`}>
                    {promo.allows_wallet 
                      ? "Compatible con Pesos Bausing" 
                      : "No aplica con billetera"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Crear/Editar Promo */}
      {showCreateModal && (
        <CreatePromoModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingPromo(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingPromo(null);
            reloadPromos();
          }}
          promo={editingPromo}
        />
      )}
    </div>
  );
}

// Componente Modal para crear/editar promos
function CreatePromoModal({ isOpen, onClose, onSuccess, promo }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; promo?: Promo | null }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "percentage" as "percentage" | "fixed" | "2x1" | "bundle" | "wallet_multiplier",
    value: 0,
    extra_config: {} as Record<string, any>,
    start_at: "",
    end_at: "",
    is_active: true,
    allows_wallet: true,
    applies_to: "all" as "all" | "product" | "category",
    selected_category_id: "",
    selected_product_id: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Separar categorías principales y subcategorías
  const mainCategories = categories.filter((cat) => !cat.parent_id);
  const subcategories = categories.filter((cat) => cat.parent_id);
  
  // Obtener subcategorías de una categoría específica
  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter((subcat) => subcat.parent_id === categoryId);
  };
  
  // Verificar si una categoría tiene subcategorías
  const categoryHasSubcategories = (categoryId: string) => {
    return subcategories.some((subcat) => subcat.parent_id === categoryId);
  };

  // Cargar datos y prellenar formulario si es edición
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoadingData(true);
        try {
          const [catsData, prodsData] = await Promise.all([
            fetchCategories(true),
            fetchProducts({ is_active: true, per_page: 1000 })
          ]);
          setCategories(catsData);
          setProducts(prodsData.products);

          // Si es edición, prellenar formulario
          if (promo) {
            const startDate = new Date(promo.start_at);
            const endDate = new Date(promo.end_at);
            const appliesTo = promo.applicability?.[0]?.applies_to || "all";
            const selectedCatId = promo.applicability?.find(a => a.applies_to === "category")?.category_id || "";
            const selectedProdId = promo.applicability?.find(a => a.applies_to === "product")?.product_id || "";
            
            // Obtener nombre del producto si hay uno seleccionado
            let productName = "";
            if (selectedProdId) {
              const selectedProduct = prodsData.products.find(p => p.id === selectedProdId);
              productName = selectedProduct?.name || "";
            }

            setFormData({
              title: promo.title,
              description: promo.description || "",
              type: promo.type as any,
              value: promo.value,
              extra_config: promo.extra_config || {},
              start_at: new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
              end_at: new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
              is_active: promo.is_active,
              allows_wallet: promo.allows_wallet,
              applies_to: appliesTo as any,
              selected_category_id: selectedCatId || "",
              selected_product_id: selectedProdId || "",
            });
            setProductSearchQuery(productName);
          } else {
            // Reset form
            setFormData({
              title: "",
              description: "",
              type: "percentage",
              value: 0,
              extra_config: {},
              start_at: "",
              end_at: "",
              is_active: true,
              allows_wallet: true,
              applies_to: "all",
              selected_category_id: "",
              selected_product_id: "",
            });
            setProductSearchQuery("");
          }
        } catch (err) {
          console.error("Error loading data:", err);
        } finally {
          setLoadingData(false);
        }
      };
      loadData();
    }
  }, [isOpen, promo]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!formData.title || !formData.type || formData.value === null || !formData.start_at || !formData.end_at) {
      setError("Todos los campos requeridos deben estar completos");
      return;
    }

    if (new Date(formData.start_at) >= new Date(formData.end_at)) {
      setError("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    try {
      setIsLoading(true);
      
      // Construir applicability según el tipo
      const applicability: any[] = [];
      if (formData.applies_to === "all") {
        applicability.push({ applies_to: "all" });
      } else if (formData.applies_to === "category" && formData.selected_category_id) {
        applicability.push({ applies_to: "category", category_id: formData.selected_category_id });
      } else if (formData.applies_to === "product" && formData.selected_product_id) {
        applicability.push({ applies_to: "product", product_id: formData.selected_product_id });
      }

      if (applicability.length === 0) {
        setError("Debes seleccionar una categoría o producto para aplicar la promoción");
        return;
      }

      const promoData: any = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        value: formData.value,
        start_at: formData.start_at,
        end_at: formData.end_at,
        is_active: formData.is_active,
        allows_wallet: formData.allows_wallet,
        applicability
      };

      if (formData.type === "bundle" && Object.keys(formData.extra_config).length > 0) {
        promoData.extra_config = formData.extra_config;
      }

      if (promo) {
        await updatePromo(promo.id, promoData);
      } else {
        await createPromo(promoData);
      }
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "percentage",
        value: 0,
        extra_config: {},
        start_at: "",
        end_at: "",
        is_active: true,
        allows_wallet: true,
        applies_to: "all",
        selected_category_id: "",
        selected_product_id: "",
      });
      setProductSearchQuery("");
      setShowProductDropdown(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al crear la promoción");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[14px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10 rounded-t-[14px]">
          <h2 className="text-xl font-semibold text-gray-900">{promo ? "Editar Promoción" : "Crear Promoción"}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputClass}
                placeholder="Ej: 20% off en colchones"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Descripción</label>
              <AutoResizeTextarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass}
                minRows={3}
                placeholder="Descripción opcional de la promoción"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className={inputClass}
                  required
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo</option>
                  <option value="2x1">2x1</option>
                  <option value="bundle">Combo/Bundle</option>
                  <option value="wallet_multiplier">Multiplicador Pesos Bausing</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Valor <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Vigencia</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Fecha Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Fecha Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Estado</p>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Activa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allows_wallet}
                    onChange={(e) => setFormData({ ...formData, allows_wallet: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Compatible con Pesos Bausing</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Aplicar a</p>
              <select
                value={formData.applies_to}
                onChange={(e) => {
                  setFormData({ ...formData, applies_to: e.target.value as any, selected_category_id: "", selected_product_id: "" });
                  setProductSearchQuery("");
                  setShowProductDropdown(false);
                }}
                className={inputClass}
                required
              >
                <option value="all">Todos los productos</option>
                <option value="category">Categoría específica</option>
                <option value="product">Producto específico</option>
              </select>
            </div>

            {formData.applies_to === "category" && (
              <div>
                <label className={labelClass}>
                  Categoría o Subcategoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.selected_category_id}
                  onChange={(e) => setFormData({ ...formData, selected_category_id: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">Selecciona una categoría o subcategoría</option>
                  {mainCategories.flatMap((cat) => {
                    const hasSubs = categoryHasSubcategories(cat.id);
                    const subcats = getSubcategoriesForCategory(cat.id);
                    return [
                      <option key={cat.id} value={cat.id} style={{ fontWeight: '500' }}>
                        {cat.name}
                      </option>,
                      ...(hasSubs ? subcats.map((subcat) => (
                        <option key={subcat.id} value={subcat.id} style={{ paddingLeft: '20px' }}>
                          └─ {subcat.name}
                        </option>
                      )) : [])
                    ];
                  })}
                </select>
              </div>
            )}

            {formData.applies_to === "product" && (
              <div className="relative">
                <label className={labelClass}>
                  Producto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className={inputClass + " pl-10 pr-10"}
                    />
                    {formData.selected_product_id && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, selected_product_id: "" });
                          setProductSearchQuery("");
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {showProductDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowProductDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {(() => {
                          const filteredProducts = products.filter((prod) =>
                            prod.name.toLowerCase().includes(productSearchQuery.toLowerCase())
                          );
                          
                          if (filteredProducts.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No se encontraron productos
                              </div>
                            );
                          }
                          
                          return filteredProducts.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, selected_product_id: prod.id });
                                setProductSearchQuery(prod.name);
                                setShowProductDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                formData.selected_product_id === prod.id ? "bg-blue-50 text-blue-600" : "text-gray-900"
                              }`}
                            >
                              {prod.name}
                            </button>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>
                
                {formData.selected_product_id && (
                  <p className="mt-2 text-sm text-gray-500">
                    Seleccionado: <span className="font-medium text-gray-700">{products.find(p => p.id === formData.selected_product_id)?.name}</span>
                  </p>
                )}
              </div>
            )}

            {loadingData && (
              <div className="text-sm text-gray-500 text-center py-4">
                Cargando categorías y productos...
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-3 z-10 rounded-b-[14px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (promo ? "Actualizando..." : "Creando...") : (promo ? "Actualizar Promoción" : "Crear Promoción")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

