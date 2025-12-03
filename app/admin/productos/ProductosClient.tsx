"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Edit, Trash2, FolderTree, Package, PackageSearch, FolderX, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import CreateCategoryModal from "@/components/CreateCategoryModal";
import CreateProductModal from "@/components/CreateProductModal";
import { Category } from "@/lib/api";
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
  const [activeTab, setActiveTab] = useState<"productos" | "categorias">("productos");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Estado local para categorías - siempre desde la DB, nunca localStorage
  const [categories, setCategories] = useState<CategoryFromBackend[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

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

  // Fetch categorías desde la DB al montar el componente
  useEffect(() => {
    refreshCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar - siempre desde DB

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

  const products = [
    {
      producto: "Colchón Fénix",
      modelo: "Fénix",
      stock: 45,
      stockColor: "green",
      solo: "$38,000",
      masBase: "$52,000",
      completo: "$68,000",
      estados: ["Promo", "Billetera"],
    },
    {
      producto: "Colchón Perla",
      modelo: "Perla",
      stock: 18,
      stockColor: "orange",
      solo: "$32,000",
      masBase: "$45,000",
      completo: "$58,000",
      estados: [],
    },
    {
      producto: "Colchón Diamante",
      modelo: "Diamante",
      stock: 67,
      stockColor: "green",
      solo: "$45,000",
      masBase: "$62,000",
      completo: "$78,000",
      estados: ["Promo Billetera"],
    },
    {
      producto: "Base Premium",
      modelo: "Base",
      stock: 32,
      stockColor: "green",
      solo: "$18,000",
      masBase: "-",
      completo: "-",
      estados: ["Billetera"],
    },
  ];

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Productos" 
        description="Gestiona tu catálogo de productos y categorías" 
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("productos")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "productos"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Lista de Productos
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "categorias"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Categorías / Subcategorías
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "productos" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Productos</h2>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: '#155DFC' }}
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>

          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl"></div>
                  <PackageSearch className="w-20 h-20 text-gray-400 relative" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay productos aún
                </h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Comienza a construir tu catálogo agregando tu primer producto. Puedes organizarlos por categorías y gestionar stock y precios.
                </p>
                <button
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-6 py-3 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                  style={{ backgroundColor: '#155DFC' }}
                >
                  <Plus className="w-5 h-5" />
                  Crear primer producto
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Modelo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Solo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        + Base
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Completo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Estados
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {product.producto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                          {product.modelo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center" style={{ color: product.stockColor === 'green' ? '#10B981' : '#F59E0B' }}>
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                          {product.solo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                          {product.masBase}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                          {product.completo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {product.estados.map((estado, idx) => {
                              if (estado === "Promo") {
                                return (
                                  <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                    Promo
                                  </span>
                                );
                              } else if (estado === "Billetera") {
                                return (
                                  <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                    Billetera
                                  </span>
                                );
                              } else if (estado === "Promo Billetera") {
                                return (
                                  <div key={idx} className="flex gap-1">
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                      Promo
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                      Billetera
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
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
                    ))}
                  </tbody>
                </table>
              </div>
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
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={async () => {
          await refreshCategories();
          setRefreshKey((prev) => prev + 1);
        }}
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
    </div>
  );
}

