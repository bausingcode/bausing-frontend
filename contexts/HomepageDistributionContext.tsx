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
  fetchHomepageDistributionReady,
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
  const { locality, isLoading: localityLoading } = useLocality();
  const localityId = locality?.id;

  const [distribution, setDistribution] = useState<HomepageDistribution | null>(null);
  const [prices, setPrices] = useState<PricesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const quickBaseRef = useRef<HomepageDistribution | null>(null);
  const homeDataReadyRef = useRef(false);
  const pricesGenRef = useRef(0);

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
        setIsLoading(true);
        setError(null);
        setIsLoadingPrices(true);
        let usedReady = false;
        try {
          if (!localityLoading) {
            const ready = await fetchHomepageDistributionReady(localityId);
            if (cancelled) return;
            if (ready) {
              usedReady = true;
              quickBaseRef.current = ready.distribution;
              homeDataReadyRef.current = true;
              const pd = ready.prices;
              if (pd && Object.keys(pd).length > 0) {
                setDistribution(mergePricesIntoDistribution(ready.distribution, pd));
                setPrices(pd);
              } else {
                setDistribution(ready.distribution);
                setPrices({});
              }
              setError(null);
            } else {
              const data = await fetchPublicHomepageDistributionQuick();
              if (cancelled) return;
              if (!data) {
                setError(new Error("Error loading homepage distribution"));
                setIsLoadingPrices(false);
                return;
              }
              quickBaseRef.current = data;
              homeDataReadyRef.current = true;
              setDistribution(data);
              setPrices({});
              await loadPricesForBase(data, localityId);
            }
          } else {
            const data = await fetchPublicHomepageDistributionQuick();
            if (cancelled) return;
            if (!data) {
              setError(new Error("Error loading homepage distribution"));
              setIsLoadingPrices(false);
              return;
            }
            quickBaseRef.current = data;
            homeDataReadyRef.current = true;
            setDistribution(data);
            setPrices({});
          }
        } catch (err) {
          const e = err instanceof Error ? err : new Error("Error loading homepage distribution");
          setError(e);
          console.error("[HomepageDistributionContext] Error loading distribution:", e);
          setIsLoadingPrices(false);
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
        // Un microtask: que React aplique distribution + precios en el dom antes de quitar el skeleton
        if (!cancelled && usedReady) {
          queueMicrotask(() => {
            if (!cancelled) setIsLoadingPrices(false);
          });
        }
        return;
      }

      if (cancelled || !quickBaseRef.current) return;
      // Actualizar precios (localidad lista o cambió, sin re-descargar /quick)
      if (localityLoading) return;
      await loadPricesForBase(quickBaseRef.current, localityId);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, localityId, localityLoading, loadPricesForBase]);

  const refetch = useCallback(async () => {
    if (pathname !== "/") return;
    homeDataReadyRef.current = false;
    setIsLoading(true);
    setError(null);
    setIsLoadingPrices(true);
    let usedReady = false;
    try {
      const ready = await fetchHomepageDistributionReady(localityId);
      if (ready) {
        usedReady = true;
        quickBaseRef.current = ready.distribution;
        homeDataReadyRef.current = true;
        const pd = ready.prices;
        if (pd && Object.keys(pd).length > 0) {
          setDistribution(mergePricesIntoDistribution(ready.distribution, pd));
          setPrices(pd);
        } else {
          setDistribution(ready.distribution);
          setPrices({});
        }
        setError(null);
        return;
      }
      const data = await fetchPublicHomepageDistributionQuick();
      if (!data) {
        setError(new Error("Error loading homepage distribution"));
        return;
      }
      quickBaseRef.current = data;
      homeDataReadyRef.current = true;
      setDistribution(data);
      setPrices({});
      await loadPricesForBase(data, localityId);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Error loading homepage distribution");
      setError(e);
      console.error("[HomepageDistributionContext] Error loading distribution:", e);
    } finally {
      setIsLoading(false);
      if (!usedReady) {
        setIsLoadingPrices(false);
      }
    }
    if (usedReady) {
      queueMicrotask(() => {
        setIsLoadingPrices(false);
      });
    }
  }, [pathname, localityId, loadPricesForBase]);

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
