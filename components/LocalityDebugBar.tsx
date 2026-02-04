"use client";

import { useState, useEffect } from "react";
import { useLocality } from "@/contexts/LocalityContext";
import { Locality } from "@/contexts/LocalityContext";
import { X, MapPin, RefreshCw } from "lucide-react";

export default function LocalityDebugBar() {
  const { locality, setLocality, detectLocality, isLoading } = useLocality();
  const [isOpen, setIsOpen] = useState(false);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [simulatedIp, setSimulatedIp] = useState("190.103.220.157");
  
  // Sincronizar con localStorage para asegurar que el estado se actualice después del reload
  useEffect(() => {
    const checkLocalStorage = () => {
      const savedLocality = localStorage.getItem("bausing_locality");
      if (savedLocality) {
        try {
          const parsedLocality = JSON.parse(savedLocality);
          // Si hay una localidad guardada y es diferente a la actual, actualizarla
          if (parsedLocality && (!locality || parsedLocality.id !== locality.id)) {
            console.log("[LocalityDebugBar] Sincronizando localidad desde localStorage:", parsedLocality);
            setLocality(parsedLocality);
          }
        } catch (e) {
          console.error("Error parsing saved locality in debug bar:", e);
        }
      }
    };
    
    // Verificar inmediatamente
    checkLocalStorage();
    
    // También escuchar cambios en localStorage (por si se actualiza desde otra pestaña)
    window.addEventListener('storage', checkLocalStorage);
    
    return () => {
      window.removeEventListener('storage', checkLocalStorage);
    };
  }, [locality, setLocality]);

  // Solo mostrar si DEBUG=TRUE en el .env (usar NEXT_PUBLIC_DEBUG para acceso en cliente)
  const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === "TRUE" || process.env.NEXT_PUBLIC_DEBUG === "true";

  useEffect(() => {
    if (isDebugEnabled && isOpen) {
      loadLocalities();
    }
  }, [isDebugEnabled, isOpen]);

  const loadLocalities = async () => {
    setLoadingLocalities(true);
    try {
      const response = await fetch("/api/localities", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLocalities(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading localities:", error);
    } finally {
      setLoadingLocalities(false);
    }
  };

  const handleSelectLocality = async (selectedLocality: Locality) => {
    console.log("[LocalityDebugBar] Seleccionando localidad:", selectedLocality);
    
    // Cerrar el panel primero para que se vea el cambio en el botón
    setIsOpen(false);
    
    // Actualizar el contexto (esto actualiza el estado inmediatamente y dispara eventos)
    // El contexto ya guarda en localStorage y dispara el evento 'localityChanged'
    setLocality(selectedLocality);
    
    console.log("[LocalityDebugBar] Localidad actualizada sin recargar página:", selectedLocality.name);
  };

  const handleAutoDetect = async () => {
    try {
      await detectLocality();
      console.log("[LocalityDebugBar] Localidad auto-detectada sin recargar página");
    } catch (error) {
      console.error("[LocalityDebugBar] Error en auto-detección:", error);
    }
  };

  const handleDetectWithIp = async () => {
    if (!simulatedIp.trim()) {
      alert("Por favor ingresa una IP válida");
      return;
    }
    try {
      console.log("[LocalityDebugBar] Detectando localidad con IP:", simulatedIp.trim());
      await detectLocality(simulatedIp.trim());
      console.log("[LocalityDebugBar] Localidad detectada con IP sin recargar página:", simulatedIp.trim());
    } catch (error) {
      console.error("[LocalityDebugBar] Error detectando localidad con IP:", error);
      alert(`Error al detectar localidad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  if (!isDebugEnabled) {
    return null;
  }

  return (
    <>
      {/* Botón flotante para abrir */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
          title={`Debug: Cambiar localidad${locality ? ` (Actual: ${locality.name})` : " (Sin localidad)"}`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-sm font-medium">
            {locality ? locality.name : "Sin localidad"}
          </span>
        </button>
      )}

      {/* Panel de debug */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-yellow-500 rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-yellow-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <h3 className="font-semibold">Debug: Localidad</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-yellow-600 rounded p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Localidad actual */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Localidad actual:</p>
              <p className="font-semibold text-gray-900">
                {locality ? locality.name : "No detectada"}
              </p>
              {locality?.region && (
                <p className="text-xs text-gray-500 mt-1">Región: {locality.region}</p>
              )}
            </div>

            {/* Botón de auto-detección */}
            <button
              onClick={handleAutoDetect}
              disabled={isLoading}
              className="w-full mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Detectando..." : "Auto-detectar por IP"}
            </button>

            {/* Simular IP */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Simular IP:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simulatedIp}
                  onChange={(e) => setSimulatedIp(e.target.value)}
                  placeholder="190.103.220.157"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <button
                  onClick={handleDetectWithIp}
                  disabled={isLoading || !simulatedIp.trim()}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  Detectar
                </button>
              </div>
            </div>

            {/* Separador */}
            <div className="my-4 border-t border-gray-200"></div>

            {/* Lista de localidades */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Seleccionar localidad manualmente:
              </p>
              {loadingLocalities ? (
                <div className="text-center py-4 text-gray-500">Cargando...</div>
              ) : localities.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay localidades disponibles
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {localities.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocality(loc)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        locality?.id === loc.id
                          ? "bg-yellow-100 border-2 border-yellow-500"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      <p className="font-medium text-gray-900">{loc.name}</p>
                      {loc.region && (
                        <p className="text-xs text-gray-500 mt-0.5">{loc.region}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón para limpiar */}
            <button
              onClick={() => {
                setLocality(null);
                setIsOpen(false);
                console.log("[LocalityDebugBar] Localidad limpiada sin recargar página");
              }}
              className="w-full mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Limpiar localidad
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Solo visible en desarrollo
            </p>
          </div>
        </div>
      )}
    </>
  );
}
