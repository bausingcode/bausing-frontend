"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { fetchProductsPrices, Product } from "@/lib/api";
import { useLocality } from "@/contexts/LocalityContext";
import { ChevronDown } from "lucide-react";
import {
  calculateProductPrice,
  PRICE_UI_TRANSFER_CAPTION,
  PRICE_UI_CARD_CAPTION,
} from "@/utils/priceUtils";
import { firstProductImageUrl } from "@/lib/productImagePlaceholder";

interface Props {
  initialProducts: Product[];
}

function mergePrices(products: Product[], pricesData: Record<string, any>): Product[] {
  return products.map((p) => {
    const priceInfo = pricesData[p.id];
    if (!priceInfo) return p;
    return {
      ...p,
      min_price: priceInfo.min_price,
      max_price: priceInfo.max_price,
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
}

function productToCardProps(product: Product, isPriceLoading: boolean) {
  const image = firstProductImageUrl(product);
  const hasPrice = product.min_price !== null && product.min_price !== undefined && product.min_price > 0;

  if (isPriceLoading || !hasPrice) {
    return {
      id: product.id,
      image,
      alt: product.name,
      name: product.name,
      currentPrice: "",
      originalPrice: "",
      discount: undefined,
      priceNote: undefined,
      isPriceLoading,
    };
  }

  const productWithPromos = {
    ...product,
    promos: Array.isArray(product.promos) ? product.promos : [],
  };

  const priceInfo = calculateProductPrice(productWithPromos, 1);

  return {
    id: product.id,
    image,
    alt: product.name,
    name: product.name,
    currentPrice: priceInfo.transferPrice || "",
    originalPrice: priceInfo.originalPrice || "",
    discount: priceInfo.discount,
    priceNote: priceInfo.hasCardPrice ? PRICE_UI_TRANSFER_CAPTION : undefined,
    secondaryPrice: priceInfo.hasCardPrice ? priceInfo.cardPrice : undefined,
    secondaryPriceLabel: priceInfo.hasCardPrice ? PRICE_UI_CARD_CAPTION : undefined,
    isPriceLoading: false,
  };
}

export default function ClubBeneficiosContent({ initialProducts }: Props) {
  const searchParams = useSearchParams();
  const { locality } = useLocality();

  const [baseProducts, setBaseProducts] = useState<Product[]>(initialProducts || []);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [perPage, setPerPage] = useState(20);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);

  const searchQuery = searchParams?.get("search") || "";
  const pricesGen = useRef(0);

  // Reset cuando cambia la búsqueda / perPage
  useEffect(() => {
    setPage(1);
  }, [searchQuery, perPage]);

  // Cargar precios/promos por localidad
  useEffect(() => {
    const ids = baseProducts.map((p) => p.id).filter(Boolean);
    if (ids.length === 0) return;

    const gen = ++pricesGen.current;
    setIsLoadingPrices(true);
    (async () => {
      try {
        const prices = await fetchProductsPrices(ids, locality?.id);
        if (gen !== pricesGen.current) return;
        setBaseProducts((prev) => mergePrices(prev, prices));
      } catch {
        // silenciar
      } finally {
        if (gen === pricesGen.current) setIsLoadingPrices(false);
      }
    })();
  }, [locality?.id, baseProducts.length]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseProducts;
    return baseProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [baseProducts, searchQuery]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const getCreatedAt = (p: Product) => (p.created_at ? new Date(p.created_at).getTime() : 0);
    const getPrice = (p: Product) => (p.min_price && p.min_price > 0 ? p.min_price : Number.POSITIVE_INFINITY);

    arr.sort((a, b) => {
      switch (sortBy) {
        case "created_at":
          return getCreatedAt(a) - getCreatedAt(b);
        case "name":
          return a.name.localeCompare(b.name, "es");
        case "price_asc":
          return getPrice(a) - getPrice(b);
        case "price_desc":
          return getPrice(b) - getPrice(a);
        case "created_at_desc":
        default:
          return getCreatedAt(b) - getCreatedAt(a);
      }
    });
    return arr;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);

  const pageProducts = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, safePage, perPage]);

  const sortOptions = [
    { value: "created_at_desc", label: "Más recientes" },
    { value: "created_at", label: "Más antiguos" },
    { value: "name", label: "Nombre A-Z" },
    { value: "price_asc", label: "Precio: menor a mayor" },
    { value: "price_desc", label: "Precio: mayor a menor" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <nav className="mb-4 md:mb-6 overflow-x-auto">
          <ol className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 whitespace-nowrap">
            <li>
              <a href="/" className="hover:text-gray-900 transition-colors">
                Inicio
              </a>
            </li>
            <li>/</li>
            <li>
              <span className="text-gray-900 font-medium">Club Beneficios</span>
            </li>
            {searchQuery ? (
              <>
                <li>/</li>
                <li>
                  <span className="text-gray-900 font-medium">Búsqueda</span>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            {searchQuery ? "Resultados de búsqueda" : "Club Beneficios"}
          </h1>
          {searchQuery ? (
            <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">
              Buscando:{" "}
              <span className="font-semibold text-gray-900">
                &quot;{searchQuery}&quot;
              </span>
            </p>
          ) : null}
          <p className="text-sm md:text-base text-gray-600">
            {filtered.length}{" "}
            {filtered.length === 1 ? "producto encontrado" : "productos encontrados"}
          </p>
        </div>

        <div className="sticky top-[56px] md:top-[150px] z-30 bg-white -mx-4 px-4 pb-3 pt-3 md:pt-4 mb-4 md:mb-6 border-b border-gray-100 md:border-b-0">
          <div className="container mx-auto flex items-center justify-end md:justify-between">
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowPerPageMenu(!showPerPageMenu)}
                className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span>Mostrar: {perPage} por página</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    showPerPageMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showPerPageMenu ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPerPageMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[180px]">
                    {[20, 50, 100].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setPerPage(value);
                          setShowPerPageMenu(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          perPage === value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"
                        }`}
                      >
                        {value} por página
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span className="hidden md:inline">
                  Ordenar por: {sortOptions.find((o) => o.value === sortBy)?.label}
                </span>
                <span className="md:hidden">{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    showSortMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSortMenu ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[200px]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          sortBy === option.value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-base md:text-lg mb-2">No se encontraron productos</p>
                <p className="text-gray-500 text-xs md:text-sm text-center px-2">
                  {searchQuery
                    ? `No hay resultados para "${searchQuery}". Intenta con otros términos.`
                    : "Todavía no hay productos seleccionados para Club Beneficios."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-8 [&>*]:min-w-0">
                  {pageProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...productToCardProps(product, isLoadingPrices)}
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {safePage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
