"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { Save, Clock } from "lucide-react";
import { fetchCatalogs, updateCatalog, type Catalog } from "@/lib/api";

export default function DiasEntregaPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [minByCatalog, setMinByCatalog] = useState<Record<string, string>>({});
  const [maxByCatalog, setMaxByCatalog] = useState<Record<string, string>>({});
  const [savingCatalogId, setSavingCatalogId] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const catalogsData = await fetchCatalogs();
      setCatalogs(catalogsData);

      const initialMin: Record<string, string> = {};
      const initialMax: Record<string, string> = {};
      catalogsData.forEach((catalog) => {
        initialMin[catalog.id] = catalog.estimated_delivery_days_min?.toString() ?? "";
        initialMax[catalog.id] = catalog.estimated_delivery_days_max?.toString() ?? "";
      });
      setMinByCatalog(initialMin);
      setMaxByCatalog(initialMax);
    } catch (error) {
      console.error("Error loading catalogs:", error);
      alert(error instanceof Error ? error.message : "Error al cargar los catálogos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = async (catalog: Catalog) => {
    const minRaw = minByCatalog[catalog.id]?.trim() ?? "";
    const maxRaw = maxByCatalog[catalog.id]?.trim() ?? "";

    const min = minRaw ? parseInt(minRaw, 10) : null;
    const max = maxRaw ? parseInt(maxRaw, 10) : null;

    if ((minRaw && isNaN(min as number)) || (maxRaw && isNaN(max as number))) {
      alert("Los días estimados deben ser números enteros");
      return;
    }
    if (min !== null && min < 0) {
      alert("El mínimo de días no puede ser negativo");
      return;
    }
    if (min !== null && max !== null && min > max) {
      alert("El mínimo de días no puede ser mayor que el máximo");
      return;
    }

    try {
      setSavingCatalogId(catalog.id);
      await updateCatalog(catalog.id, {
        estimated_delivery_days_min: min,
        estimated_delivery_days_max: max,
      });
      await refreshData();
    } catch (error) {
      console.error("Error saving estimated delivery days:", error);
      alert(error instanceof Error ? error.message : "Error al guardar los días estimados de entrega");
    } finally {
      setSavingCatalogId(null);
    }
  };

  if (isLoading) {
    return <Loader message="Cargando catálogos..." />;
  }

  return (
    <div>
      <PageHeader
        title="Días Estimados de Entrega"
        description="Configura los días estimados de entrega por catálogo. Se muestran en el email de confirmación, en la pantalla de compra realizada y en el seguimiento de pedido."
      />

      <div className="mt-6">
        {catalogs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-[14px] p-8 text-center shadow-sm">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay catálogos disponibles</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {catalogs.map((catalog) => (
                <div key={catalog.id} className="p-3.5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{catalog.name}</p>
                    {catalog.description && (
                      <p className="text-xs text-gray-500 truncate">{catalog.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      Mín.
                      <input
                        type="number"
                        min="0"
                        value={minByCatalog[catalog.id] ?? ""}
                        onChange={(e) =>
                          setMinByCatalog((prev) => ({ ...prev, [catalog.id]: e.target.value }))
                        }
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all"
                        placeholder="-"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      Máx.
                      <input
                        type="number"
                        min="0"
                        value={maxByCatalog[catalog.id] ?? ""}
                        onChange={(e) =>
                          setMaxByCatalog((prev) => ({ ...prev, [catalog.id]: e.target.value }))
                        }
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all"
                        placeholder="-"
                      />
                    </label>
                    <span className="text-xs text-gray-500">días hábiles</span>
                    <button
                      onClick={() => handleSave(catalog)}
                      disabled={savingCatalogId === catalog.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C1A7] text-white rounded-lg text-xs font-medium hover:bg-[#00a892] transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingCatalogId === catalog.id ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
