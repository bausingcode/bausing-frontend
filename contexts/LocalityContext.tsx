"use client";

import { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, ReactNode } from "react";
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
  detectLocality: (
    simulatedIp?: string,
    addressId?: string,
    options?: { background?: boolean; selectSeq?: number },
  ) => Promise<void>;
  selectAddress: (addressId: string) => Promise<Locality | null>;
  clearAddressSelection: () => void;
}

const LocalityContext = createContext<LocalityContextType | undefined>(undefined);

const STORAGE_KEY_LOCALITY = "bausing_locality";

function readLocalityFromStorage(): Locality | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCALITY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Locality & { id?: string };
    if (parsed && typeof parsed.id === "string" && parsed.id.length > 0) {
      return parsed as Locality;
    }
  } catch {
    // ignore
  }
  return null;
}

export function LocalityProvider({ children }: { children: ReactNode }) {
  const [locality, setLocalityState] = useState<Locality | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresAddressSelection, setRequiresAddressSelection] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [updateKey, setUpdateKey] = useState(0); // Key para forzar actualizaciones
  /** Ignora respuestas de selectAddress si el usuario eligió otra dirección después */
  const addressSelectSeqRef = useRef(0);
  /** Última localidad confirmada por detect-locality (para devolverla desde selectAddress) */
  const lastCommittedLocalityRef = useRef<Locality | null>(null);

  type LocalityWithZone = Locality & {
    crm_zone_id?: string;
    is_third_party_transport?: boolean;
    shipping_price?: number | null;
  };

  const isStaleAddressSelect = (selectSeq?: number) =>
    selectSeq !== undefined && selectSeq !== addressSelectSeqRef.current;

  const commitDetectedLocality = (
    detectedLocality: Locality,
    extras: {
      crm_zone_id?: string;
      is_third_party_transport?: boolean;
      shipping_price?: number | null;
    },
    options?: { selectSeq?: number; addressId?: string },
  ): LocalityWithZone | null => {
    if (isStaleAddressSelect(options?.selectSeq)) {
      return null;
    }
    setRequiresAddressSelection(false);
    setAvailableAddresses([]);

    const localityWithZone: LocalityWithZone = { ...detectedLocality };
    if (extras.crm_zone_id) {
      localityWithZone.crm_zone_id = extras.crm_zone_id;
    }
    localityWithZone.is_third_party_transport = !!extras.is_third_party_transport;
    if (extras.is_third_party_transport && extras.shipping_price != null) {
      localityWithZone.shipping_price = extras.shipping_price;
    } else {
      delete localityWithZone.shipping_price;
    }

    setLocalityState(localityWithZone);
    setUpdateKey((prev) => prev + 1);
    localStorage.setItem(STORAGE_KEY_LOCALITY, JSON.stringify(localityWithZone));
    window.dispatchEvent(
      new CustomEvent("localityChanged", {
        detail: { locality: localityWithZone, addressId: options?.addressId },
      }),
    );
    lastCommittedLocalityRef.current = localityWithZone;
    return localityWithZone;
  };

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

  // Hidratar localidad desde almacenamiento antes de useEffect hijos (precios, catálogo)
  useLayoutEffect(() => {
    const stored = readLocalityFromStorage();
    if (stored) {
      setLocalityState(stored);
      setIsLoading(false);
    }
  }, []);

  // Verificar IP real al entrar a la página (sin simulación)
  useEffect(() => {
    console.log("[LocalityContext] Verificando IP real al entrar a la página (sin simulación)");

    const hadStoredLocality = Boolean(readLocalityFromStorage());
    
    // Verificar si hay una dirección guardada
    const savedAddressId = getSavedAddressId();
    if (savedAddressId) {
      console.log("[LocalityContext] Usando dirección guardada:", savedAddressId);
      detectLocality(undefined, savedAddressId, { background: hadStoredLocality }).catch((err) => {
        console.error("[LocalityContext] Error al usar dirección guardada:", err);
        // Si falla, intentar sin dirección guardada
        detectLocality(undefined, undefined, { background: hadStoredLocality }).catch((err) => {
          console.error("[LocalityContext] Error al verificar IP:", err);
        });
      });
    } else {
      // Si no hay dirección guardada, detectar normalmente
      detectLocality(undefined, undefined, { background: hadStoredLocality }).catch((err) => {
        console.error("[LocalityContext] Error al verificar IP:", err);
        // El backend debería devolver el fallback automáticamente
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectLocality = async (
    simulatedIp?: string,
    addressId?: string,
    options?: { background?: boolean; selectSeq?: number },
  ) => {
    // Si se proporciona una IP simulada, usarla (solo para debug/testing)
    // Si no se proporciona, usar la IP real del request (sin parámetros)
    const background = options?.background === true;
    if (!background) {
      setIsLoading(true);
    }
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

        // Si se proporcionó un addressId explícito, no mostrar el modal global —
        // el componente que llamó ya tiene su propia UI de selección.
        if (addressId) {
          if (!background && !isStaleAddressSelect(options?.selectSeq)) {
            setIsLoading(false);
          }
          return;
        }

        // Verificar si hay una dirección guardada en localStorage
        const savedAddressId = getSavedAddressId();
        const addresses = data.data.addresses || [];

        if (savedAddressId) {
          // Verificar si la dirección guardada todavía existe en la lista
          const savedAddress = addresses.find((addr: Address) => addr.id === savedAddressId);
          if (savedAddress) {
            console.log("[LocalityContext] Usando dirección guardada automáticamente:", savedAddressId);
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
                const sp =
                  savedData.data.shipping_price !== undefined &&
                  savedData.data.shipping_price !== null
                    ? savedData.data.shipping_price
                    : null;
                commitDetectedLocality(
                  savedData.data.locality,
                  {
                    crm_zone_id: savedData.data.crm_zone_id,
                    is_third_party_transport: !!savedData.data.is_third_party_transport,
                    shipping_price: sp,
                  },
                  { selectSeq: options?.selectSeq, addressId: savedAddressId },
                );
                if (!background && !isStaleAddressSelect(options?.selectSeq)) {
                  setIsLoading(false);
                }
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
        }

        // Sin dirección guardada válida: mostrar modal de selección
        setRequiresAddressSelection(true);
        setAvailableAddresses(addresses);
        setIsLoading(false);
        return;
      }
      
      if (data.success && data.data?.locality) {
        const detectedLocality = data.data.locality;
        const shippingPrice =
          data.data.shipping_price !== undefined && data.data.shipping_price !== null
            ? data.data.shipping_price
            : null;
        console.log("[LocalityContext] Localidad detectada:", detectedLocality);
        commitDetectedLocality(
          detectedLocality,
          {
            crm_zone_id: data.data.crm_zone_id,
            is_third_party_transport: !!data.data.is_third_party_transport,
            shipping_price: shippingPrice,
          },
          { selectSeq: options?.selectSeq, addressId },
        );
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
      if (!background && !isStaleAddressSelect(options?.selectSeq)) {
        setIsLoading(false);
      }
    }
  };

  const selectAddress = async (addressId: string): Promise<Locality | null> => {
    const seq = ++addressSelectSeqRef.current;
    console.log("[LocalityContext] Seleccionando dirección:", addressId, "seq:", seq);
    setIsLoading(true);
    setError(null);
    lastCommittedLocalityRef.current = null;
    try {
      saveAddressId(addressId);
      await detectLocality(undefined, addressId, { selectSeq: seq });
      if (isStaleAddressSelect(seq)) {
        return null;
      }
      return lastCommittedLocalityRef.current;
    } catch (err) {
      if (!isStaleAddressSelect(seq)) {
        console.error("[LocalityContext] Error al seleccionar dirección:", err);
        setError(err instanceof Error ? err.message : "Error al seleccionar dirección");
      }
      return null;
    } finally {
      if (seq === addressSelectSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  const clearAddressSelection = () => {
    setRequiresAddressSelection(false);
    setAvailableAddresses([]);
  };

  const setLocality = (newLocality: Locality | null) => {
    console.log("[LocalityContext] Cambiando localidad:", newLocality);
    const updatedLocality = newLocality ? { ...newLocality } : null;
    if (updatedLocality) {
      delete (updatedLocality as Locality & { is_third_party_transport?: boolean }).is_third_party_transport;
      delete (updatedLocality as Locality & { shipping_price?: number | null }).shipping_price;
    }
    setLocalityState(updatedLocality);
    setUpdateKey(prev => prev + 1); // Incrementar key para forzar actualización
    if (newLocality) {
      localStorage.setItem("bausing_locality", JSON.stringify(updatedLocality));
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
