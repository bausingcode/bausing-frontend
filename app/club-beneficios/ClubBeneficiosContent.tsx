"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { fetchProductsPrices, Product } from "@/lib/api";
import { useLocality } from "@/contexts/LocalityContext";
import { ChevronDown, Minus, Plus, SlidersHorizontal, X } from "lucide-react";
import {
  calculateProductPrice,
  productCardPriceDisplayFromPriceInfo,
  productHasPositiveListPrice,
  productListingPriceForSort,
} from "@/utils/priceUtils";
import { firstProductImageUrl } from "@/lib/productImagePlaceholder";

interface Props {
  initialProducts: Product[];
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  title: string;
  type: "radio" | "checkbox";
  options: FilterOption[];
}

// Categorías fijas del Club
const CLUB_CATEGORIES = [
  { key: "Colchones", label: "Colchones" },
  { key: "Sommiers", label: "Sommier" },
  { key: "Electrodomésticos", label: "Electro" },
];

// Filtros específicos por categoría (tomados del catálogo)
const categoryFilters: Record<string, FilterGroup[]> = {
  Colchones: [
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una plaza", label: "Una plaza" },
        { value: "plaza y media", label: "Plaza y media" },
        { value: "dos plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tecnología",
      type: "checkbox",
      options: [
        { value: "espuma alta densidad", label: "Espuma alta densidad" },
        { value: "resortes bicónicos", label: "Resortes bicónicos" },
        { value: "resortes pocket", label: "Resortes pocket" },
      ],
    },
    {
      title: "Nivel de firmeza",
      type: "checkbox",
      options: [
        { value: "soft", label: "Soft" },
        { value: "moderado", label: "Moderado" },
        { value: "firme", label: "Firme" },
        { value: "muy firme", label: "Muy firme" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80×190" },
        { value: "100x190", label: "100×190" },
        { value: "140x190", label: "140×190" },
        { value: "160x200", label: "160×200" },
        { value: "180x200", label: "180×200" },
        { value: "200x200", label: "200×200" },
      ],
    },
    {
      title: "Altura",
      type: "checkbox",
      options: [
        { value: "18cm", label: "18cm" },
        { value: "24cm", label: "24cm" },
        { value: "26cm", label: "26cm" },
        { value: "28cm", label: "28cm" },
        { value: "30cm", label: "30cm" },
        { value: "32cm", label: "32cm" },
        { value: "35cm", label: "35cm" },
      ],
    },
    {
      title: "Peso máximo por plaza",
      type: "checkbox",
      options: [
        { value: "85kg", label: "85kg" },
        { value: "90kg", label: "90kg" },
        { value: "100kg", label: "100kg" },
        { value: "110kg", label: "110kg" },
        { value: "120kg", label: "120kg" },
        { value: "150kg", label: "150kg" },
      ],
    },
  ],
  Sommiers: [
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una plaza", label: "Una plaza" },
        { value: "plaza y media", label: "Plaza y media" },
        { value: "dos plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tecnología",
      type: "checkbox",
      options: [
        { value: "espuma alta densidad", label: "Espuma alta densidad" },
        { value: "resortes bicónicos", label: "Resortes bicónicos" },
        { value: "resortes pocket", label: "Resortes pocket" },
      ],
    },
    {
      title: "Nivel de firmeza",
      type: "checkbox",
      options: [
        { value: "soft", label: "Soft" },
        { value: "moderado", label: "Moderado" },
        { value: "firme", label: "Firme" },
        { value: "muy firme", label: "Muy firme" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80×190" },
        { value: "100x190", label: "100×190" },
        { value: "140x190", label: "140×190" },
        { value: "160x200", label: "160×200" },
        { value: "180x200", label: "180×200" },
        { value: "200x200", label: "200×200" },
      ],
    },
    {
      title: "Altura",
      type: "checkbox",
      options: [
        { value: "18cm", label: "18cm" },
        { value: "24cm", label: "24cm" },
        { value: "26cm", label: "26cm" },
        { value: "28cm", label: "28cm" },
        { value: "30cm", label: "30cm" },
        { value: "32cm", label: "32cm" },
        { value: "35cm", label: "35cm" },
      ],
    },
    {
      title: "Peso máximo por plaza",
      type: "checkbox",
      options: [
        { value: "85kg", label: "85kg" },
        { value: "90kg", label: "90kg" },
        { value: "100kg", label: "100kg" },
        { value: "110kg", label: "110kg" },
        { value: "120kg", label: "120kg" },
        { value: "150kg", label: "150kg" },
      ],
    },
  ],
  "Electrodomésticos": [
    {
      title: "Tipo",
      type: "checkbox",
      options: [
        { value: "grandes electros", label: "Grandes electros" },
        { value: "pequeños electros", label: "Pequeños electros" },
      ],
    },
  ],
};

function priceRowForProduct(pricesData: Record<string, any>, productId: unknown) {
  if (productId == null || productId === "") return undefined;
  const s = String(productId).trim();
  if (pricesData[s]) return pricesData[s];
  const lower = s.toLowerCase();
  for (const k of Object.keys(pricesData)) {
    if (k.toLowerCase() === lower) return pricesData[k];
  }
  return undefined;
}

function mergePrices(products: Product[], pricesData: Record<string, any>): Product[] {
  return products.map((p) => {
    const priceInfo = priceRowForProduct(pricesData, p.id);
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
        : priceInfo.promos ? [priceInfo.promos] : [],
    };
  });
}

function productToCardProps(product: Product, isPriceLoading: boolean) {
  const image = firstProductImageUrl(product);
  const hasPrice = productHasPositiveListPrice(product);
  const outOfStock = product.has_crm_stock === false;

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
      outOfStock,
    };
  }

  const productWithPromos = { ...product, promos: Array.isArray(product.promos) ? product.promos : [] };
  const priceInfo = calculateProductPrice(productWithPromos, 1);
  const cardFields = productCardPriceDisplayFromPriceInfo(priceInfo);

  return {
    id: product.id, image, alt: product.name, name: product.name,
    currentPrice: cardFields.currentPrice || "",
    originalPrice: priceInfo.originalPrice || "",
    discount: priceInfo.discount,
    priceNote: cardFields.priceNote,
    secondaryPrice: cardFields.secondaryPrice,
    secondaryPriceLabel: cardFields.secondaryPriceLabel,
    isPriceLoading: false,
    outOfStock,
  };
}

