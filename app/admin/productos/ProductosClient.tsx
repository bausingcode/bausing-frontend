"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Edit, Trash2, FolderTree, Package, PackageSearch, FolderX, Sparkles, ChevronDown, ChevronRight, Search, RefreshCw, Eye, X, ExternalLink, Loader2 } from "lucide-react";
import CreateCategoryModal from "@/components/CreateCategoryModal";
import CreateProductModal from "@/components/CreateProductModal";
import { Category, fetchCrmProducts, fetchCrmCombos, CrmProduct, CrmCombo, fetchProductById, Product } from "@/lib/api";
import { fetchCategories as fetchCategoriesClient } from "@/lib/api";

interface CategoryFromBackend extends Category {
  nombre?: string;
  tipo?: "Categoría" | "Subcategoría";
  productos?: number;
  subcategorias?: number;
  categoriaPadre?: string;
  parentId?: string;
  opciones?: string[];
}

interface ProductosClientProps {
  initialCategories?: Category[]; // Opcional, solo para SSR inicial, siempre se reemplaza por fetch desde DB
}

// Convertir categorías del backend al formato esperado por el componente
function convertBackendCategoryToLocal(cat: Category, allCategories: Category[]): CategoryFromBackend {
  const isSubcategory = !!cat.parent_id;
  const children = allCategories.filter(c => c.parent_id === cat.id);
  
  const localCat: CategoryFromBackend = {
    ...cat,
    nombre: cat.name,
    tipo: isSubcategory ? "Subcategoría" : "Categoría",
    productos: 0, // TODO: obtener del backend
    parentId: cat.parent_id,
    categoriaPadre: cat.parent_name,
    subcategorias: isSubcategory ? undefined : children.length || 0,
    opciones: cat.options?.map(opt => opt.value) || [],
  };

  return localCat;
}

