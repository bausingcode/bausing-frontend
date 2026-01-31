"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Locality {
  id: string;
  name: string;
  region?: string;
}

interface LocalityContextType {
  locality: Locality | null;
  isLoading: boolean;
  error: string | null;
  setLocality: (locality: Locality | null) => void;
  detectLocality: (simulatedIp?: string) => Promise<void>;
}

const LocalityContext = createContext<LocalityContextType | undefined>(undefined);

export function LocalityProvider({ children }: { children: ReactNode }) {
  const [locality, setLocalityState] = useState<Locality | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateKey, setUpdateKey] = useState(0); // Key para forzar actualizaciones

  // Verificar IP real al entrar a la página (sin simulación)
  useEffect(() => {
    console.log("[LocalityContext] Verificando IP real al entrar a la página (sin simulación)");
    // Siempre intentar detectar por IP real, sin usar localStorage previo
    detectLocality().catch((err) => {
      console.error("[LocalityContext] Error al verificar IP:", err);
      // El backend debería devolver el fallback automáticamente
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectLocality = async (simulatedIp?: string) => {
    // Si se proporciona una IP simulada, usarla (solo para debug/testing)
    // Si no se proporciona, usar la IP real del request (sin parámetros)
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir URL: solo agregar IP si se proporciona explícitamente (simulación)
      let url = "/api/detect-locality";
      if (simulatedIp) {
        url += `?ip=${encodeURIComponent(simulatedIp)}`;
        console.log("[LocalityContext] Simulando IP:", simulatedIp);
      } else {
        console.log("[LocalityContext] Verificando IP real del request (sin simulación)");
      }
      
      console.log("[LocalityContext] Haciendo request a:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[LocalityContext] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `No se pudo detectar la localidad: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[LocalityContext] Response data:", data);
      
      if (data.success && data.data?.locality) {
        const detectedLocality = data.data.locality;
        const crmZoneId = data.data.crm_zone_id;
        console.log("[LocalityContext] Localidad detectada:", detectedLocality);
        console.log("[LocalityContext] Zona de entrega detectada:", crmZoneId);
        
        // Crear un nuevo objeto para forzar la actualización, incluyendo la zona
        const localityWithZone = { ...detectedLocality };
        if (crmZoneId) {
          localityWithZone.crm_zone_id = crmZoneId;
        }
        setLocalityState(localityWithZone);
        setUpdateKey(prev => prev + 1);
        localStorage.setItem("bausing_locality", JSON.stringify(localityWithZone));
        console.log("[LocalityContext] Localidad guardada en localStorage:", detectedLocality.id);
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('localityChanged', { 
          detail: { locality: localityWithZone } 
        }));
      } else {
        const errorMsg = data.error || "No se encontró una localidad para tu ubicación";
        console.error("[LocalityContext] Error en respuesta:", errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Error detecting locality:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      throw err; // Re-lanzar el error para que el componente pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  const setLocality = (newLocality: Locality | null) => {
    console.log("[LocalityContext] Cambiando localidad:", newLocality);
    // Crear un nuevo objeto para forzar la actualización de React
    const updatedLocality = newLocality ? { ...newLocality } : null;
    setLocalityState(updatedLocality);
    setUpdateKey(prev => prev + 1); // Incrementar key para forzar actualización
    if (newLocality) {
      localStorage.setItem("bausing_locality", JSON.stringify(newLocality));
      console.log("[LocalityContext] Localidad guardada en localStorage:", newLocality.id);
    } else {
      localStorage.removeItem("bausing_locality");
      console.log("[LocalityContext] Localidad eliminada de localStorage");
    }
    // Disparar evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('localityChanged', { 
      detail: { locality: updatedLocality } 
    }));
  };
  
  // Log cuando cambia la localidad
  useEffect(() => {
    console.log("[LocalityContext] Localidad actualizada:", locality?.id, locality?.name, "updateKey:", updateKey);
  }, [locality?.id, updateKey]);

  return (
    <LocalityContext.Provider
      value={{
        locality,
        isLoading,
        error,
        setLocality,
        detectLocality,
      }}
    >
      {children}
    </LocalityContext.Provider>
  );
}

export function useLocality() {
  const context = useContext(LocalityContext);
  if (context === undefined) {
    throw new Error("useLocality must be used within a LocalityProvider");
  }
  return context;
}
