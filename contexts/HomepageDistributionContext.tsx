"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import {
  fetchHomepageDistributionProductIds,
  fetchPublicHomepageDistributionQuick,
  fetchProductsPrices,
  Product,
} from "@/lib/api";
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
    min_transfer_price?: number | null;
    max_transfer_price?: number | null;
    min_card_price?: number;
    max_card_price?: number;
    show_transfer_price_highlight?: boolean;
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

function mergePricesIntoDistribution(
  dist: HomepageDistribution,
  pricesData: Record<string, PricesMap[string]>,
): HomepageDistribution {
  const apply = (products: Product[]) =>
    products.map((p) => {
      const priceInfo = pricesData[p.id];
      if (!priceInfo) {
        return {
          ...p,
          min_price: undefined,
          max_price: undefined,
          min_transfer_price: undefined,
          max_transfer_price: undefined,
          min_card_price: undefined,
          max_card_price: undefined,
          show_transfer_price_highlight: undefined,
          price_range: undefined,
          promos: [],
        };
      }
      const transferMin =
        priceInfo.min_transfer_price != null &&
        typeof priceInfo.min_transfer_price === "number" &&
        priceInfo.min_transfer_price > 0
          ? priceInfo.min_transfer_price
          : undefined;
      const transferMax =
        priceInfo.max_transfer_price != null &&
        typeof priceInfo.max_transfer_price === "number" &&
        priceInfo.max_transfer_price > 0
          ? priceInfo.max_transfer_price
          : undefined;
      return {
        ...p,
        min_price: priceInfo.min_price,
        max_price: priceInfo.max_price,
        min_transfer_price: transferMin,
        max_transfer_price: transferMax,
        min_card_price: priceInfo.min_card_price,
        max_card_price: priceInfo.max_card_price,
        show_transfer_price_highlight: priceInfo.show_transfer_price_highlight,
        price_range: priceInfo.price_range,
        promos: Array.isArray(priceInfo.promos)
          ? priceInfo.promos
          : priceInfo.promos
            ? [priceInfo.promos]
            : [],
      };
    });

  return {
    featured: apply(dist.featured || []),
    discounts: apply(dist.discounts || []),
    mattresses: apply(dist.mattresses || []),
    complete_purchase: apply(dist.complete_purchase || []),
  };
}

