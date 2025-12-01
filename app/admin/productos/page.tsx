"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import CreateCategoryModal from "@/components/CreateCategoryModal";

export default function Productos() {
  const [activeTab, setActiveTab] = useState<"productos" | "categorias">("productos");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const categories = [
    {
      nombre: "Colchones",
      tipo: "Categoría",
      productos: 12,
      subcategorias: 3,
    },
    {
      nombre: "Bases",
      tipo: "Categoría",
      productos: 5,
      subcategorias: 2,
    },
    {
      nombre: "Colchones Premium",
      tipo: "Subcategoría",
      productos: 8,
      categoriaPadre: "Colchones",
    },
    {
      nombre: "Colchones Estándar",
      tipo: "Subcategoría",
      productos: 4,
      categoriaPadre: "Colchones",
    },
    {
      nombre: "Bases Ajustables",
      tipo: "Subcategoría",
      productos: 3,
      categoriaPadre: "Bases",
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
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "productos"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Lista de Productos
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
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
          </div>

          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
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
                  {categories.map((category, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <FolderTree className="w-4 h-4 text-gray-400" />
                          {category.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          category.tipo === 'Categoría' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {category.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {category.categoriaPadre || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {category.productos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {category.subcategorias || "-"}
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
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </div>
  );
}
