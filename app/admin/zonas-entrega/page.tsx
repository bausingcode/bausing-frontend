"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { PackageX, Trash2 } from "lucide-react";
import {
  fetchDeliveryZones,
  fetchZoneLocalities,
  deleteDeliveryZone,
  setLocalityCatalog,
  fetchCatalogs,
  type DeliveryZone,
  type ZoneLocality,
  type Catalog
} from "@/lib/api";

export default function ZonasEntregaPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneLocalities, setZoneLocalities] = useState<ZoneLocality[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());
  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);
  const [savingCatalogFor, setSavingCatalogFor] = useState<string | null>(null);

  // Cargar zonas, localidades y catálogos
  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [zonesData, localitiesData, catalogsData] = await Promise.all([
        fetchDeliveryZones(),
        fetchZoneLocalities(),
        fetchCatalogs()
      ]);
      setZones(zonesData);
      setZoneLocalities(localitiesData);
      setCatalogs(catalogsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert(error instanceof Error ? error.message : "Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteZone = async (zone: DeliveryZone) => {
    if (!confirm(`¿Eliminar la zona "${zone.name}"? Esto borra la zona, sus localidades vinculadas y (si no están en uso en otro lado) las localidades mismas.`)) {
      return;
    }

    try {
      setDeletingZoneId(zone.crm_zone_id);
      const result = await deleteDeliveryZone(zone.crm_zone_id);
      await refreshData();

      if (result.localities_kept.length > 0) {
        alert(
          `Zona eliminada. Estas localidades no se borraron porque siguen en uso: ${result.localities_kept.join(", ")}`
        );
      }
    } catch (error) {
      console.error("Error deleting zone:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar la zona");
    } finally {
      setDeletingZoneId(null);
    }
  };

  const handleChangeCatalog = async (locality: ZoneLocality, catalogId: string) => {
    if (!catalogId || catalogId === locality.catalog_id) return;

    try {
      setSavingCatalogFor(locality.id);
      await setLocalityCatalog(locality.locality_id, catalogId);
      await refreshData();
    } catch (error) {
      console.error("Error changing catalog:", error);
      alert(error instanceof Error ? error.message : "Error al cambiar el catálogo");
    } finally {
      setSavingCatalogFor(null);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleZone = (crmZoneId: number) => {
    setExpandedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(crmZoneId)) {
        newSet.delete(crmZoneId);
      } else {
        newSet.add(crmZoneId);
      }
      return newSet;
    });
  };

  const getLocalitiesForZone = (crmZoneId: number): ZoneLocality[] => {
    return zoneLocalities.filter(zl => zl.crm_zone_id === crmZoneId && !zl.is_third_party_transport);
  };

  if (isLoading) {
    return <Loader message="Cargando zonas de entrega..." />;
  }

  return (
    <div>
      <PageHeader
        title="Zonas de Entrega"
        description="Gestiona las zonas de entrega y el catálogo de precios de cada localidad"
      />

      <div className="mt-6">
        {zones.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-[14px] p-8 text-center shadow-sm">
            <PackageX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay zonas de entrega disponibles</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {zones
                .filter((zone) => getLocalitiesForZone(zone.crm_zone_id).length > 0)
                .map((zone) => {
                const localities = getLocalitiesForZone(zone.crm_zone_id);
                const isExpanded = expandedZones.has(zone.crm_zone_id);

                return (
                  <div key={zone.id} className="transition-all duration-200">
                    <div className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 transition-all duration-200 group">
                      <button
                        onClick={() => toggleZone(zone.crm_zone_id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                      >
                        <span className={`text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                          {zone.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {localities.length}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone)}
                        disabled={deletingZoneId === zone.crm_zone_id}
                        title="Eliminar zona"
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="bg-gradient-to-b from-gray-50/50 to-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        {localities.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-4 px-3">
                            No hay localidades asociadas
                          </p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {localities.map((locality) => (
                              <div
                                key={locality.id}
                                className="p-3.5 bg-white hover:bg-gray-50/50 transition-all duration-200"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <span className="text-xs font-medium text-gray-900 truncate">
                                      {locality.locality_name || `Localidad ${locality.locality_id}`}
                                    </span>
                                  </div>
                                  <select
                                    value={locality.catalog_id || ""}
                                    onChange={(e) => handleChangeCatalog(locality, e.target.value)}
                                    disabled={savingCatalogFor === locality.id}
                                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white flex-shrink-0 max-w-[160px] focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all disabled:opacity-50"
                                  >
                                    <option value="" disabled>
                                      Sin catálogo
                                    </option>
                                    {catalogs.map((catalog) => (
                                      <option key={catalog.id} value={catalog.id}>
                                        {catalog.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