export function HomepageDistributionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locality } = useLocality();
  const localityId = locality?.id;

  const [distribution, setDistribution] = useState<HomepageDistribution | null>(null);
  const [prices, setPrices] = useState<PricesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const quickBaseRef = useRef<HomepageDistribution | null>(null);
  const homeDataReadyRef = useRef(false);
  const pricesGenRef = useRef(0);

  /** Ids alineados con GET /quick (mismo orden/CRM) para acelerar POST /prices en paralelo. */
  const fetchPricesInParallel = useCallback(
    (localityKey: string | undefined) =>
      fetchHomepageDistributionProductIds().then((ids) => {
        if (ids && ids.length > 0) return fetchProductsPrices(ids, localityKey);
        return {} as Awaited<ReturnType<typeof fetchProductsPrices>>;
      }),
    [],
  );

  const loadPricesForBase = useCallback(
    async (base: HomepageDistribution, localityKey: string | undefined) => {
      const gen = ++pricesGenRef.current;
      setIsLoadingPrices(true);
      try {
        const allProducts = [
          ...(base.featured || []),
          ...(base.discounts || []),
          ...(base.mattresses || []),
          ...(base.complete_purchase || []),
        ];
        const productIds = allProducts.map((p) => p.id).filter(Boolean);
        if (productIds.length === 0) return;

        const pricesData = await fetchProductsPrices(productIds, localityKey);
        if (gen !== pricesGenRef.current) return;
        if (!pricesData || Object.keys(pricesData).length === 0) return;

        setDistribution(mergePricesIntoDistribution(base, pricesData));
        setPrices(pricesData);
      } catch (err) {
        console.error("[HomepageDistributionContext] Error loading prices:", err);
      } finally {
        if (gen === pricesGenRef.current) setIsLoadingPrices(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (pathname !== "/") {
      setIsLoading(false);
      quickBaseRef.current = null;
      homeDataReadyRef.current = false;
      return;
    }


    let cancelled = false;
    const needQuickFetch = !homeDataReadyRef.current;

    (async () => {
      if (needQuickFetch) {
        const gen = ++pricesGenRef.current;
        setIsLoading(true);
        setError(null);
        setIsLoadingPrices(true);
        // Misma superposición de red que Promise.all, pero el UI se pinta al terminar solo /quick.
        const pricesP = fetchPricesInParallel(localityId);
        let data: HomepageDistribution | null = null;
        try {
          data = await fetchPublicHomepageDistributionQuick();
          if (cancelled || gen !== pricesGenRef.current) {
            if (gen === pricesGenRef.current) setIsLoadingPrices(false);
            return;
          }
          quickBaseRef.current = data;
          homeDataReadyRef.current = true;
          setDistribution(data);
          setPrices({});
        } catch (err) {
          const e = err instanceof Error ? err : new Error("Error loading homepage distribution");
          setError(e);
          console.error("[HomepageDistributionContext] Error loading distribution:", e);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
        if (!data) {
          if (gen === pricesGenRef.current) setIsLoadingPrices(false);
          return;
        }
        if (cancelled || gen !== pricesGenRef.current) {
          if (gen === pricesGenRef.current) setIsLoadingPrices(false);
          return;
        }
        try {
          const pricesData = await pricesP;
          if (cancelled || gen !== pricesGenRef.current) return;
          if (pricesData && Object.keys(pricesData).length > 0) {
            setDistribution(mergePricesIntoDistribution(data, pricesData));
            setPrices(pricesData);
            return;
          }
          const allProducts = [
            ...(data.featured || []),
            ...(data.discounts || []),
            ...(data.mattresses || []),
            ...(data.complete_purchase || []),
          ];
          const productIds = allProducts.map((p) => p.id).filter(Boolean);
          if (productIds.length === 0) return;
          const pricesFallback = await fetchProductsPrices(productIds, localityId);
          if (cancelled || gen !== pricesGenRef.current) return;
          if (pricesFallback && Object.keys(pricesFallback).length > 0) {
            setDistribution(mergePricesIntoDistribution(data, pricesFallback));
            setPrices(pricesFallback);
          }
        } catch (err) {
          console.error("[HomepageDistributionContext] Error loading homepage prices:", err);
        } finally {
          if (!cancelled && gen === pricesGenRef.current) setIsLoadingPrices(false);
        }
        return;
      }

      if (cancelled || !quickBaseRef.current) return;
      // Misma localidad o primera carga con cache: solo recalcular precios.
      // No esperar a detect-locality: el backend usa catálogo Córdoba si locality_id es null;
      // si la localidad llega después, este efecto vuelve a correr y actualiza precios.
      await loadPricesForBase(quickBaseRef.current, localityId);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, localityId, loadPricesForBase, fetchPricesInParallel]);

  const refetch = useCallback(async () => {
    if (pathname !== "/") return;
    const gen = ++pricesGenRef.current;
    homeDataReadyRef.current = false;
    setIsLoading(true);
    setError(null);
    setIsLoadingPrices(true);
    const pricesP = fetchPricesInParallel(localityId);
    let data: HomepageDistribution | null = null;
    try {
      data = await fetchPublicHomepageDistributionQuick();
      if (gen !== pricesGenRef.current) return;
      quickBaseRef.current = data;
      homeDataReadyRef.current = true;
      setDistribution(data);
      setPrices({});
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Error loading homepage distribution");
      setError(e);
      console.error("[HomepageDistributionContext] Error loading distribution:", e);
    } finally {
      setIsLoading(false);
    }
    if (!data || gen !== pricesGenRef.current) {
      if (gen === pricesGenRef.current) setIsLoadingPrices(false);
      return;
    }
    try {
      const pricesData = await pricesP;
      if (gen !== pricesGenRef.current) return;
      if (pricesData && Object.keys(pricesData).length > 0) {
        setDistribution(mergePricesIntoDistribution(data, pricesData));
        setPrices(pricesData);
        return;
      }
      const allProducts = [
        ...(data.featured || []),
        ...(data.discounts || []),
        ...(data.mattresses || []),
        ...(data.complete_purchase || []),
      ];
      const productIds = allProducts.map((p) => p.id).filter(Boolean);
      if (productIds.length > 0) {
        const pricesFallback = await fetchProductsPrices(productIds, localityId);
        if (gen !== pricesGenRef.current) return;
        if (pricesFallback && Object.keys(pricesFallback).length > 0) {
          setDistribution(mergePricesIntoDistribution(data, pricesFallback));
          setPrices(pricesFallback);
        }
      }
    } catch (err) {
      console.error("[HomepageDistributionContext] Error loading homepage prices (refetch):", err);
    } finally {
      if (gen === pricesGenRef.current) setIsLoadingPrices(false);
    }
  }, [pathname, localityId, fetchPricesInParallel]);

  return (
    <HomepageDistributionContext.Provider
      value={{
        distribution,
        prices,
        isLoading,
        isLoadingPrices,
        error,
        refetch,
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
