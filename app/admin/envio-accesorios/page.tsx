"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { Save, PackageX } from "lucide-react";
import { fetchCatalogs, updateCatalog, type Catalog } from "@/lib/api";

const PAIS_CATALOG_ID = "8335e521-f25a-4f92-8f59-c4439671ef26";

export default function EnvioAccesoriosPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [priceByCatalog, setPriceByCatalog] = useState<Record<string, string>>({});
  const [savingCatalogId, setSavingCatalogId] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const catalogsData = await fetchCatalogs();
      setCatalogs(catalogsData.filter((c) => c.id !== PAIS_CATALOG_ID));

      const initialPrice: Record<string, string> = {};
      catalogsData.forEach((catalog) => {
        initialPrice[catalog.id] = catalog.accessories_shipping_price?.toString() ?? "";
      });
      setPriceByCatalog(initialPrice);
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
    const raw = priceByCatalog[catalog.id]?.trim() ?? "";
    const price = raw ? parseFloat(raw) : null;

    if (raw && isNaN(price as number)) {
      alert("El precio debe ser un número válido");
      return;
    }
    if (price !== null && price < 0) {
      alert("El precio no puede ser negativo");
      return;
    }

    try {
      setSavingCatalogId(catalog.id);
      await updateCatalog(catalog.id, { accessories_shipping_price: price });
      await refreshData();
    } catch (error) {
      console.error("Error saving accessories shipping price:", error);
      alert(error instanceof Error ? error.message : "Error al guardar el precio de envío");
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
        title="Envío Accesorios por Catálogo"
        description="Envío acordado por catálogo (zona local, reparto propio, no tercerizado) cuando el carrito contiene únicamente productos de la categoría Almohadas y accesorios. El catálogo País no aplica."
      />

      <div className="mt-6">
        {catalogs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-[14px] p-8 text-center shadow-sm">
            <PackageX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                      Precio ($)
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceByCatalog[catalog.id] ?? ""}
                        onChange={(e) =>
                          setPriceByCatalog((prev) => ({ ...prev, [catalog.id]: e.target.value }))
                        }
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all"
                        placeholder="0.00"
                      />
                    </label>
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
