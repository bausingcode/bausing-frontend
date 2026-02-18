"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Address } from "@/lib/api";

export interface Locality {
  id: string;
  name: string;
  region?: string;
}

interface LocalityContextType {
  locality: Locality | null;
  isLoading: boolean;
  error: string | null;
  requiresAddressSelection: boolean;
  availableAddresses: Address[];
  setLocality: (locality: Locality | null) => void;
  detectLocality: (simulatedIp?: string, addressId?: string) => Promise<void>;
  selectAddress: (addressId: string) => Promise<void>;
  clearAddressSelection: () => void;
}

const LocalityContext = createContext<LocalityContextType | undefined>(undefined);

export function LocalityProvider({ children }: { children: ReactNode }) {
  const [locality, setLocalityState] = useState<Locality | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresAddressSelection, setRequiresAddressSelection] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [updateKey, setUpdateKey] = useState(0); // Key para forzar actualizaciones

  // Obtener token de autenticación
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_token");
    }
    return null;
  };

  // Obtener dirección guardada de localStorage (con verificación de expiración)
  const getSavedAddressId = (): string | null => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("bausing_selected_address_id");
      if (!savedData) return null;
      
      try {
        const parsed = JSON.parse(savedData);
        const savedTimestamp = parsed.timestamp;
        const addressId = parsed.addressId;
        
        // Verificar si ha pasado más de 24 horas (1 día)
        const now = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        
        if (now - savedTimestamp > oneDayInMs) {
          // La dirección ha expirado, limpiar
          console.log("[LocalityContext] Dirección guardada ha expirado (más de 24 horas)");
          localStorage.removeItem("bausing_selected_address_id");
          return null;
        }
        
        return addressId;
      } catch (e) {
        // Si hay error al parsear, limpiar y retornar null
        console.error("[LocalityContext] Error al parsear dirección guardada:", e);
        localStorage.removeItem("bausing_selected_address_id");
        return null;
      }
    }
    return null;
  };

  // Guardar dirección seleccionada en localStorage con timestamp
  const saveAddressId = (addressId: string) => {
    if (typeof window !== "undefined") {
      const data = {
        addressId,
        timestamp: Date.now()
      };
      localStorage.setItem("bausing_selected_address_id", JSON.stringify(data));
      console.log("[LocalityContext] Dirección guardada en localStorage:", addressId, "con timestamp:", data.timestamp);
    }
  };

  // Verificar IP real al entrar a la página (sin simulación)
  useEffect(() => {
    console.log("[LocalityContext] Verificando IP real al entrar a la página (sin simulación)");
    
    // Verificar si hay una dirección guardada
    const savedAddressId = getSavedAddressId();
    if (savedAddressId) {
      console.log("[LocalityContext] Usando dirección guardada:", savedAddressId);
      detectLocality(undefined, savedAddressId).catch((err) => {
        console.error("[LocalityContext] Error al usar dirección guardada:", err);
        // Si falla, intentar sin dirección guardada
        detectLocality().catch((err) => {
          console.error("[LocalityContext] Error al verificar IP:", err);
        });
      });
    } else {
      // Si no hay dirección guardada, detectar normalmente
      detectLocality().catch((err) => {
        console.error("[LocalityContext] Error al verificar IP:", err);
        // El backend debería devolver el fallback automáticamente
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectLocality = async (simulatedIp?: string, addressId?: string) => {
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
      
      // Agregar address_id si se proporciona
      if (addressId) {
        url += `${simulatedIp ? '&' : '?'}address_id=${encodeURIComponent(addressId)}`;
      }

      console.log("[LocalityContext] Haciendo request a:", url);
      
      // Incluir token de autenticación si está disponible
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      const token = getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      console.log("[LocalityContext] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `No se pudo detectar la localidad: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[LocalityContext] Response data:", data);
      
      // Verificar si requiere selección de dirección
      if (data.success && data.data?.requires_address_selection) {
        console.log("[LocalityContext] Se requiere selección de dirección");
        
        // Verificar si hay una dirección guardada en localStorage
        const savedAddressId = getSavedAddressId();
        const addresses = data.data.addresses || [];
        
        if (savedAddressId && !addressId) {
          // Solo usar dirección guardada si no se proporcionó un addressId explícito
          // Verificar si la dirección guardada todavía existe en la lista
          const savedAddress = addresses.find((addr: Address) => addr.id === savedAddressId);
          if (savedAddress) {
            console.log("[LocalityContext] Usando dirección guardada automáticamente:", savedAddressId);
            // Usar la dirección guardada automáticamente
            // Hacer una nueva llamada con el addressId guardado
            const newUrl = `/api/detect-locality?address_id=${encodeURIComponent(savedAddressId)}`;
            const token = getAuthToken();
            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }
            
            const savedResponse = await fetch(newUrl, { method: "GET", headers });
            if (savedResponse.ok) {
              const savedData = await savedResponse.json();
              if (savedData.success && savedData.data?.locality) {
                const detectedLocality = savedData.data.locality;
                const crmZoneId = savedData.data.crm_zone_id;
                
                setRequiresAddressSelection(false);
                setAvailableAddresses([]);
                
                const localityWithZone = { ...detectedLocality };
                if (crmZoneId) {
                  localityWithZone.crm_zone_id = crmZoneId;
                }
                setLocalityState(localityWithZone);
                setUpdateKey(prev => prev + 1);
                localStorage.setItem("bausing_locality", JSON.stringify(localityWithZone));
                
                window.dispatchEvent(new CustomEvent('localityChanged', { 
                  detail: { locality: localityWithZone } 
                }));
                setIsLoading(false);
                return;
              }
            }
          } else {
            // La dirección guardada ya no existe, limpiar
            console.log("[LocalityContext] Dirección guardada ya no existe, limpiando");
            if (typeof window !== "undefined") {
              localStorage.removeItem("bausing_selected_address_id");
            }
          }
        } else if (savedAddressId && addressId) {
          // Si se proporcionó un addressId explícito y hay uno guardado, actualizar el timestamp
          // Esto actualiza la fecha de expiración cuando el usuario selecciona manualmente
          saveAddressId(addressId);
        }
        
        // Si no hay dirección guardada o ya no existe, mostrar modal
        setRequiresAddressSelection(true);
        setAvailableAddresses(addresses);
        setIsLoading(false);
        return; // No lanzar error, solo mostrar modal
      }
      
      if (data.success && data.data?.locality) {
        const detectedLocality = data.data.locality;
        const crmZoneId = data.data.crm_zone_id;
        const isThirdPartyTransport = data.data.is_third_party_transport || false;
        const shippingPrice = data.data.shipping_price || null;
        console.log("[LocalityContext] Localidad detectada:", detectedLocality);
        console.log("[LocalityContext] Zona de entrega detectada:", crmZoneId);
        console.log("[LocalityContext] Transporte tercerizado:", isThirdPartyTransport);
        console.log("[LocalityContext] Precio de envío:", shippingPrice);
        
        // Limpiar estado de selección de dirección
        setRequiresAddressSelection(false);
        setAvailableAddresses([]);
        
        // Crear un nuevo objeto para forzar la actualización, incluyendo la zona y transporte tercerizado
        const localityWithZone = { ...detectedLocality };
        if (crmZoneId) {
          localityWithZone.crm_zone_id = crmZoneId;
        }
        if (isThirdPartyTransport) {
          localityWithZone.is_third_party_transport = true;
        }
        if (shippingPrice !== null && shippingPrice !== undefined) {
          localityWithZone.shipping_price = shippingPrice;
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

  const selectAddress = async (addressId: string) => {
    console.log("[LocalityContext] Seleccionando dirección:", addressId);
    setIsLoading(true);
    setError(null);
    try {
      // Guardar la dirección seleccionada en localStorage
      saveAddressId(addressId);
      await detectLocality(undefined, addressId);
    } catch (err) {
      console.error("[LocalityContext] Error al seleccionar dirección:", err);
      setError(err instanceof Error ? err.message : "Error al seleccionar dirección");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAddressSelection = () => {
    setRequiresAddressSelection(false);
    setAvailableAddresses([]);
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
        requiresAddressSelection,
        availableAddresses,
        setLocality,
        detectLocality,
        selectAddress,
        clearAddressSelection,
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
