"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const { locality } = useLocality();
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

  // Solo el home usa esta data (HomeProducts). Evita 2 requests pesados en catálogo, PDP, etc.
  useEffect(() => {
    if (pathname !== "/") {
      setIsLoading(false);
      return;
    }
    loadDistribution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locality?.id, pathname]);

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
