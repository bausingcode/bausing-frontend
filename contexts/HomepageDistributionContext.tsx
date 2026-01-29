"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchPublicHomepageDistributionQuick, fetchProductsPrices, Product } from "@/lib/api";
import { useLocality } from "./LocalityContext";

interface HomepageDistribution {
  featured: Product[];
  discounts: Product[];
  mattresses: Product[];
  complete_purchase: Product[];
}

interface PricesMap {
  [productId: string]: {
    min_price: number;
    max_price: number;
    price_range: string;
    promos: any[];
  };
}

interface HomepageDistributionContextType {
  distribution: HomepageDistribution | null;
  prices: PricesMap;
  isLoading: boolean;
  isLoadingPrices: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const HomepageDistributionContext = createContext<HomepageDistributionContextType | undefined>(undefined);

export function HomepageDistributionProvider({ children }: { children: ReactNode }) {
  const { locality, isLoading: localityLoading } = useLocality();
  const [distribution, setDistribution] = useState<HomepageDistribution | null>(null);
  const [prices, setPrices] = useState<PricesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadDistribution = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar distribución rápida (sin precios ni promociones)
      const data = await fetchPublicHomepageDistributionQuick();
      setDistribution(data);
      
      // Cargar precios y promociones en segundo plano
      loadPrices(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error loading homepage distribution');
      setError(error);
      console.error("[HomepageDistributionContext] Error loading distribution:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrices = async (dist: HomepageDistribution) => {
    setIsLoadingPrices(true);
    
    try {
      // Recopilar todos los IDs de productos
      const allProducts = [
        ...(dist.featured || []),
        ...(dist.discounts || []),
        ...(dist.mattresses || []),
        ...(dist.complete_purchase || [])
      ];
      
      const productIds = allProducts.map(p => p.id).filter(Boolean);
      
      if (productIds.length > 0) {
        const pricesData = await fetchProductsPrices(productIds, locality?.id);
        
        // Debug: verificar promociones recibidas
        console.log("[HomepageDistributionContext] Precios recibidos:", pricesData);
        Object.keys(pricesData).forEach(productId => {
          if (pricesData[productId].promos && pricesData[productId].promos.length > 0) {
            console.log(`[HomepageDistributionContext] Producto ${productId} tiene ${pricesData[productId].promos.length} promociones:`, pricesData[productId].promos);
          }
        });
        
        // Actualizar productos con precios y promociones
        const updatedDistribution: HomepageDistribution = {
          featured: (dist.featured || []).map(p => {
            const priceInfo = pricesData[p.id];
            if (priceInfo) {
              const updated = {
                ...p,
                min_price: priceInfo.min_price,
                max_price: priceInfo.max_price,
                price_range: priceInfo.price_range,
                // Asegurarse de que las promociones sean un array
                promos: Array.isArray(priceInfo.promos) ? priceInfo.promos : (priceInfo.promos ? [priceInfo.promos] : [])
              };
              if (updated.promos && updated.promos.length > 0) {
                console.log(`[HomepageDistributionContext] Producto ${p.id} actualizado con ${updated.promos.length} promociones:`, updated.promos);
              }
              return updated;
            }
            return p;
          }),
          discounts: (dist.discounts || []).map(p => {
            const priceInfo = pricesData[p.id];
            if (priceInfo) {
              return {
                ...p,
                min_price: priceInfo.min_price,
                max_price: priceInfo.max_price,
                price_range: priceInfo.price_range,
                promos: Array.isArray(priceInfo.promos) ? priceInfo.promos : (priceInfo.promos ? [priceInfo.promos] : [])
              };
            }
            return p;
          }),
          mattresses: (dist.mattresses || []).map(p => {
            const priceInfo = pricesData[p.id];
            if (priceInfo) {
              return {
                ...p,
                min_price: priceInfo.min_price,
                max_price: priceInfo.max_price,
                price_range: priceInfo.price_range,
                promos: Array.isArray(priceInfo.promos) ? priceInfo.promos : (priceInfo.promos ? [priceInfo.promos] : [])
              };
            }
            return p;
          }),
          complete_purchase: (dist.complete_purchase || []).map(p => {
            const priceInfo = pricesData[p.id];
            if (priceInfo) {
              return {
                ...p,
                min_price: priceInfo.min_price,
                max_price: priceInfo.max_price,
                price_range: priceInfo.price_range,
                promos: Array.isArray(priceInfo.promos) ? priceInfo.promos : (priceInfo.promos ? [priceInfo.promos] : [])
              };
            }
            return p;
          })
        };
        
        setDistribution(updatedDistribution);
        setPrices(pricesData);
      }
    } catch (err) {
      console.error("[HomepageDistributionContext] Error loading prices:", err);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Cargar distribución inmediatamente al montar, y luego cuando cambie la localidad
  useEffect(() => {
    // Cargar inmediatamente sin esperar localityLoading
    // Usar un pequeño delay para evitar múltiples llamadas simultáneas
    const timeoutId = setTimeout(() => {
      loadDistribution();
    }, 100);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locality?.id]);

  // Recargar precios cuando cambia la localidad
  useEffect(() => {
    if (distribution && !isLoading) {
      loadPrices(distribution);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locality?.id]);

  return (
    <HomepageDistributionContext.Provider
      value={{
        distribution,
        prices,
        isLoading,
        isLoadingPrices,
        error,
        refetch: loadDistribution,
      }}
    >
      {children}
    </HomepageDistributionContext.Provider>
  );
}

export function useHomepageDistribution() {
  const context = useContext(HomepageDistributionContext);
  if (context === undefined) {
    throw new Error("useHomepageDistribution must be used within a HomepageDistributionProvider");
  }
  return context;
}
