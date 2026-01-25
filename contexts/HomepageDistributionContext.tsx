"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchPublicHomepageDistribution, Product } from "@/lib/api";
import { useLocality } from "./LocalityContext";

interface HomepageDistribution {
  featured: Product[];
  discounts: Product[];
  mattresses: Product[];
  complete_purchase: Product[];
}

interface HomepageDistributionContextType {
  distribution: HomepageDistribution | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const HomepageDistributionContext = createContext<HomepageDistributionContextType | undefined>(undefined);

export function HomepageDistributionProvider({ children }: { children: ReactNode }) {
  const { locality, isLoading: localityLoading } = useLocality();
  const [distribution, setDistribution] = useState<HomepageDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDistribution = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar distribución inmediatamente, incluso sin localidad
      // Si hay localidad, se usará; si no, se cargará sin filtrar
      const data = await fetchPublicHomepageDistribution(locality?.id);
      setDistribution(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error loading homepage distribution');
      setError(error);
      console.error("[HomepageDistributionContext] Error loading distribution:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <HomepageDistributionContext.Provider
      value={{
        distribution,
        isLoading,
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