export default function ProductosClient({ initialCategories = [] }: ProductosClientProps) {
  const [activeTab, setActiveTab] = useState<"crm-completados" | "crm-no-completados" | "combos" | "combos-completados" | "categorias">("crm-no-completados");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCrmProduct, setEditingCrmProduct] = useState<CrmProduct | CrmCombo | null>(null);
  const [viewingCrmProduct, setViewingCrmProduct] = useState<CrmProduct | CrmCombo | null>(null);
  const [viewingProductData, setViewingProductData] = useState<Product | null>(null);
  const [isLoadingViewingProduct, setIsLoadingViewingProduct] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Estado local para categorías - siempre desde la DB, nunca localStorage
  const [categories, setCategories] = useState<CategoryFromBackend[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Estado para productos CRM con paginación
  const [crmProductsCompleted, setCrmProductsCompleted] = useState<CrmProduct[]>([]);
  const [crmProductsNotCompleted, setCrmProductsNotCompleted] = useState<CrmProduct[]>([]);
  const [crmCombos, setCrmCombos] = useState<CrmCombo[]>([]);
  const [crmCombosCompleted, setCrmCombosCompleted] = useState<CrmProduct[]>([]);
  const [isLoadingCrmProducts, setIsLoadingCrmProducts] = useState(false);
  
  // Paginación para CRM completados
  const [completedPage, setCompletedPage] = useState(1);
  const [completedPagination, setCompletedPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  });
  
  // Paginación para CRM no completados
  const [notCompletedPage, setNotCompletedPage] = useState(1);
  const [notCompletedPagination, setNotCompletedPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  });
  
  // Paginación para combos
  const [combosPage, setCombosPage] = useState(1);
  const [combosPagination, setCombosPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  });
  
  // Paginación para combos completados
  const [combosCompletedPage, setCombosCompletedPage] = useState(1);
  const [combosCompletedPagination, setCombosCompletedPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  });
  
  // Estados para items expandidos de combos
  const [expandedCombos, setExpandedCombos] = useState<Set<string>>(new Set());
  
  // Búsqueda
  const [searchCompleted, setSearchCompleted] = useState("");
  const [searchNotCompleted, setSearchNotCompleted] = useState("");
  const [searchCombos, setSearchCombos] = useState("");
  const [searchCombosCompleted, setSearchCombosCompleted] = useState("");

  // Obtener solo categorías principales (sin parent_id)
  const mainCategories = categories.filter(cat => !cat.parent_id);

  // Obtener subcategorías de una categoría
  const getSubcategories = (categoryId: string) => {
    return categories.filter(cat => cat.parent_id === categoryId);
  };

  // Toggle expandir/colapsar categoría
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Función para refrescar categorías desde el backend (DB)
  const refreshCategories = async () => {
    try {
      setIsLoadingCategories(true);
      // Siempre obtener desde la base de datos
      const freshCategories = await fetchCategoriesClient(true);
      setCategories(freshCategories.map(cat => convertBackendCategoryToLocal(cat, freshCategories)));
    } catch (error) {
      console.error("Error refreshing categories:", error);
      setCategories([]); // En caso de error, limpiar el estado
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Función para refrescar productos CRM completados
  const refreshCrmProductsCompleted = async (page: number = 1) => {
    try {
      setIsLoadingCrmProducts(true);
      const result = await fetchCrmProducts({ 
        status: 'completed', 
        combo: false, 
        search: searchCompleted,
        page, 
        per_page: 10 
      });
      setCrmProductsCompleted(result.products);
      setCompletedPagination(result.pagination);
      setCompletedPage(page);
    } catch (error) {
      console.error("Error refreshing CRM products completed:", error);
      setCrmProductsCompleted([]);
    } finally {
      setIsLoadingCrmProducts(false);
    }
  };
  
  // Función para refrescar productos CRM no completados
  const refreshCrmProductsNotCompleted = async (page: number = 1) => {
    try {
      setIsLoadingCrmProducts(true);
      const result = await fetchCrmProducts({ 
        status: 'not_completed', 
        combo: false, 
        search: searchNotCompleted,
        page, 
        per_page: 10 
      });
      setCrmProductsNotCompleted(result.products);
      setNotCompletedPagination(result.pagination);
      setNotCompletedPage(page);
    } catch (error) {
      console.error("Error refreshing CRM products not completed:", error);
      setCrmProductsNotCompleted([]);
    } finally {
      setIsLoadingCrmProducts(false);
    }
  };
  
  // Función para refrescar combos (no completados)
  const refreshCrmCombos = async (page: number = 1) => {
    try {
      setIsLoadingCrmProducts(true);
      const result = await fetchCrmCombos({ 
        search: searchCombos,
        page, 
        per_page: 10 
      });
      setCrmCombos(result.combos);
      setCombosPagination(result.pagination);
      setCombosPage(page);
    } catch (error) {
      console.error("Error refreshing CRM combos:", error);
      setCrmCombos([]);
    } finally {
      setIsLoadingCrmProducts(false);
    }
  };

  // Función para refrescar combos completados
  const refreshCrmCombosCompleted = async (page: number = 1) => {
    try {
      setIsLoadingCrmProducts(true);
      const result = await fetchCrmProducts({ 
        status: 'completed',
        combo: true,
        search: searchCombosCompleted,
        page, 
        per_page: 10 
      });
      setCrmCombosCompleted(result.products);
      setCombosCompletedPagination(result.pagination);
      setCombosCompletedPage(page);
    } catch (error) {
      console.error("Error refreshing CRM combos completed:", error);
      setCrmCombosCompleted([]);
    } finally {
      setIsLoadingCrmProducts(false);
    }
  };
  
  // Función para refrescar todos (usado al montar)
  const refreshCrmProducts = async () => {
    await Promise.all([
      refreshCrmProductsCompleted(1),
      refreshCrmProductsNotCompleted(1),
      refreshCrmCombos(1),
      refreshCrmCombosCompleted(1)
    ]);
  };
  
  // Toggle expandir/colapsar combo
  const toggleCombo = (comboId: string) => {
    setExpandedCombos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(comboId)) {
        newSet.delete(comboId);
      } else {
        newSet.add(comboId);
      }
      return newSet;
    });
  };

  // Fetch categorías desde la DB al montar el componente
  useEffect(() => {
    refreshCategories();
    refreshCrmProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar - siempre desde DB

  // Refrescar cuando cambia la búsqueda
  useEffect(() => {
    if (activeTab === "crm-completados") {
      refreshCrmProductsCompleted(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCompleted]);

  useEffect(() => {
    if (activeTab === "crm-no-completados") {
      refreshCrmProductsNotCompleted(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchNotCompleted]);

  useEffect(() => {
    if (activeTab === "combos") {
      refreshCrmCombos(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCombos]);

  useEffect(() => {
    if (activeTab === "combos-completados") {
      refreshCrmCombosCompleted(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCombosCompleted]);

  // Función para manejar la creación de categorías
  const handleCategoryCreated = async (newCategory: {
    id: string;
    nombre: string;
    tipo: "Categoría" | "Subcategoría";
    categoriaPadre?: string;
    parentId?: string;
    opciones?: string[];
  }) => {
    // Refrescar las categorías desde el backend
    await refreshCategories();
    setRefreshKey(prev => prev + 1);
  };

  // Función para manejar la visualización de producto
  const handleViewProduct = async (crmProduct: CrmProduct | CrmCombo) => {
    setViewingCrmProduct(crmProduct);
    setViewingProductData(null);
    
    // Si el producto está completado, cargar los datos completos
    if (crmProduct.product_id) {
      setIsLoadingViewingProduct(true);
      try {
        const fullProduct = await fetchProductById(crmProduct.product_id);
        setViewingProductData(fullProduct);
      } catch (error) {
        console.error("Error loading product data:", error);
      } finally {
        setIsLoadingViewingProduct(false);
      }
    }
  };


  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Productos" 
        description="Gestiona tu catálogo de productos y categorías" 
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("crm-no-completados");
            refreshCrmProductsNotCompleted(notCompletedPage);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "crm-no-completados"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          No Completados
        </button>
        <button
          onClick={() => {
            setActiveTab("crm-completados");
            refreshCrmProductsCompleted(completedPage);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "crm-completados"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Productos Completados
        </button>
        <button
          onClick={() => {
            setActiveTab("combos");
            refreshCrmCombos(combosPage);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "combos"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Combos
        </button>
        <button
          onClick={() => {
            setActiveTab("combos-completados");
            refreshCrmCombosCompleted(combosCompletedPage);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "combos-completados"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Combos Completados
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "categorias"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Categorías / Subcategorías
        </button>
      </div>

      {/* Productos Completados Tab */}
      {activeTab === "crm-completados" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Productos Completados</h2>
            <button
              onClick={() => refreshCrmProductsCompleted(completedPage)}
              className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: '#155DFC' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refrescar
            </button>
          </div>
          
          {/* Búsqueda */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID CRM, descripción o nombre del producto..."
                value={searchCompleted}
                onChange={(e) => setSearchCompleted(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            {isLoadingCrmProducts ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando productos...</h3>
              </div>
            ) : crmProductsCompleted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <PackageSearch className="w-20 h-20 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay productos completados</h3>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID CRM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {crmProductsCompleted.map((crmProduct) => (
                        <tr key={crmProduct.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{crmProduct.crm_product_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{crmProduct.description || crmProduct.alt_description || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{crmProduct.product_name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleViewProduct(crmProduct)}
                                className="text-green-600 hover:text-green-800 transition-colors cursor-pointer"
                                title="Visualizar producto"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCrmProduct(crmProduct);
                                  setIsProductModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                title="Editar producto"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {completedPagination.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => refreshCrmProductsCompleted(completedPage - 1)}
                      disabled={!completedPagination.has_prev}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: completedPagination.has_prev ? '#155DFC' : undefined }}
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      Página {completedPagination.page} de {completedPagination.pages}
                    </span>
                    <button
                      onClick={() => refreshCrmProductsCompleted(completedPage + 1)}
                      disabled={!completedPagination.has_next}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: completedPagination.has_next ? '#155DFC' : undefined }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* CRM No Completados Tab */}
      {activeTab === "crm-no-completados" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Productos No Completados</h2>
                <button
              onClick={() => refreshCrmProductsNotCompleted(notCompletedPage)}
              className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
                  style={{ backgroundColor: '#155DFC' }}
                >
              <RefreshCw className="w-4 h-4" />
              Refrescar
                </button>
          </div>
          
          {/* Búsqueda */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID CRM o descripción..."
                value={searchNotCompleted}
                onChange={(e) => setSearchNotCompleted(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            {isLoadingCrmProducts ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando productos...</h3>
              </div>
            ) : crmProductsNotCompleted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <PackageSearch className="w-20 h-20 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay productos sin completar</h3>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID CRM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {crmProductsNotCompleted.map((crmProduct) => (
                        <tr key={crmProduct.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{crmProduct.crm_product_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{crmProduct.description || crmProduct.alt_description || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingCrmProduct(crmProduct);
                                setIsProductModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {notCompletedPagination.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => refreshCrmProductsNotCompleted(notCompletedPage - 1)}
                      disabled={!notCompletedPagination.has_prev}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: notCompletedPagination.has_prev ? '#155DFC' : undefined }}
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      Página {notCompletedPagination.page} de {notCompletedPagination.pages}
                    </span>
                    <button
                      onClick={() => refreshCrmProductsNotCompleted(notCompletedPage + 1)}
                      disabled={!notCompletedPagination.has_next}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: notCompletedPagination.has_next ? '#155DFC' : undefined }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Combos Completados Tab */}
      {activeTab === "combos-completados" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Combos Completados</h2>
            <button
              onClick={() => refreshCrmCombosCompleted(combosCompletedPage)}
              className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: '#155DFC' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refrescar
            </button>
          </div>
          
          {/* Búsqueda */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID CRM, descripción o nombre del combo..."
                value={searchCombosCompleted}
                onChange={(e) => setSearchCombosCompleted(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            {isLoadingCrmProducts ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando combos...</h3>
              </div>
            ) : crmCombosCompleted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <PackageSearch className="w-20 h-20 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay combos completados</h3>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID CRM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Combo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {crmCombosCompleted.map((combo) => (
                        <tr key={combo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{combo.crm_product_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{combo.description || combo.alt_description || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{combo.product_name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleViewProduct(combo)}
                                className="text-green-600 hover:text-green-800 transition-colors cursor-pointer"
                                title="Visualizar combo"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCrmProduct(combo);
                                  setIsProductModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                title="Editar combo"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                
                {/* Paginación */}
                {combosCompletedPagination.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => refreshCrmCombosCompleted(combosCompletedPage - 1)}
                      disabled={!combosCompletedPagination.has_prev}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: combosCompletedPagination.has_prev ? '#155DFC' : undefined }}
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      Página {combosCompletedPagination.page} de {combosCompletedPagination.pages}
                    </span>
                    <button
                      onClick={() => refreshCrmCombosCompleted(combosCompletedPage + 1)}
                      disabled={!combosCompletedPagination.has_next}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: combosCompletedPagination.has_next ? '#155DFC' : undefined }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Combos Tab */}
      {activeTab === "combos" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Combos</h2>
            <button
              onClick={() => refreshCrmCombos(combosPage)}
              className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: '#155DFC' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refrescar
            </button>
          </div>
          
          {/* Búsqueda */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID CRM, descripción o nombre del producto..."
                value={searchCombos}
                onChange={(e) => setSearchCombos(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            {isLoadingCrmProducts ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando combos...</h3>
              </div>
            ) : crmCombos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <PackageSearch className="w-20 h-20 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay combos</h3>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID CRM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {crmCombos.map((combo) => {
                        const isExpanded = expandedCombos.has(combo.id);
                        return (
                          <React.Fragment key={combo.id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{combo.crm_product_id}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{combo.description || combo.alt_description || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                <button
                                  onClick={() => toggleCombo(combo.id)}
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                                >
                                  {combo.items?.length || 0} items
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {combo.is_completed ? (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Completado</span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => {
                                    setEditingCrmProduct(combo);
                                    setIsProductModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                            {isExpanded && combo.items && combo.items.length > 0 && (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                  <div className="ml-8 space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items del combo:</h4>
                                    <div className="space-y-1">
                                      {combo.items.map((item, idx) => (
                                        <div key={idx} className="text-sm text-gray-600">
                                          • {item.quantity}x {item.item_name || `ID: ${item.crm_product_id}`} {item.item_description && `- ${item.item_description}`}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {combosPagination.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => refreshCrmCombos(combosPage - 1)}
                      disabled={!combosPagination.has_prev}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: combosPagination.has_prev ? '#155DFC' : undefined }}
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      Página {combosPagination.page} de {combosPagination.pages}
                    </span>
                    <button
                      onClick={() => refreshCrmCombos(combosPage + 1)}
                      disabled={!combosPagination.has_next}
                      className="px-4 py-2 text-sm font-medium text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300"
                      style={{ backgroundColor: combosPagination.has_next ? '#155DFC' : undefined }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "categorias" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Categorías y Subcategorías</h2>
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer" 
              style={{ backgroundColor: '#155DFC' }}
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </div>

          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            {isLoadingCategories ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Cargando categorías...
                </h3>
                <p className="text-gray-500 text-center">
                  Obteniendo datos desde la base de datos
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-100 rounded-full opacity-20 blur-2xl"></div>
                  <FolderX className="w-20 h-20 text-gray-400 relative" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay categorías aún
                </h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Organiza tu catálogo creando categorías y subcategorías. Esto te ayudará a estructurar mejor tus productos y facilitar su gestión.
                </p>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-6 py-3 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                  style={{ backgroundColor: '#155DFC' }}
                >
                  <Sparkles className="w-5 h-5" />
                  Crear primera categoría
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Categoría Padre
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Subcategorías
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mainCategories.map((category) => {
                      const subcategories = getSubcategories(category.id);
                      const isExpanded = expandedCategories.has(category.id);
                      const hasSubcategories = subcategories.length > 0;
                      
                      return [
                        // Categoría principal
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {hasSubcategories && (
                                <button
                                  onClick={() => toggleCategory(category.id)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                              )}
                              {!hasSubcategories && <div className="w-6" />}
                              <FolderTree className="w-4 h-4 text-gray-400" />
                              {category.nombre || category.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Categoría
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {category.productos || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {category.subcategorias || subcategories.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                            <div className="flex items-center gap-3 justify-center">
                              <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
                                <Edit className="w-5 h-5" />
                              </button>
                              <button className="text-red-600 hover:text-red-800 transition-colors cursor-pointer">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>,
                        // Subcategorías (mostrar solo si está expandido)
                        ...(isExpanded ? subcategories.map((subcategory) => (
                          <tr key={`${category.id}-${subcategory.id}`} className="hover:bg-gray-50 bg-gray-50/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                              <div className="flex items-center gap-2 pl-8">
                                <div className="w-6" />
                                <FolderTree className="w-4 h-4 text-gray-400" />
                                {subcategory.nombre || subcategory.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                Subcategoría
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {category.nombre || category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {subcategory.productos || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                              <div className="flex items-center gap-3 justify-center">
                                <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button className="text-red-600 hover:text-red-800 transition-colors cursor-pointer">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : [])
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        categories={categories.filter(cat => (cat.tipo || (cat.parent_id ? "Subcategoría" : "Categoría")) === "Categoría").map(cat => ({
          id: cat.id,
          name: cat.nombre || cat.name,
          parent_id: cat.parentId || cat.parent_id,
        }))}
      />
      <CreateProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingCrmProduct(null);
        }}
        onSuccess={async () => {
          await refreshCategories();
          await refreshCrmProducts();
          setRefreshKey((prev) => prev + 1);
          setEditingCrmProduct(null);
        }}
        crmProduct={editingCrmProduct}
        categories={categories.map(cat => ({
          id: cat.id,
          nombre: cat.nombre || cat.name || "",
          tipo: (cat.tipo || (cat.parent_id ? "Subcategoría" : "Categoría")) as "Categoría" | "Subcategoría",
          productos: cat.productos || 0,
          subcategorias: cat.subcategorias,
          categoriaPadre: cat.categoriaPadre || cat.parent_name,
          parentId: cat.parentId || cat.parent_id,
          opciones: cat.opciones || [],
        }))}
      />

      {/* Product View Overlay */}
      {viewingCrmProduct && (
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto border-l border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {viewingCrmProduct.combo ? 'Detalles del Combo' : 'Detalles del Producto'}
              </h2>
              <button
                onClick={() => {
                  setViewingCrmProduct(null);
                  setViewingProductData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingViewingProduct ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Cargando información del producto...</p>
                </div>
              ) : (
                <>
                  {/* Información del CRM Product */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del CRM</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">ID CRM:</span>
                        <span className="text-sm text-gray-900">{viewingCrmProduct.crm_product_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Estado:</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          viewingCrmProduct.is_completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {viewingCrmProduct.is_completed ? 'Completado' : 'Pendiente'}
                        </span>
                      </div>
                      {viewingCrmProduct.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 block mb-1">Descripción:</span>
                          <span className="text-sm text-gray-900">{viewingCrmProduct.description}</span>
                        </div>
                      )}
                      {viewingCrmProduct.alt_description && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 block mb-1">Descripción Alternativa:</span>
                          <span className="text-sm text-gray-900">{viewingCrmProduct.alt_description}</span>
                        </div>
                      )}
                      {viewingCrmProduct.price_sale && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Precio Venta:</span>
                          <span className="text-sm text-gray-900">${viewingCrmProduct.price_sale.toLocaleString()}</span>
                        </div>
                      )}
                      {viewingCrmProduct.commission && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Comisión:</span>
                          <span className="text-sm text-gray-900">{viewingCrmProduct.commission}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información del Producto Completo (si está completado) */}
                  {viewingCrmProduct.is_completed && viewingCrmProduct.product_id && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Información del Producto</h3>
                        <button
                          onClick={() => window.open(`/productos/${viewingCrmProduct.product_id}`, '_blank')}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ backgroundColor: '#155DFC' }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver Página del Producto
                        </button>
                      </div>
                      
                      {viewingProductData ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600 block mb-1">Nombre:</span>
                            <span className="text-sm text-gray-900">{viewingProductData.name}</span>
                          </div>
                          {viewingProductData.description && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-1">Descripción:</span>
                              <span className="text-sm text-gray-900">{viewingProductData.description}</span>
                            </div>
                          )}
                          {viewingProductData.category_name && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600">Categoría:</span>
                              <span className="text-sm text-gray-900">{viewingProductData.category_name}</span>
                            </div>
                          )}
                          {viewingProductData.sku && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600">SKU:</span>
                              <span className="text-sm text-gray-900">{viewingProductData.sku}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Estado:</span>
                            <span className={`text-sm px-2 py-1 rounded ${
                              viewingProductData.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {viewingProductData.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          
                          {/* Precios */}
                          {(viewingProductData.min_price || viewingProductData.max_price) && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">Rango de Precios:</span>
                              <div className="space-y-1">
                                {viewingProductData.min_price && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Precio Mínimo:</span>
                                    <span className="text-sm font-medium text-gray-900">${viewingProductData.min_price.toLocaleString()}</span>
                                  </div>
                                )}
                                {viewingProductData.max_price && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Precio Máximo:</span>
                                    <span className="text-sm font-medium text-gray-900">${viewingProductData.max_price.toLocaleString()}</span>
                                  </div>
                                )}
                                {viewingProductData.price_range && (
                                  <div className="text-sm text-gray-600">{viewingProductData.price_range}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Imágenes */}
                          {viewingProductData.images && viewingProductData.images.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">Imágenes ({viewingProductData.images.length}):</span>
                              <div className="grid grid-cols-3 gap-2">
                                {viewingProductData.images.slice(0, 6).map((img, idx) => (
                                  <div key={idx} className="relative aspect-square rounded overflow-hidden bg-gray-100">
                                    <img 
                                      src={img.image_url} 
                                      alt={img.alt_text || `Imagen ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Información Técnica */}
                          {(viewingProductData as any).technical_description && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-1">Descripción Técnica:</span>
                              <span className="text-sm text-gray-900 whitespace-pre-wrap">{(viewingProductData as any).technical_description}</span>
                            </div>
                          )}

                          {/* Garantía */}
                          {((viewingProductData as any).warranty_months || (viewingProductData as any).warranty_description) && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">Garantía:</span>
                              <div className="space-y-1">
                                {(viewingProductData as any).warranty_months && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Meses:</span>
                                    <span className="text-sm text-gray-900">{(viewingProductData as any).warranty_months} meses</span>
                                  </div>
                                )}
                                {(viewingProductData as any).warranty_description && (
                                  <div>
                                    <span className="text-sm text-gray-900 whitespace-pre-wrap">{(viewingProductData as any).warranty_description}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Materiales */}
                          {(viewingProductData as any).materials && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-1">Materiales:</span>
                              <span className="text-sm text-gray-900 whitespace-pre-wrap">{(viewingProductData as any).materials}</span>
                            </div>
                          )}

                          {/* Información de Colchón */}
                          {((viewingProductData as any).filling_type || 
                            (viewingProductData as any).max_supported_weight_kg || 
                            (viewingProductData as any).has_pillow_top !== undefined || 
                            (viewingProductData as any).is_bed_in_box !== undefined || 
                            (viewingProductData as any).mattress_firmness || 
                            (viewingProductData as any).size_label) && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">Información del Colchón:</span>
                              <div className="space-y-1">
                                {(viewingProductData as any).filling_type && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Tipo de Relleno:</span>
                                    <span className="text-sm text-gray-900">{(viewingProductData as any).filling_type}</span>
                                  </div>
                                )}
                                {(viewingProductData as any).max_supported_weight_kg && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Peso Máximo Soportado:</span>
                                    <span className="text-sm text-gray-900">{(viewingProductData as any).max_supported_weight_kg} kg</span>
                                  </div>
                                )}
                                {(viewingProductData as any).has_pillow_top !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Con Pillow Top:</span>
                                    <span className="text-sm text-gray-900">{(viewingProductData as any).has_pillow_top ? 'Sí' : 'No'}</span>
                                  </div>
                                )}
                                {(viewingProductData as any).is_bed_in_box !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Bed in Box:</span>
                                    <span className="text-sm text-gray-900">{(viewingProductData as any).is_bed_in_box ? 'Sí' : 'No'}</span>
                                  </div>
                                )}
                                {(viewingProductData as any).mattress_firmness && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Firmeza:</span>
                                    <span className="text-sm text-gray-900">{(viewingProductData as any).mattress_firmness}</span>
                                  </div>
                                )}
                                {(viewingProductData as any).size_label && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Etiqueta de Tamaño:</span>
                                    <span className="text-sm text-gray-900">{(viewingProductData as any).size_label}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Variantes */}
                          {viewingProductData.variants && viewingProductData.variants.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-2">Variantes ({viewingProductData.variants.length}):</span>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {viewingProductData.variants.map((variant, idx) => (
                                  <div key={variant.id || idx} className="bg-white rounded p-3 border border-gray-200">
                                    {variant.name && (
                                      <div className="font-medium text-sm text-gray-900 mb-1">{variant.name}</div>
                                    )}
                                    {variant.sku && (
                                      <div className="text-xs text-gray-600 mb-1">SKU: {variant.sku}</div>
                                    )}
                                    {variant.stock !== undefined && (
                                      <div className="text-xs text-gray-600 mb-1">Stock: {variant.stock}</div>
                                    )}
                                    {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                                      <div className="text-xs text-gray-600 mb-1">
                                        Atributos: {Object.entries(variant.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                      </div>
                                    )}
                                    {variant.prices && variant.prices.length > 0 && (
                                      <div className="text-xs text-gray-600">
                                        Precios: {variant.prices.map(p => `${p.locality_name || p.locality_id}: $${p.price.toLocaleString()}`).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
                          No se pudieron cargar los datos completos del producto
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items del Combo (si es combo) */}
                  {viewingCrmProduct.combo && 'items' in viewingCrmProduct && viewingCrmProduct.items && viewingCrmProduct.items.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Items del Combo</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {viewingCrmProduct.items.map((item, idx) => (
                          <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm text-gray-900">
                                  {item.item_name || `Producto ${item.crm_product_id}`}
                                </div>
                                {item.item_description && (
                                  <div className="text-xs text-gray-600 mt-1">{item.item_description}</div>
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.quantity}x
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
      )}
    </div>
  );
}

