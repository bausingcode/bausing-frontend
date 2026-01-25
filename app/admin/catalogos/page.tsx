"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Save, X, RefreshCw } from "lucide-react";
import { Catalog, fetchCatalogs, fetchLocalities, Locality, updateCatalogLocalities, createCatalog, updateCatalog, deleteCatalog } from "@/lib/api";

export default function CatalogosPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [allLocalities, setAllLocalities] = useState<Locality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCatalogs, setExpandedCatalogs] = useState<Set<string>>(new Set());
  const [editingCatalog, setEditingCatalog] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [selectedLocalities, setSelectedLocalities] = useState<Record<string, string[]>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState("");
  const [newCatalogDescription, setNewCatalogDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Cargar catálogos y localidades
  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [catalogsData, localitiesData] = await Promise.all([
        fetchCatalogs(true),
        fetchLocalities()
      ]);
      setCatalogs(catalogsData);
      setAllLocalities(localitiesData);
      
      // Inicializar selectedLocalities con las localidades actuales de cada catálogo
      const initialSelected: Record<string, string[]> = {};
      catalogsData.forEach(catalog => {
        initialSelected[catalog.id] = catalog.localities?.map(l => l.id) || [];
      });
      setSelectedLocalities(initialSelected);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleCatalog = (catalogId: string) => {
    setExpandedCatalogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(catalogId)) {
        newSet.delete(catalogId);
      } else {
        newSet.add(catalogId);
      }
      return newSet;
    });
  };

  const startEdit = (catalog: Catalog) => {
    setEditingCatalog(catalog.id);
    setEditingName(catalog.name);
    setEditingDescription(catalog.description || "");
    setSelectedLocalities(prev => ({
      ...prev,
      [catalog.id]: catalog.localities?.map(l => l.id) || []
    }));
  };

  const cancelEdit = () => {
    setEditingCatalog(null);
    setEditingName("");
    setEditingDescription("");
  };

  const saveCatalog = async (catalogId: string) => {
    try {
      setIsSaving(true);
      
      // Actualizar nombre y descripción
      await updateCatalog(catalogId, {
        name: editingName,
        description: editingDescription || undefined
      });
      
      // Actualizar localidades
      await updateCatalogLocalities(catalogId, selectedLocalities[catalogId] || []);
      
      // Refrescar datos
      await refreshData();
      cancelEdit();
    } catch (error) {
      console.error("Error saving catalog:", error);
      alert(error instanceof Error ? error.message : "Error al guardar el catálogo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCatalog = async (catalog: Catalog) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el catálogo "${catalog.name}"?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteCatalog(catalog.id);
      await refreshData();
    } catch (error) {
      console.error("Error deleting catalog:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar el catálogo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim()) {
      alert("El nombre del catálogo es requerido");
      return;
    }
    
    try {
      setIsSaving(true);
      await createCatalog({
        name: newCatalogName,
        description: newCatalogDescription || undefined
      });
      setNewCatalogName("");
      setNewCatalogDescription("");
      setShowCreateModal(false);
      await refreshData();
    } catch (error) {
      console.error("Error creating catalog:", error);
      alert(error instanceof Error ? error.message : "Error al crear el catálogo");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLocality = (catalogId: string, localityId: string) => {
    setSelectedLocalities(prev => {
      const current = prev[catalogId] || [];
      if (current.includes(localityId)) {
        return {
          ...prev,
          [catalogId]: current.filter(id => id !== localityId)
        };
      } else {
        return {
          ...prev,
          [catalogId]: [...current, localityId]
        };
      }
    });
  };

  const isLocalitySelected = (catalogId: string, localityId: string): boolean => {
    return (selectedLocalities[catalogId] || []).includes(localityId);
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Catálogos" 
        description="Gestiona los catálogos y sus localidades asociadas" 
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Catálogos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
            style={{ backgroundColor: '#155DFC' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refrescar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#155DFC' }}
          >
            <Plus className="w-4 h-4" />
            Nuevo Catálogo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando catálogos...</h3>
          </div>
        ) : catalogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay catálogos</h3>
            <p className="text-gray-500 mb-4">Crea tu primer catálogo para comenzar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: '#155DFC' }}
            >
              <Plus className="w-4 h-4" />
              Crear Catálogo
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {catalogs.map((catalog) => {
              const isExpanded = expandedCatalogs.has(catalog.id);
              const isEditing = editingCatalog === catalog.id;
              const catalogLocalities = catalog.localities || [];
              
              return (
                <div key={catalog.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleCatalog(catalog.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-3">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre del catálogo"
                          />
                          <input
                            type="text"
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Descripción (opcional)"
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{catalog.name}</h3>
                          {catalog.description && (
                            <p className="text-sm text-gray-500 mt-1">{catalog.description}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {catalogLocalities.length} localidad{catalogLocalities.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveCatalog(catalog.id)}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            style={{ backgroundColor: '#10b981' }}
                          >
                            <Save className="w-4 h-4" />
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(catalog)}
                            className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            title="Editar catálogo"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCatalog(catalog)}
                            className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                            title="Eliminar catálogo"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 ml-8">
                      {isEditing ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Seleccionar Localidades:</h4>
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-[6px] p-3 space-y-2">
                            {allLocalities.map((locality) => (
                              <label
                                key={locality.id}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={isLocalitySelected(catalog.id, locality.id)}
                                  onChange={() => toggleLocality(catalog.id, locality.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{locality.name}</span>
                                {locality.region && (
                                  <span className="text-xs text-gray-500">({locality.region})</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Localidades:</h4>
                          {catalogLocalities.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {catalogLocalities.map((locality) => (
                                <span
                                  key={locality.id}
                                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                                >
                                  {locality.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No hay localidades asignadas</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para crear nuevo catálogo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Catálogo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Córdoba Capital"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newCatalogDescription}
                  onChange={(e) => setNewCatalogDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción opcional"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCatalogName("");
                  setNewCatalogDescription("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCatalog}
                disabled={isSaving || !newCatalogName.trim()}
                className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#155DFC' }}
              >
                {isSaving ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