export default function ClubBeneficiosContent({ initialProducts }: Props) {
  const searchParams = useSearchParams();
  const { locality, isLoading: localityLoading } = useLocality();

  const [baseProducts, setBaseProducts] = useState<Product[]>(initialProducts || []);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [perPage, setPerPage] = useState(20);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});
  const [priceRangeInput, setPriceRangeInput] = useState({ min: "", max: "" });
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [priceRangeError, setPriceRangeError] = useState("");

  const searchQuery = searchParams?.get("search") || "";
  const pricesGen = useRef(0);

  // Reset página cuando cambian filtros
  useEffect(() => { setPage(1); }, [searchQuery, perPage, selectedCategory, selectedFilters, priceRange]);

  // Limpiar filtros de grupo al cambiar categoría
  useEffect(() => {
    setSelectedFilters({});
    setOpenFilters({});
  }, [selectedCategory]);

  useEffect(() => {
    const ids = baseProducts
      .map((p) => (p.id != null && p.id !== "" ? String(p.id).trim() : ""))
      .filter(Boolean);
    if (ids.length === 0) return;

    const nonePricedYet = baseProducts.every((p) => !productHasPositiveListPrice(p));
    const gen = ++pricesGen.current;
    if (nonePricedYet) setIsLoadingPrices(true);
    (async () => {
      try {
        const prices = await fetchProductsPrices(ids, locality?.id);
        if (gen !== pricesGen.current) return;
        if (!prices || Object.keys(prices).length === 0) return;
        setBaseProducts((prev) => mergePrices(prev, prices));
      } catch { /* silenciar */ } finally {
        if (gen === pricesGen.current && nonePricedYet) setIsLoadingPrices(false);
      }
    })();
  }, [locality?.id, baseProducts.length]);

  const priceStillPending = (product: Product) => !productHasPositiveListPrice(product);

  const currentFilterGroups: FilterGroup[] = selectedCategory ? (categoryFilters[selectedCategory] ?? []) : [];

  const filtered = useMemo(() => {
    let result = [...baseProducts];

    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q));

    // Filtro de categoría
    if (selectedCategory) {
      result = result.filter((p) => p.category_name === selectedCategory);
    }

    // Filtros específicos de categoría (por nombre de producto)
    for (const [, values] of Object.entries(selectedFilters)) {
      if (values.length === 0) continue;
      result = result.filter((p) =>
        values.some((v) => p.name.toLowerCase().includes(v.toLowerCase()))
      );
    }

    // Filtro de precio
    if (priceRange.min !== null || priceRange.max !== null) {
      result = result.filter((p) => {
        const price = productListingPriceForSort(p);
        if (price <= 0) return true;
        if (priceRange.min !== null && price < priceRange.min) return false;
        if (priceRange.max !== null && price > priceRange.max) return false;
        return true;
      });
    }

    return result;
  }, [baseProducts, searchQuery, selectedCategory, selectedFilters, priceRange]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const getCreatedAt = (p: Product) => (p.created_at ? new Date(p.created_at).getTime() : 0);
    const getPrice = (p: Product) => productListingPriceForSort(p);
    arr.sort((a, b) => {
      switch (sortBy) {
        case "created_at": return getCreatedAt(a) - getCreatedAt(b);
        case "name": return a.name.localeCompare(b.name, "es");
        case "price_asc": return getPrice(a) - getPrice(b);
        case "price_desc": return getPrice(b) - getPrice(a);
        default: return getCreatedAt(b) - getCreatedAt(a);
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

  const activeGroupFiltersCount = Object.values(selectedFilters).flat().length;
  const hasActiveFilters = selectedCategory !== null || activeGroupFiltersCount > 0 || priceRange.min !== null || priceRange.max !== null;
  const activeFiltersCount = (selectedCategory ? 1 : 0) + activeGroupFiltersCount + (priceRange.min !== null ? 1 : 0) + (priceRange.max !== null ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedFilters({});
    setPriceRangeInput({ min: "", max: "" });
    setPriceRange({ min: null, max: null });
    setPriceRangeError("");
  };

  const toggleFilterOption = (groupTitle: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[groupTitle] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [groupTitle]: next };
    });
  };

  const handlePriceRangeApply = () => {
    setPriceRangeError("");
    const min = priceRangeInput.min ? parseFloat(priceRangeInput.min) : null;
    const max = priceRangeInput.max ? parseFloat(priceRangeInput.max) : null;
    if (min !== null && max !== null && min > max) {
      setPriceRangeError("El precio mínimo no puede ser mayor al máximo.");
      return;
    }
    setPriceRange({ min, max });
  };

  const handlePriceRangeClear = () => {
    setPriceRangeInput({ min: "", max: "" });
    setPriceRange({ min: null, max: null });
    setPriceRangeError("");
  };

  const toggleFilterGroup = (key: string) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const FiltersPanel = () => (
    <>
      {hasActiveFilters && (
        <div className="flex justify-start mb-4">
          <button onClick={clearAllFilters} className="text-sm text-[#00C1A7] hover:text-[#00A892] transition-colors">
            Limpiar
          </button>
        </div>
      )}

      {/* Rango de precios */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Rango de Precios</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={priceRangeInput.min}
              onChange={(e) => setPriceRangeInput((prev) => ({ ...prev, min: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") handlePriceRangeApply(); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 text-gray-900"
              min="0"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Máx"
              value={priceRangeInput.max}
              onChange={(e) => setPriceRangeInput((prev) => ({ ...prev, max: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") handlePriceRangeApply(); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 text-gray-900"
              min="0"
            />
          </div>
          {priceRangeError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{priceRangeError}</p>
          )}
          <div className="flex items-center gap-2">
            <button onClick={handlePriceRangeApply} className="flex-1 px-3 py-2 text-sm bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors">
              Aplicar
            </button>
            {(priceRange.min !== null || priceRange.max !== null) && (
              <button onClick={handlePriceRangeClear} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Limpiar
              </button>
            )}
          </div>
          {(priceRange.min !== null || priceRange.max !== null) && (
            <p className="text-xs text-gray-600">
              ${priceRange.min !== null ? priceRange.min.toLocaleString() : "0"} - ${priceRange.max !== null ? priceRange.max.toLocaleString() : "∞"}
            </p>
          )}
        </div>
      </div>

      {/* Categorías fijas */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <button
          onClick={() => toggleFilterGroup("Categoría")}
          className="flex items-center justify-between w-full text-left mb-3 group"
        >
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors flex items-center gap-2">
            Categoría
            {selectedCategory && <span className="text-xs font-medium text-[#00C1A7]">(1)</span>}
          </h3>
          {openFilters["Categoría"] ? <Minus className="w-4 h-4 text-gray-600 flex-shrink-0" /> : <Plus className="w-4 h-4 text-gray-600 flex-shrink-0" />}
        </button>
        {openFilters["Categoría"] && (
          <div className="space-y-2">
            {CLUB_CATEGORIES.map((cat) => (
              <label key={cat.key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="club-category"
                  checked={selectedCategory === cat.key}
                  onChange={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                  onClick={() => { if (selectedCategory === cat.key) setSelectedCategory(null); }}
                  className="w-4 h-4 text-[#00C1A7] border-gray-300 focus:ring-[#00C1A7]/20 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{cat.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Filtros específicos de la categoría seleccionada */}
      {currentFilterGroups.length > 0 && (
        <div className="space-y-4">
          {currentFilterGroups.map((group, index) => {
            const isOpen = openFilters[group.title] ?? false;
            const selectedCount = (selectedFilters[group.title] ?? []).length;
            return (
              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                <button
                  onClick={() => toggleFilterGroup(group.title)}
                  className="flex items-center justify-between w-full text-left mb-3 group"
                >
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors flex items-center gap-2">
                    {group.title}
                    {selectedCount > 0 && (
                      <span className="text-xs font-medium text-[#00C1A7]">({selectedCount})</span>
                    )}
                  </h3>
                  {isOpen ? <Minus className="w-4 h-4 text-gray-600 flex-shrink-0" /> : <Plus className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label key={option.value} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(selectedFilters[group.title] ?? []).includes(option.value)}
                          onChange={() => toggleFilterOption(group.title, option.value)}
                          className="w-5 h-5 text-[#00C1A7] focus:ring-[#00C1A7] focus:ring-2 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 md:mb-6 overflow-x-auto">
          <ol className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 whitespace-nowrap">
            <li><a href="/" className="hover:text-gray-900 transition-colors">Inicio</a></li>
            <li>/</li>
            <li><span className="text-gray-900 font-medium">Club Beneficios</span></li>
            {searchQuery && <><li>/</li><li><span className="text-gray-900 font-medium">Búsqueda</span></li></>}
          </ol>
        </nav>

        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            {searchQuery ? "Resultados de búsqueda" : "Club Beneficios"}
          </h1>
          {searchQuery && (
            <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">
              Buscando: <span className="font-semibold text-gray-900">&quot;{searchQuery}&quot;</span>
            </p>
          )}
          <p className="text-sm md:text-base text-gray-600">
            {filtered.length} {filtered.length === 1 ? "producto encontrado" : "productos encontrados"}
          </p>
        </div>

        {/* Barra sticky */}
        <div className="sticky top-[56px] md:top-[150px] z-30 bg-white -mx-4 px-4 pb-3 pt-3 md:pt-4 mb-4 md:mb-6 border-b border-gray-100 md:border-b-0">
          <div className="container mx-auto flex items-center">
            {/* Mobile: botón filtros */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-[#00C1A7] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Per page + Ordenar a la derecha */}
            <div className="flex items-center gap-[10px] ml-auto">
              <div className="relative">
                <button
                  onClick={() => setShowPerPageMenu(!showPerPageMenu)}
                  className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
                >
                  <span>Mostrar: {perPage} por página</span>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showPerPageMenu ? "rotate-180" : ""}`} />
                </button>
                {showPerPageMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPerPageMenu(false)} />
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[180px]">
                      {[20, 50, 100].map((value) => (
                        <button key={value} onClick={() => { setPerPage(value); setShowPerPageMenu(false); setPage(1); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${perPage === value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"}`}>
                          {value} por página
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
                >
                  <span className="hidden md:inline">Ordenar por: {sortOptions.find((o) => o.value === sortBy)?.label}</span>
                  <span className="md:hidden">{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[200px]">
                      {sortOptions.map((option) => (
                        <button key={option.value} onClick={() => { setSortBy(option.value); setShowSortMenu(false); setPage(1); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${sortBy === option.value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Layout: sidebar + productos */}
        <div className="grid grid-cols-12 gap-6">
          <aside className="hidden md:block col-span-12 lg:col-span-3 transition-all duration-300 ease-in-out">
            <div
              className="bg-white rounded-[10px] border border-gray-200 p-6 sticky top-[210px] overflow-y-auto custom-scrollbar"
              style={{ maxHeight: "calc(100vh - 12rem)", height: "fit-content" }}
            >
              <FiltersPanel />
            </div>
          </aside>

          <div className="col-span-12 lg:col-span-9">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-base md:text-lg mb-2">No se encontraron productos</p>
                <p className="text-gray-500 text-xs md:text-sm text-center px-2">
                  {searchQuery ? `No hay resultados para "${searchQuery}".` : "Probá con otros filtros o volvé más tarde."}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="mt-4 text-sm text-[#00C1A7] hover:underline">Limpiar filtros</button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 [&>*]:min-w-0">
                  {pageProducts.map((product) => (
                    <ProductCard
                      key={`${product.id}-${locality?.id ?? "no-locality"}`}
                      {...productToCardProps(product, isLoadingPrices || (localityLoading && priceStillPending(product)))}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">Página {safePage} de {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal filtros mobile */}
      {isMobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
              <p className="text-sm font-semibold text-gray-900">Filtros</p>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FiltersPanel />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-3 bg-[#00C1A7] text-white rounded-lg font-medium hover:bg-[#00A892] transition-colors">
                Ver {filtered.length} productos
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
