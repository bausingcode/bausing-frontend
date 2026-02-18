"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { Save, PackageX } from "lucide-react";
import { 
  fetchDeliveryZones, 
  fetchZoneLocalities, 
  updateZoneLocality,
  bulkUpdateZoneLocalities,
  type DeliveryZone,
  type ZoneLocality 
} from "@/lib/api";

export default function ZonasEntregaPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneLocalities, setZoneLocalities] = useState<ZoneLocality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());
  const [editingLocality, setEditingLocality] = useState<string | null>(null);
  const [editingThirdParty, setEditingThirdParty] = useState<boolean>(false);
  const [editingShippingPrice, setEditingShippingPrice] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Cargar zonas y localidades
  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [zonesData, localitiesData] = await Promise.all([
        fetchDeliveryZones(),
        fetchZoneLocalities()
      ]);
      setZones(zonesData);
      setZoneLocalities(localitiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert(error instanceof Error ? error.message : "Error al cargar los datos");
    } finally {
      setIsLoading(false);
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

  const startEdit = (locality: ZoneLocality) => {
    setEditingLocality(locality.id);
    setEditingThirdParty(locality.is_third_party_transport);
    setEditingShippingPrice(locality.shipping_price?.toString() || "");
  };

  const cancelEdit = () => {
    setEditingLocality(null);
    setEditingThirdParty(false);
    setEditingShippingPrice("");
  };

  const saveLocality = async (localityId: string) => {
    try {
      setIsSaving(true);
      
      const shippingPrice = editingShippingPrice.trim() 
        ? parseFloat(editingShippingPrice) 
        : null;
      
      if (isNaN(shippingPrice as number) && shippingPrice !== null) {
        alert("El precio de envío debe ser un número válido");
        return;
      }
      
      await updateZoneLocality(localityId, {
        is_third_party_transport: editingThirdParty,
        shipping_price: shippingPrice
      });
      
      await refreshData();
      cancelEdit();
    } catch (error) {
      console.error("Error saving locality:", error);
      alert(error instanceof Error ? error.message : "Error al guardar la localidad");
    } finally {
      setIsSaving(false);
    }
  };

  const getLocalitiesForZone = (crmZoneId: number): ZoneLocality[] => {
    return zoneLocalities.filter(zl => zl.crm_zone_id === crmZoneId);
  };

  if (isLoading) {
    return <Loader message="Cargando zonas de entrega..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Transporte Tercerizado" 
        description="Configura las localidades con transporte tercerizado y sus precios de envío" 
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
              {zones.map((zone) => {
                const localities = getLocalitiesForZone(zone.crm_zone_id);
                const isExpanded = expandedZones.has(zone.crm_zone_id);
                
                return (
                  <div key={zone.id} className="transition-all duration-200">
                    <button
                      onClick={() => toggleZone(zone.crm_zone_id)}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                          {zone.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {localities.length}
                        </span>
                        {localities.filter(l => l.is_third_party_transport).length > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full shadow-sm">
                            {localities.filter(l => l.is_third_party_transport).length} tercerizado
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-gradient-to-b from-gray-50/50 to-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        {localities.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-4 px-3">
                            No hay localidades asociadas
                          </p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {localities.map((locality) => {
                              const isEditing = editingLocality === locality.id;
                              
                              return (
                                <div
                                  key={locality.id}
                                  className={`p-3.5 transition-all duration-200 ${
                                    locality.is_third_party_transport
                                      ? "bg-gradient-to-r from-orange-50/60 to-orange-50/30 border-l-2 border-orange-300"
                                      : "bg-white hover:bg-gray-50/50"
                                  }`}
                                >
                                  {isEditing ? (
                                    <div className="space-y-3 animate-in fade-in duration-200">
                                      <div className="text-xs font-semibold text-gray-800 mb-2">
                                        {locality.locality_name || `Localidad ${locality.locality_id}`}
                                      </div>
                                      
                                      <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          checked={editingThirdParty}
                                          onChange={(e) => setEditingThirdParty(e.target.checked)}
                                          className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-2 focus:ring-[#00C1A7]/20 focus:ring-offset-1 transition-all"
                                        />
                                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                          Transporte tercerizado
                                        </span>
                                      </label>
                                      
                                      {editingThirdParty && (
                                        <div className="animate-in slide-in-from-top-1 duration-200">
                                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Precio de envío ($)
                                          </label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editingShippingPrice}
                                            onChange={(e) => setEditingShippingPrice(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all shadow-sm"
                                            placeholder="0.00"
                                            style={{ color: '#111827' }}
                                          />
                                        </div>
                                      )}
                                      
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={() => saveLocality(locality.id)}
                                          disabled={isSaving}
                                          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00C1A7] text-white rounded-lg text-xs font-medium hover:bg-[#00a892] transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                          {isSaving ? "Guardando..." : "Guardar"}
                                        </button>
                                        <button
                                          onClick={cancelEdit}
                                          disabled={isSaving}
                                          className="px-3.5 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between group/item">
                                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <span className="text-xs font-medium text-gray-900 truncate">
                                          {locality.locality_name || `Localidad ${locality.locality_id}`}
                                        </span>
                                        {locality.is_third_party_transport && (
                                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex-shrink-0 shadow-sm">
                                            Tercerizado
                                          </span>
                                        )}
                                        {locality.is_third_party_transport && locality.shipping_price !== null && (
                                          <span className="text-xs font-semibold text-gray-700 flex-shrink-0 bg-gray-100 px-2 py-0.5 rounded">
                                            ${locality.shipping_price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => startEdit(locality)}
                                        className="px-2.5 py-1.5 text-xs font-medium text-[#00C1A7] hover:bg-[#00C1A7]/10 rounded-lg transition-all duration-200 flex-shrink-0 opacity-0 group-hover/item:opacity-100"
                                      >
                                        Editar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
