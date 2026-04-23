"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { firstProductImageUrl } from "@/lib/productImagePlaceholder";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchProducts, fetchProductsAllPages, fetchCategories, Product, Category } from "@/lib/api";
import { useLocality } from "@/contexts/LocalityContext";
import { ChevronDown, Minus, Plus, SlidersHorizontal, X } from "lucide-react";
import {
  calculateProductPrice,
  productCardPriceDisplayFromPriceInfo,
} from "@/utils/priceUtils";

/** Default 21 = 7 filas de 3 columnas; el resto múltiplos de 3. */
const CATALOGO_PER_PAGE_DEFAULT = 21;
const CATALOGO_PER_PAGE_OPTIONS: readonly number[] = [21, 30, 45, 60, 99];

// ============================================
// MODULE-LEVEL CATEGORY CACHE
// Evita re-fetchear categorías en cada navegación de catálogo
// ============================================
let _categoriesPromise: Promise<Category[]> | null = null;
let _categoriesCache: Category[] | null = null;

function getCategoriesOnce(): Promise<Category[]> {
  if (_categoriesCache) return Promise.resolve(_categoriesCache);
  if (!_categoriesPromise) {
    _categoriesPromise = fetchCategories(true)
      .then(cats => { _categoriesCache = cats; return cats; })
      .catch(() => []);
  }
  return _categoriesPromise;
}

// Pre-iniciar el fetch de categorías en cuanto carga el módulo (client-side)
if (typeof window !== "undefined") {
  getCategoriesOnce();
}
// Mapeo de slugs a nombres de categorías (fallback si no se cargan desde la API)
const categorySlugMap: Record<string, string> = {
  "colchones": "Colchones",
  "sommiers": "Sommiers",
  "accesorios": "Accesorios",
  "electrodomesticos": "Electrodomésticos",
  "muebles-cocina": "Muebles de cocina",
};

/** Igual que al indexar categorías en categoryIdMap: nombre de fila → segmento de URL */
function categoryNameToPathSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function findCategoryByPathSlug(categoriesList: Category[], pathSlug: string): Category | null {
  for (const c of categoriesList) {
    if (c.id === pathSlug) return c;
    if (categoryNameToPathSlug(c.name) === pathSlug) return c;
  }
  return null;
}

// Estructura de filtros por categoría
interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  title: string;
  /** Clave en `selectedFilters` / `openFilters`; default `title` (evita colisión p. ej. otra "Tecnología" en otra categoría) */
  id?: string;
  type: "radio" | "checkbox";
  options: FilterOption[];
}

function filterGroupStorageKey(g: FilterGroup): string {
  return g.id ?? g.title;
}

type CategoryFilters = Record<string, FilterGroup[]>;

/** Misma lógica de atributos de colchón (firmeza, etc.) que en /catalogo/colchones */
function normalizeCategoryCatalogName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isColchonStyleCatalogCategory(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = normalizeCategoryCatalogName(name);
  if (n === "colchones") return true;
  return n.includes("sommier") && n.includes("colchon");
}

const CATEGORY_OPTION_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Log de filtro Tecnología / colchón (siempre activo) */
function debugCatalogoTecnologia(msg: string, data?: unknown) {
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[catálogo][Tecnología] ${msg}`, data);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[catálogo][Tecnología] ${msg}`);
  }
}

/**
 * Misma clave lógica para cada campo: en la DB suelen venir con mayúsculas como
 * "Resortes Pocket", "Espuma de alta densidad", etc. — comparación case-insensitive.
 */
function normalizeEstructuraRellenoSegment(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** Texto unificado: filling_type + valores de category_option (por si el dato vino de subcategoría). */
function combinedEstructuraRellenoSearchBlob(product: Product): string {
  const parts: string[] = [];
  if (product.filling_type?.trim()) {
    parts.push(normalizeEstructuraRellenoSegment(product.filling_type));
  }
  if (product.category_option_value?.trim()) {
    parts.push(normalizeEstructuraRellenoSegment(product.category_option_value));
  }
  for (const sc of product.subcategories ?? []) {
    if (sc.category_option_value?.trim()) {
      parts.push(normalizeEstructuraRellenoSegment(sc.category_option_value));
    }
  }
  return parts.filter(Boolean).join(" | ");
}

/** Coincide con el nombre exacto "Espuma de alta densidad" (y variantes de tildes/mayúsculas). */
function isEspumaDeAltaDensidadText(n: string): boolean {
  return (
    n.includes("espuma") &&
    n.includes("alta") &&
    (n.includes("dens") || n.includes("densi"))
  );
}

/**
 * Nombres canónicos (minúsculas, sin tildes) = mismas palabras y mayúsculas
 * de referencia: "Resortes Bicónicos", "Espuma", "Espuma de alta densidad", "Resortes Pocket".
 */
const ESTRUCTURA_RELLENO_CANONICAL: Record<string, string> = {
  "resortes-biconicos": "resortes biconicos",
  "espuma": "espuma",
  "espuma-de-alta-densidad": "espuma de alta densidad",
  "espuma-alta-densidad": "espuma de alta densidad",
  "resortes-pocket": "resortes pocket",
};

/**
 * Valores de filtro alineados a los nombres exactos en el catálogo / admin:
 * Resortes Bicónicos, Espuma, Espuma de alta densidad, Resortes Pocket
 */
function estructuraRellenoSlugMatchesNormalized(n: string, slug: string): boolean {
  const canonical = ESTRUCTURA_RELLENO_CANONICAL[slug];
  if (canonical) {
    for (const seg of n.split(" | ")) {
      const t = seg.trim();
      if (t === canonical) return true;
    }
  }

  if (slug === "resortes-biconicos") {
    if (n === "resortes biconicos" || n.includes("resortes biconicos")) return true;
    return n.includes("bicon");
  }
  if (slug === "resortes-pocket") {
    if (n === "resortes pocket" || n.includes("resortes pocket")) return true;
    return n.includes("pocket");
  }
  if (slug === "espuma-de-alta-densidad" || slug === "espuma-alta-densidad") {
    return isEspumaDeAltaDensidadText(n);
  }
  if (slug === "espuma") {
    return n.includes("espuma") && !isEspumaDeAltaDensidadText(n);
  }
  return false;
}

/** Coincide con opción de estructura: UUID (category_option) o slugs del catálogo vs texto libre en producto. */
function productMatchesEstructuraRellenoFilterValue(product: Product, value: string): boolean {
  if (CATEGORY_OPTION_ID_UUID_RE.test(value)) {
    if (product.category_option_id === value) return true;
    return product.subcategories?.some((s) => s.category_option_id === value) ?? false;
  }
  const n = combinedEstructuraRellenoSearchBlob(product);
  if (!n) return false;
  return estructuraRellenoSlugMatchesNormalized(n, value);
}

const TECHNICAL_FILTER_KEYS = [
  "colchon-tecnologia",
  "Firmeza",
  "Peso Máximo Soportado",
  "Pillow Top",
  "Tipo de Entrega",
] as const;

type PriceRange = { min: number | null; max: number | null };

/** Pool completo (fetchProductsAllPages) solo si hace falta lógica que aún no está en GET /products. */
function catalogNeedsFullClientPool(
  selectedFilters: Record<string, string[]>,
  priceRange: PriceRange
): boolean {
  const nonEmpty = Object.entries(selectedFilters).filter(([, v]) => v.length > 0);
  if (nonEmpty.length === 0) {
    return false;
  }
  const categoryKeys: string[] = [];
  const technicalKeys: string[] = [];
  for (const [k] of nonEmpty) {
    if (TECHNICAL_FILTER_KEYS.includes(k as (typeof TECHNICAL_FILTER_KEYS)[number])) {
      technicalKeys.push(k);
    } else {
      categoryKeys.push(k);
    }
  }
  if (categoryKeys.length > 0) {
    return true;
  }
  const techOther = technicalKeys.filter((t) => t !== "colchon-tecnologia");
  if (techOther.length > 0) {
    return true;
  }
  return false;
}

/**
 * Aplica rango de precio + opciones de categoría + filtros técnicos de colchón sobre un array completo.
 * Una sola pasada por tipo de criterio (sin re-buscar por páginas en la API).
 */
function applyCatalogClientFilters(
  products: Product[],
  priceRange: PriceRange,
  selectedFilters: Record<string, string[]>
): Product[] {
  if (products.length === 0) return [];

  const hasSelection =
    Object.values(selectedFilters).some((a) => a.length > 0) ||
    priceRange.min !== null ||
    priceRange.max !== null;
  if (!hasSelection) return products;

  let out = products;

  if (priceRange.min !== null || priceRange.max !== null) {
    out = out.filter((product) => {
      const productMinPrice = product.min_price ?? null;
      const productMaxPrice = product.max_price ?? productMinPrice;
      if (productMinPrice === null || productMinPrice === undefined) {
        return false;
      }
      const minPrice = productMinPrice;
      const maxPrice = productMaxPrice ?? productMinPrice;
      if (priceRange.min !== null && maxPrice < priceRange.min) {
        return false;
      }
      if (priceRange.max !== null && minPrice > priceRange.max) {
        return false;
      }
      return true;
    });
  }

  const categoryOptionFilters: Record<string, string[]> = {};
  const technicalFilters: Record<string, string[]> = {};
  Object.entries(selectedFilters).forEach(([k, v]) => {
    if (TECHNICAL_FILTER_KEYS.includes(k as (typeof TECHNICAL_FILTER_KEYS)[number])) {
      technicalFilters[k] = v;
    } else {
      categoryOptionFilters[k] = v;
    }
  });

  if (Object.keys(categoryOptionFilters).length > 0) {
    const allSelectedOptionIds = new Set<string>();
    Object.values(categoryOptionFilters).forEach((values) => {
      values.forEach((id) => allSelectedOptionIds.add(id));
    });
    if (allSelectedOptionIds.size > 0) {
      out = out.filter((product) => {
        if (product.category_option_id && allSelectedOptionIds.has(product.category_option_id)) {
          return true;
        }
        if (product.subcategories && product.subcategories.length > 0) {
          return product.subcategories.some(
            (subcat) => subcat.category_option_id && allSelectedOptionIds.has(subcat.category_option_id)
          );
        }
        return false;
      });
    }
  }

  for (const [filterKey, selectedValues] of Object.entries(technicalFilters)) {
    if (selectedValues.length === 0) continue;
    if (filterKey === "colchon-tecnologia") {
      debugCatalogoTecnologia("aplicar filtro", { selectedValues, productosAntes: out.length });
      out.slice(0, 4).forEach((p) => {
        const blob = combinedEstructuraRellenoSearchBlob(p);
        const perValue = selectedValues.map((v) => ({
          value: v,
          match: productMatchesEstructuraRellenoFilterValue(p, v),
        }));
        debugCatalogoTecnologia("muestra producto", {
          id: p.id,
          name: p.name,
          filling_type: p.filling_type,
          category_option_value: p.category_option_value,
          blobNormalizado: blob,
          perValue,
          pasa: perValue.some((x) => x.match),
        });
      });
      const before = out.length;
      out = out.filter((product) =>
        selectedValues.some((value) => productMatchesEstructuraRellenoFilterValue(product, value))
      );
      debugCatalogoTecnologia("resultado", { productosDespues: out.length, filtradoDesde: before });
    }
    if (filterKey === "Firmeza") {
      out = out.filter((product) => {
        if (!product.mattress_firmness) return false;
        const productFirmness = product.mattress_firmness.toUpperCase().trim();
        return selectedValues.some((value) => {
          const valueMap: Record<string, string[]> = {
            soft: ["SOFT"],
            medio: ["MEDIO"],
            firme: ["FIRME"],
          };
          const possibleValues = valueMap[value] || [value.toUpperCase()];
          return possibleValues.includes(productFirmness);
        });
      });
    }
    if (filterKey === "Peso Máximo Soportado") {
      out = out.filter((product) => {
        const maxWeightKg = product.max_supported_weight_kg;
        if (!maxWeightKg) return false;
        return selectedValues.some((value) => {
          if (value === "150+") {
            return maxWeightKg >= 150;
          }
          const maxWeight = parseInt(value, 10);
          return maxWeightKg <= maxWeight && maxWeightKg > maxWeight - 15;
        });
      });
    }
    if (filterKey === "Pillow Top") {
      out = out.filter((product) => {
        const hasPillowTop = product.has_pillow_top === true;
        return selectedValues.some((value) => {
          if (value === "true") return hasPillowTop;
          if (value === "false") return !hasPillowTop;
          return false;
        });
      });
    }
    if (filterKey === "Tipo de Entrega") {
      out = out.filter((product) => {
        const isBedInBox = product.is_bed_in_box === true;
        return selectedValues.some((value) => {
          if (value === "true") return isBedInBox;
          if (value === "false") return !isBedInBox;
          return false;
        });
      });
    }
  }
  return out;
}

const COLCHON_TECNOLOGIA_FILTER: FilterGroup = {
  id: "colchon-tecnologia",
  title: "Tecnología",
  type: "checkbox",
  options: [
    { value: "resortes-biconicos", label: "Resortes Bicónicos" },
    { value: "espuma", label: "Espuma" },
    { value: "espuma-de-alta-densidad", label: "Espuma de alta densidad" },
    { value: "resortes-pocket", label: "Resortes Pocket" },
  ],
};

const categoryFilters: CategoryFilters = {
  "Colchones": [
    COLCHON_TECNOLOGIA_FILTER,
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Nivel de firmeza",
      type: "checkbox",
      options: [
        { value: "soft", label: "Soft" },
        { value: "moderado", label: "Moderado" },
        { value: "firme", label: "Firme" },
        { value: "muy-firme", label: "Muy firme" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80*190" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "180x200", label: "180*200" },
        { value: "200x200", label: "200*200" },
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
  "Sommiers": [
    COLCHON_TECNOLOGIA_FILTER,
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Nivel de firmeza",
      type: "checkbox",
      options: [
        { value: "soft", label: "Soft" },
        { value: "moderado", label: "Moderado" },
        { value: "firme", label: "Firme" },
        { value: "muy-firme", label: "Muy firme" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80*190" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "180x200", label: "180*200" },
        { value: "200x200", label: "200*200" },
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
  "Respaldos": [
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tela",
      type: "checkbox",
      options: [
        { value: "ecocuero", label: "Ecocuero" },
        { value: "alpha-anti-desgarro", label: "Alpha anti desgarro" },
        { value: "pana", label: "Pana" },
        { value: "lino", label: "Lino" },
      ],
    },
    {
      title: "Modelo",
      type: "checkbox",
      options: [
        { value: "capitone", label: "Capitoné" },
        { value: "falso-capitone", label: "Falso capitoné" },
        { value: "listones-verticales", label: "Listones verticales" },
        { value: "liso", label: "Liso" },
      ],
    },
    {
      title: "Medida",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80*190" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "180x200", label: "180*200" },
        { value: "200x200", label: "200*200" },
      ],
    },
    {
      title: "Color",
      type: "checkbox",
      options: [
        { value: "negro", label: "Negro" },
        { value: "beige", label: "Beige" },
        { value: "gris", label: "Gris" },
      ],
    },
  ],
  "Accesorios": [
    {
      title: "Subcategorías",
      type: "checkbox",
      options: [
        { value: "sabanas", label: "Sábanas" },
        { value: "cubre-colchon", label: "Cubre colchón" },
        { value: "almohadas", label: "Almohadas" },
        { value: "acolchados", label: "Acolchados" },
      ],
    },
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tecnología",
      type: "checkbox",
      options: [
        { value: "espuma-viscoelastica", label: "Espuma viscoelástica" },
        { value: "vellon-siliconado", label: "Vellón siliconado" },
      ],
    },
    {
      title: "Modelo",
      type: "checkbox",
      options: [
        { value: "almohada-viscoelastica-maxiking", label: "Almohada Viscoelástica MaxiKing" },
        { value: "almohada-viscoelastica-bardo", label: "Almohada Viscoelástica Bardó" },
        { value: "almohada-viscoelastica-natural-soft-standard", label: "Almohada Viscoelástica Natural Soft - Standard" },
        { value: "almohada-viscoelastica-natural-soft-cervical", label: "Almohada Viscoelástica Natural Soft - Cervical" },
        { value: "almohada-viscoelastica-paris-king", label: "Almohada Viscoelástica Paris - King" },
        { value: "almohada-supreme", label: "Almohada Supreme" },
        { value: "almohada-premium-grandes", label: "Almohada Premium - Grandes" },
        { value: "almohada-premium-standard", label: "Almohada Premium - Standard" },
        { value: "almohada-estrella", label: "Almohada Estrella" },
        { value: "sabanas-praga", label: "Sábanas Praga" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "45x70", label: "45 X 70" },
        { value: "40x60", label: "40 X 60" },
        { value: "50x70", label: "50 X 70" },
        { value: "50x90", label: "50 X 90" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "200x200", label: "200*200" },
      ],
    },
    {
      title: "Color",
      type: "checkbox",
      options: [
        { value: "claro", label: "Claro" },
        { value: "oscuro", label: "Oscuro" },
      ],
    },
    {
      title: "Hilos",
      type: "checkbox",
      options: [
        { value: "500", label: "500" },
      ],
    },
  ],
  "Electrodomésticos": [
    {
      title: "Tipo",
      type: "checkbox",
      options: [
        { value: "grandes-electros", label: "Grandes electros" },
        { value: "pequenos-electros", label: "Pequeños electros" },
      ],
    },
  ],
  "Muebles de cocina": [
    {
      title: "Ancho",
      type: "checkbox",
      options: [
        { value: "120cm", label: "120cm" },
        { value: "140cm", label: "140cm" },
      ],
    },
    {
      title: "Color",
      type: "checkbox",
      options: [
        { value: "blanco", label: "Blanco" },
        { value: "gris", label: "Gris" },
      ],
    },
  ],
};

interface CatalogoContentProps {
  initialProducts?: Product[];
  initialTotalPages?: number;
  initialTotal?: number;
  initialCategories?: Category[];
  initialCategoryIdMap?: Record<string, string>;
}

export default function CatalogoContent({
  initialProducts = [],
  initialTotalPages = 1,
  initialTotal = 0,
  initialCategories = [],
  initialCategoryIdMap = {},
}: CatalogoContentProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string[];
  const { locality, isLoading: localityLoading } = useLocality();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [productsTotalCount, setProductsTotalCount] = useState(initialTotal);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [perPage, setPerPage] = useState(CATALOGO_PER_PAGE_DEFAULT);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [categoryIdMap, setCategoryIdMap] = useState<Record<string, string>>(initialCategoryIdMap);
  const [isLoadingCategories, setIsLoadingCategories] = useState(initialCategories.length === 0);

  // Saltear el primer fetch de productos solo si tenemos datos del servidor
  // y estamos en la misma página (mismo slug) que cuando se montó
  const initialSlugRef = useRef<string | undefined>(slug?.join('/'));
  const skipFirstProductFetch = useRef(initialProducts.length > 0);
  /** Catálogo sin filtrar (misma categoría/búsqueda/orden/localidad) para filtrar en cliente sin perder ítems por página */
  const catalogProductPoolRef = useRef<{ key: string; products: Product[] } | null>(null);

  // Resetear estado cuando cambia el slug (navegación del lado del cliente)
  useEffect(() => {
    const currentSlug = slug?.join('/');
    if (currentSlug !== initialSlugRef.current) {
      // Si el slug cambió, resetear todo y cargar productos nuevos
      skipFirstProductFetch.current = false;
      initialSlugRef.current = currentSlug;
      catalogProductPoolRef.current = null;
      // Resetear productos y página cuando cambia la categoría
      setProducts([]);
      setPage(1);
      setTotalPages(1);
      setProductsTotalCount(0);
    }
  }, [slug]);
  
  // Estado para rango de precios
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [priceRangeInput, setPriceRangeInput] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [priceRangeError, setPriceRangeError] = useState<string | null>(null);
  
  // Obtener el término de búsqueda de la URL
  const searchQuery = searchParams?.get("search") || "";
  
  // Obtener el filtro inicial de la URL
  const initialFilterId = searchParams?.get("filter") || null;
  
  // Cargar categorías con opciones al inicio - usa cache de módulo para evitar re-fetchear
  useEffect(() => {
    // Si ya tenemos categorías del servidor (SSR), populamos el cache y salimos
    if (initialCategories.length > 0) {
      if (!_categoriesCache) {
        _categoriesCache = initialCategories;
        _categoriesPromise = Promise.resolve(initialCategories);
      }
      setIsLoadingCategories(false);
      return;
    }

    const loadCategories = async () => {
      // Si ya están en el cache local de React, no volver a cargar
      if (_categoriesCache && categories.length === _categoriesCache.length) return;

      try {
        setIsLoadingCategories(true);
        const allCats = await getCategoriesOnce();
        
        setCategories(allCats);
        
        const nameToIdMap: Record<string, string> = {};
        const slugToIdMap: Record<string, string> = {};
        
        allCats.forEach(cat => {
          const normalizedName = cat.name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          nameToIdMap[normalizedName] = cat.id;
          nameToIdMap[cat.name.toLowerCase()] = cat.id;
          
          const catSlug = cat.name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          slugToIdMap[catSlug] = cat.id;
        });
        
        setCategoryIdMap({ ...nameToIdMap, ...slugToIdMap });
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    // Si el cache ya está listo (pre-cargado al importar el módulo), carga inmediatamente
    if (_categoriesCache) {
      const allCats = _categoriesCache;
      setCategories(allCats);
      const nameToIdMap: Record<string, string> = {};
      const slugToIdMap: Record<string, string> = {};
      allCats.forEach(cat => {
        const normalizedName = cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        nameToIdMap[normalizedName] = cat.id;
        nameToIdMap[cat.name.toLowerCase()] = cat.id;
        const catSlug = cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        slugToIdMap[catSlug] = cat.id;
      });
      setCategoryIdMap({ ...nameToIdMap, ...slugToIdMap });
      setIsLoadingCategories(false);
    } else {
      loadCategories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Filtros dinámicos - usando un objeto para almacenar todos los filtros seleccionados
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  
  // Estado para controlar qué filtros están abiertos/cerrados (todos cerrados por defecto)
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});
  
  // Estado para saber si se están aplicando filtros iniciales
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  
  // Función para toggle de cada filtro
  const toggleFilter = (filterTitle: string) => {
    setOpenFilters(prev => ({
      ...prev,
      [filterTitle]: !prev[filterTitle]
    }));
  };
  
  // Determinar la categoría y subcategoría desde el slug
  const getCategoryInfo = () => {
    // Si no hay slug o es un array vacío, retornar valores nulos
    if (!slug || !Array.isArray(slug) || slug.length === 0) {
      return { categoryName: null, categoryId: null, subcategoryId: null, subcategoryName: null, subcategory2Name: null, category: null };
    }
    
    const mainCategorySlug = slug[0];
    
    // Buscar el category_id correspondiente desde el slug
    let categoryId: string | null = null;
    let category: Category | null = null;
    
    if (categoryIdMap && Object.keys(categoryIdMap).length > 0) {
      // Intentar encontrar por slug
      categoryId = categoryIdMap[mainCategorySlug] || null;
      
      // Si no se encuentra por slug, intentar por nombre normalizado
      if (!categoryId) {
        const categoryName = categorySlugMap[mainCategorySlug] || mainCategorySlug;
        const normalizedName = categoryName.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        categoryId = categoryIdMap[normalizedName] || categoryIdMap[categoryName.toLowerCase()] || null;
      }
      
      // Encontrar el objeto Category completo
      if (categoryId) {
        category = categories.find(c => c.id === categoryId) || null;
      }
    }
    
    const categoryName = category?.name || categorySlugMap[mainCategorySlug] || mainCategorySlug;
    let subcategoryId: string | null = null;
    let subcategoryName: string | null = null;
    let subcategory2Name: string | null = null;
    
    // Subcategorías: solo filas reales bajo la categoría principal; si en DB no hay hijas, no mostrar ninguna
    if (slug.length >= 2) {
      const subcategorySlug = slug[1];
      if (categoryId) {
        const underParent = categories.filter((c) => c.parent_id === categoryId);
        if (underParent.length > 0) {
          const subcategory = findCategoryByPathSlug(underParent, subcategorySlug);
          if (subcategory) {
            subcategoryId = subcategory.id;
            subcategoryName = subcategory.name;
          }
        }
      } else {
        const sc = findCategoryByPathSlug(categories, subcategorySlug);
        if (sc?.parent_id) {
          subcategoryId = sc.id;
          subcategoryName = sc.name;
        }
      }

      if (slug.length >= 3) {
        const subcategory2Slug = slug[2];
        if (subcategoryId) {
          const underSub = categories.filter((c) => c.parent_id === subcategoryId);
          if (underSub.length > 0) {
            const sub2 = findCategoryByPathSlug(underSub, subcategory2Slug);
            if (sub2) {
              subcategory2Name = sub2.name;
            }
          }
        } else {
          const s2 = findCategoryByPathSlug(categories, subcategory2Slug);
          if (s2?.parent_id) {
            subcategory2Name = s2.name;
          }
        }
      }
    }
    
    return { categoryName, categoryId, subcategoryId, subcategoryName, subcategory2Name, category };
  };
  
  // Recalcular categoryInfo cuando cambian las categorías o el slug
  const categoryInfo = getCategoryInfo();
  const { categoryName, categoryId, subcategoryId, subcategoryName, subcategory2Name, category } = categoryInfo;
  
  // Aplicar filtro inicial desde la URL cuando las categorías se cargan
  useEffect(() => {
    if (initialFilterId && categories.length > 0 && Object.keys(categoryIdMap).length > 0 && !isLoadingCategories) {
      setIsApplyingFilter(true);
      
      // Buscar la opción en todas las categorías y subcategorías
      let foundOption = null;
      let foundFilterGroup = null;
      
      // Buscar en la categoría principal
      if (categoryId) {
        const mainCategory = categories.find(c => c.id === categoryId);
        if (mainCategory && mainCategory.options) {
          const option = mainCategory.options.find(opt => opt.id === initialFilterId);
          if (option) {
            foundOption = option;
            foundFilterGroup = mainCategory.name;
          }
        }
      }
      
      // Si no se encontró, buscar en las subcategorías
      if (!foundOption && categoryId) {
        const subcategories = categories.filter(c => c.parent_id === categoryId);
        for (const subcat of subcategories) {
          if (subcat.options) {
            const option = subcat.options.find(opt => opt.id === initialFilterId);
            if (option) {
              foundOption = option;
              foundFilterGroup = subcat.name;
              break;
            }
          }
        }
      }
      
      // Si se encontró la opción, aplicar el filtro
      if (foundOption && foundFilterGroup) {
        setSelectedFilters(prev => {
          // Solo aplicar si no está ya aplicado para evitar loops
          if (prev[foundFilterGroup]?.includes(initialFilterId)) {
            setIsApplyingFilter(false);
            return prev;
          }
          return {
            ...prev,
            [foundFilterGroup]: [initialFilterId]
          };
        });
        // Abrir el filtro automáticamente
        setOpenFilters(prev => ({
          ...prev,
          [foundFilterGroup]: true
        }));
      }
      
      // Marcar como completado después de un pequeño delay para permitir que el estado se actualice
      setTimeout(() => {
        setIsApplyingFilter(false);
      }, 100);
    } else if (!initialFilterId) {
      setIsApplyingFilter(false);
    }
  }, [initialFilterId, categories, categoryIdMap, isLoadingCategories, categoryId, subcategoryId]);
  
  // Construir filtros dinámicamente desde las opciones de categoría
  const buildDynamicFilters = () => {
    const filters: FilterGroup[] = [];
    
    if (!category && !subcategoryId) return filters;
    
    // Si hay subcategoría seleccionada, mostrar solo las opciones de esa subcategoría
    if (subcategoryId) {
      const subcategory = categories.find(c => c.id === subcategoryId);
      if (subcategory && subcategory.options && subcategory.options.length > 0) {
        filters.push({
          title: subcategory.name,
          type: "checkbox" as const,
          options: subcategory.options.map(opt => ({
            value: opt.id,
            label: opt.value
          }))
        });
      }
    } else if (categoryId && category) {
      // Si estamos en una categoría principal, agrupar opciones por subcategoría
      const subcategories = categories.filter(c => c.parent_id === categoryId);
      
      // Si hay subcategorías, agrupar opciones por subcategoría
      if (subcategories.length > 0) {
        subcategories
          .filter(subcat => subcat.options && subcat.options.length > 0)
          .forEach(subcat => {
            filters.push({
              title: subcat.name,
              type: "checkbox" as const,
              options: subcat.options!.map(opt => ({
                value: opt.id,
                label: opt.value
              }))
            });
          });
      } else if (category.options && category.options.length > 0) {
        // Si no hay subcategorías pero la categoría principal tiene opciones, mostrarlas
        filters.push({
          title: category.name,
          type: "checkbox" as const,
          options: category.options.map(opt => ({
            value: opt.id,
            label: opt.value
          }))
        });
      }
    }
    
    // Filtros técnicos: colchones y catálogos equivalentes (p. ej. sommier + colchón)
    if (isColchonStyleCatalogCategory(categoryName) || isColchonStyleCatalogCategory(category?.name)) {
      // Tecnología (filling_type) al inicio (antes de subcategorías API y de firmeza/peso, etc.)
      filters.unshift(COLCHON_TECNOLOGIA_FILTER);
      // Firmeza (mattress_firmness)
      filters.push({
        title: "Firmeza",
        type: "checkbox" as const,
        options: [
          { value: "soft", label: "Soft" },
          { value: "medio", label: "Medio" },
          { value: "firme", label: "Firme" }
        ]
      });
      
      // Peso máximo soportado (max_supported_weight_kg)
      filters.push({
        title: "Peso Máximo Soportado",
        type: "checkbox" as const,
        options: [
          { value: "85", label: "Hasta 85 kg" },
          { value: "90", label: "Hasta 90 kg" },
          { value: "100", label: "Hasta 100 kg" },
          { value: "110", label: "Hasta 110 kg" },
          { value: "120", label: "Hasta 120 kg" },
          { value: "150", label: "Hasta 150 kg" },
          { value: "150+", label: "Más de 150 kg" }
        ]
      });
      
      // Con pillow top (has_pillow_top)
      filters.push({
        title: "Pillow Top",
        type: "checkbox" as const,
        options: [
          { value: "true", label: "Con pillow top" },
          { value: "false", label: "Sin pillow top" }
        ]
      });
      
      // Colchón en caja (is_bed_in_box)
      filters.push({
        title: "Tipo de Entrega",
        type: "checkbox" as const,
        options: [
          { value: "true", label: "Colchón en caja" },
          { value: "false", label: "Colchón tradicional" }
        ]
      });
    }
    
    return filters;
  };
  
  // Obtener filtros para la categoría actual (dinámicos o hardcoded como fallback)
  const builtFilters = buildDynamicFilters();
  const staticFiltersForCategory =
    categoryName &&
    (categoryFilters[categoryName] ??
      (isColchonStyleCatalogCategory(categoryName) ? categoryFilters["Colchones"] : undefined));

  const hasNoDbSubcategoriesForMain =
    !isLoadingCategories &&
    categoryId != null &&
    !categories.some((c) => c.parent_id === categoryId);
  const staticFiltersWithoutFakeSubcategorias =
    staticFiltersForCategory && hasNoDbSubcategoriesForMain
      ? staticFiltersForCategory.filter((g) => g.title !== "Subcategorías")
      : staticFiltersForCategory;

  const currentFilters =
    builtFilters.length > 0
      ? builtFilters
      : (categoryName ? staticFiltersWithoutFakeSubcategorias || [] : []);
  
  // Función para manejar cambios en filtros
  const handleFilterChange = (filterTitle: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const key = filterTitle;
      const currentValues = prev[key] || [];
      
      if (checked) {
        return { ...prev, [key]: [...currentValues, value] };
      } else {
        return { ...prev, [key]: currentValues.filter(v => v !== value) };
      }
    });
    setPage(1); // Resetear a la primera página cuando cambian los filtros
  };
  
  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSelectedFilters({});
    setPriceRange({ min: null, max: null });
    setPriceRangeInput({ min: "", max: "" });
    setPage(1);
  };
  
  // Verificar si hay filtros activos
  const hasActiveFilters = Object.values(selectedFilters).some(values => values.length > 0) || 
                          priceRange.min !== null || 
                          priceRange.max !== null;
  
  // Función para aplicar el rango de precios
  const handlePriceRangeApply = () => {
    // Limpiar error anterior
    setPriceRangeError(null);
    
    const min = priceRangeInput.min && priceRangeInput.min.trim() !== "" 
      ? parseFloat(priceRangeInput.min) 
      : null;
    const max = priceRangeInput.max && priceRangeInput.max.trim() !== "" 
      ? parseFloat(priceRangeInput.max) 
      : null;
    
    // Validar que min no sea mayor que max
    if (min !== null && max !== null && min > max) {
      setPriceRangeError("El precio mínimo no puede ser mayor que el precio máximo");
      return;
    }
    
    // Validar que los valores sean positivos
    if ((min !== null && (isNaN(min) || min < 0)) || (max !== null && (isNaN(max) || max < 0))) {
      setPriceRangeError("Los precios deben ser valores numéricos positivos");
      return;
    }
    
    // Actualizar el rango de precios (esto disparará la recarga automática por el useEffect)
    setPriceRange({ min, max });
    setPage(1);
  };
  
  // Función para limpiar el rango de precios
  const handlePriceRangeClear = () => {
    setPriceRange({ min: null, max: null });
    setPriceRangeInput({ min: "", max: "" });
    setPriceRangeError(null);
    setPage(1);
  };
  
  // Resetear página cuando cambia la búsqueda, categoría o perPage
  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryId, perPage]);
  
  // Construir breadcrumbs
  const breadcrumbs = [
    { name: "Inicio", href: "/" },
    ...(searchQuery ? [{ name: "Búsqueda", href: `/catalogo?search=${encodeURIComponent(searchQuery)}` }] : []),
    ...(categoryName && !searchQuery && slug && slug.length > 0 ? [{ name: categoryName, href: `/catalogo/${slug[0]}` }] : []),
    ...(subcategoryName && !searchQuery && slug && slug.length > 1 ? [{ name: subcategoryName, href: `/catalogo/${slug[0]}/${slug[1]}` }] : []),
    ...(subcategory2Name && !searchQuery ? [{ name: subcategory2Name }] : []),
  ];
  
  // Obtener productos
  useEffect(() => {
    if (localityLoading) {
      return;
    }

    // No cargar productos si las categorías aún no están cargadas y hay un slug
    // Esto evita cargar productos con categoryId incorrecto
    if (slug && slug.length > 0 && isLoadingCategories) {
      return;
    }

    // Si hay un slug pero no tenemos categoryId, esperar solo si el categoryIdMap está vacío
    // (es decir, las categorías aún no se han cargado)
    // PERO si el slug cambió, intentar cargar de todos modos (puede ser un slug inválido)
    const currentSlug = slug?.join('/');
    const slugChanged = currentSlug !== initialSlugRef.current;
    
    if (slug && slug.length > 0 && !categoryId && Object.keys(categoryIdMap).length === 0 && !slugChanged) {
      return;
    }

    // Saltear el primer fetch solo si tenemos productos iniciales del servidor
    // y estamos en el mismo slug que cuando se montó el componente
    // Si el slug cambió, nunca saltar el fetch
    // Solo reutilizar el HTML inicial sin red cuando no hay localidad en cliente: el SSR no envía
    // locality_id; si el usuario ya tiene localidad, hay que listar con esa tienda.
    if (
      !slugChanged &&
      skipFirstProductFetch.current &&
      currentSlug === initialSlugRef.current &&
      initialProducts.length > 0 &&
      !hasActiveFilters &&
      !locality?.id
    ) {
      skipFirstProductFetch.current = false;
      return;
    }
    
    // Si llegamos aquí, necesitamos cargar productos
    // Si el slug cambió, forzar la carga
    if (slugChanged) {
      skipFirstProductFetch.current = false;
    }

    const loadProducts = async () => {
      setLoading(true);
      try {
        const baseParams: Parameters<typeof fetchProducts>[0] = {
          is_active: true,
          sort: sortBy,
          include_images: false,
          include_promos: true,
          require_crm_product_id: true,
        };

        if (locality?.id) {
          baseParams.locality_id = locality.id;
        }
        if (searchQuery) {
          baseParams.search = searchQuery;
        }
        if (subcategoryId) {
          baseParams.category_id = subcategoryId;
        } else if (categoryId) {
          baseParams.category_id = categoryId;
        }

        const useClientPool = hasActiveFilters && catalogNeedsFullClientPool(selectedFilters, priceRange);

        if (useClientPool) {
          const poolKey = [
            categoryId ?? "",
            subcategoryId ?? "",
            searchQuery ?? "",
            sortBy,
            locality?.id ?? "",
          ].join("|");

          let allProducts: Product[];
          if (catalogProductPoolRef.current?.key === poolKey) {
            allProducts = catalogProductPoolRef.current.products;
            debugCatalogoTecnologia("usando pool en caché (sin refetch red)", { productos: allProducts.length });
          } else {
            const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
            const { products } = await fetchProductsAllPages(baseParams, { concurrency: 3 });
            const ms =
              (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
            debugCatalogoTecnologia("red: pool completo para filtros (hojas en lotes de 3 request paralelos)", {
              productos: products.length,
              ms: Math.round(ms),
            });
            catalogProductPoolRef.current = { key: poolKey, products };
            allProducts = products;
          }

          const filtered = applyCatalogClientFilters(allProducts, priceRange, selectedFilters);
          const filteredTotal = filtered.length;
          const filteredTotalPages = Math.max(1, Math.ceil(filteredTotal / perPage));
          const safePage = Math.min(page, filteredTotalPages);
          const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

          setProducts(paged);
          setTotalPages(filteredTotalPages);
          setProductsTotalCount(filteredTotal);
        } else {
          catalogProductPoolRef.current = null;
          const result = await fetchProducts({
            ...baseParams,
            page,
            per_page: perPage,
            ...(priceRange.min !== null ? { min_price: priceRange.min } : {}),
            ...(priceRange.max !== null ? { max_price: priceRange.max } : {}),
            ...(selectedFilters["colchon-tecnologia"]?.length
              ? { filling_type_slugs: selectedFilters["colchon-tecnologia"].join(",") }
              : {}),
          });
          setProducts(result.products);
          setTotalPages(result.total_pages);
          setProductsTotalCount(result.total);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        catalogProductPoolRef.current = null;
        setProducts([]);
        setTotalPages(1);
        setProductsTotalCount(0);
      } finally {
        setLoading(false);
        // Tras cualquier carga real, no volver a "saltar" y dejar la grilla colgada de page=1.
        skipFirstProductFetch.current = false;
      }
    };
    
    loadProducts();
  }, [page, sortBy, categoryId, subcategoryId, subcategoryName, subcategory2Name, searchQuery, perPage, selectedFilters, hasActiveFilters, categories, categoryIdMap, slug, isLoadingCategories, locality?.id, localityLoading, priceRange]);
  
  const sortOptions = [
    { value: "created_at_desc", label: "Más recientes" },
    { value: "created_at", label: "Más antiguos" },
    { value: "name", label: "Nombre A-Z" },
    { value: "price_asc", label: "Precio: menor a mayor" },
    { value: "price_desc", label: "Precio: mayor a menor" },
  ];
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const getProductCardProps = (product: Product) => {
    const image = firstProductImageUrl(product);

    // Calcular precio usando función centralizada
    const priceInfo = calculateProductPrice(product, 1);
    const cardFields = productCardPriceDisplayFromPriceInfo(priceInfo);

    return {
      id: product.id,
      image,
      alt: product.name,
      name: product.name,
      currentPrice: cardFields.currentPrice,
      originalPrice: priceInfo.originalPrice,
      discount: priceInfo.discount,
      priceNote: cardFields.priceNote,
      secondaryPrice: cardFields.secondaryPrice,
      secondaryPriceLabel: cardFields.secondaryPriceLabel,
    };
  };
  
  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        /* Scrollbar estilizada y delgada para el contenedor de filtros */
        .custom-scrollbar {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: #a8b1c2 #f4f5f7;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f5f7;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a8b1c2;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8a94a8;
        }
      `}</style>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 md:mb-6 overflow-x-auto">
          {isLoadingCategories && slug && slug.length > 0 ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <span>/</span>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              {slug.length > 1 && (
                <>
                  <span>/</span>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </>
              )}
            </div>
          ) : (
            <ol className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 whitespace-nowrap">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-1 md:gap-2">
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-gray-900 transition-colors">
                      {crumb.name}
                    </a>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </nav>
        
        {/* Header */}
        <div className="mb-4 md:mb-6">
          {isLoadingCategories && slug && slug.length > 0 ? (
            <div className="animate-pulse">
              <div className="h-7 md:h-9 bg-gray-200 rounded w-48 md:w-64 mb-2"></div>
              <div className="h-4 md:h-5 bg-gray-200 rounded w-36 md:w-48"></div>
            </div>
          ) : (
            <>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                {searchQuery ? `Resultados de búsqueda` : (subcategory2Name || subcategoryName || categoryName || "Catálogo")}
              </h1>
              {searchQuery && (
                <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">
                  Buscando: <span className="font-semibold text-gray-900">"{searchQuery}"</span>
                </p>
              )}
              {(categoryName || searchQuery) && !loading && (
                <p className="text-sm md:text-base text-gray-600">
                  {productsTotalCount}{" "}
                  {productsTotalCount === 1 ? "producto encontrado" : "productos encontrados"}
                </p>
              )}
            </>
          )}
        </div>
        
        {/* Barra superior con filtros, items por página y ordenar (sticky junto al navbar) */}
        <div className="sticky top-[56px] md:top-[150px] z-30 bg-white -mx-4 px-4 pb-3 pt-3 md:pt-4 mb-4 md:mb-6 border-b border-gray-100 md:border-b-0">
          <div className="container mx-auto flex items-center justify-between">
          {!searchQuery && (
            <>
              {/* Desktop filters toggle */}
              <div className="hidden md:flex items-center gap-2 w-full max-w-[290px]">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="ml-auto text-gray-600 hover:text-gray-900 transition-all duration-300"
                >
                  {filtersExpanded ? (
                    <Minus className="w-4 h-4 transition-transform duration-300" />
                  ) : (
                    <Plus className="w-4 h-4 transition-transform duration-300" />
                  )}
                </button>
              </div>
              {/* Mobile filters button */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="bg-[#00C1A7] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {Object.values(selectedFilters).reduce((acc, arr) => acc + arr.length, 0) + (priceRange.min !== null || priceRange.max !== null ? 1 : 0)}
                  </span>
                )}
              </button>
            </>
          )}
          {searchQuery && <div></div>}
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Items por página - hidden on mobile */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowPerPageMenu(!showPerPageMenu)}
                className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span>
                  Mostrar: {perPage} por página
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showPerPageMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showPerPageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPerPageMenu(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[180px]">
                    {CATALOGO_PER_PAGE_OPTIONS.map((value) => (
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
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span className="hidden md:inline">
                  Ordenar por: {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
                <span className="md:hidden">
                  {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
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
              )}
            </div>
          </div>
          </div>
        </div>
        
        {/* Mobile Filters Modal */}
        {isMobileFiltersOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="p-4">
              {hasActiveFilters && (
                <div className="flex justify-start mb-4">
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-[#00C1A7] hover:text-[#00A892] transition-colors"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              )}
              
              {/* Filtro de Rango de Precios */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Rango de Precios</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={priceRangeInput.min}
                      onChange={(e) => setPriceRangeInput(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 text-gray-900"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      value={priceRangeInput.max}
                      onChange={(e) => setPriceRangeInput(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 text-gray-900"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {priceRangeError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                      {priceRangeError}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePriceRangeApply}
                      className="flex-1 px-3 py-2 text-sm bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors"
                    >
                      Aplicar
                    </button>
                    {(priceRange.min !== null || priceRange.max !== null) && (
                      <button
                        onClick={handlePriceRangeClear}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
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
              
              {/* Grupos de filtros */}
              {currentFilters.length === 0 ? (
                <p className="text-sm text-gray-500">No hay filtros disponibles para esta categoría</p>
              ) : (
                <div className="space-y-4">
                  {currentFilters.map((filterGroup, index) => {
                    const filterKey = filterGroupStorageKey(filterGroup);
                    const isOpen = openFilters[filterKey] || false;
                    
                    return (
                      <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                        <button
                          onClick={() => toggleFilter(filterKey)}
                          className="flex items-center justify-between w-full text-left mb-3 group"
                        >
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                            {filterGroup.title}
                          </h3>
                          {isOpen ? (
                            <Minus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="space-y-3">
                            {filterGroup.options.map((option) => {
                              const isChecked = selectedFilters[filterKey]?.includes(option.value) || false;
                              
                              return (
                                <label key={option.value} className="flex items-center cursor-pointer group">
                                  <input
                                    type={filterGroup.type}
                                    checked={isChecked}
                                    onChange={(e) => handleFilterChange(filterKey, option.value, e.target.checked)}
                                    className="w-5 h-5 text-[#00C1A7] focus:ring-[#00C1A7] focus:ring-2 rounded border-gray-300 cursor-pointer"
                                  />
                                  <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                    {option.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Bottom action button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-3 bg-[#00C1A7] text-white rounded-lg font-medium hover:bg-[#00A892] transition-colors"
              >
                Ver {products.length} productos
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid: Sidebar + Products */}
        <div className={`grid grid-cols-12 gap-4 md:gap-6 ${searchQuery ? 'lg:grid-cols-12' : ''}`}>
          {/* Sidebar de Filtros - 3 columnas, oculto cuando está cerrado o hay búsqueda, solo desktop */}
          {filtersExpanded && !searchQuery && (
            <aside className="hidden md:block col-span-12 lg:col-span-3 transition-all duration-300 ease-in-out">
              <div className="bg-white rounded-[10px] border border-gray-200 p-6 sticky top-[210px] overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 12rem)', height: 'fit-content' }}>
                {/* Contenido de filtros - alineado con el grid de productos (después del mb-6 del dropdown) */}
                {(isLoadingCategories && slug && slug.length > 0) || isApplyingFilter ? (
                  <div className="space-y-6 animate-pulse">
                    {/* Skeleton para rango de precios */}
                    <div className="border-b border-gray-100 pb-4 mb-4">
                      <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-10 bg-gray-200 rounded w-full"></div>
                          <span className="text-gray-500">-</span>
                          <div className="h-10 bg-gray-200 rounded w-full"></div>
                        </div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                    {/* Skeleton para grupos de filtros */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b border-gray-100 pb-4">
                        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {hasActiveFilters && (
                      <div className="flex justify-start mb-4">
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-[#00C1A7] hover:text-[#00A892] transition-colors"
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                    
                    {/* Filtro de Rango de Precios - Siempre visible */}
                    <div className="border-b border-gray-100 pb-4 mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Rango de Precios</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Mín"
                            value={priceRangeInput.min}
                            onChange={(e) => setPriceRangeInput(prev => ({ ...prev, min: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 placeholder:opacity-100 text-gray-900"
                            min="0"
                            step="0.01"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handlePriceRangeApply();
                              }
                            }}
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            placeholder="Máx"
                            value={priceRangeInput.max}
                            onChange={(e) => setPriceRangeInput(prev => ({ ...prev, max: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 placeholder:opacity-100 text-gray-900"
                            min="0"
                            step="0.01"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handlePriceRangeApply();
                              }
                            }}
                          />
                        </div>
                        {priceRangeError && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                            {priceRangeError}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePriceRangeApply}
                            className="flex-1 px-3 py-2 text-sm bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors"
                          >
                            Aplicar
                          </button>
                          {(priceRange.min !== null || priceRange.max !== null) && (
                            <button
                              onClick={handlePriceRangeClear}
                              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
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
                    
                    {currentFilters.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay filtros disponibles para esta categoría</p>
                    ) : (
                      <div className="space-y-6">
                        {currentFilters.map((filterGroup, index) => {
                          const filterKey = filterGroupStorageKey(filterGroup);
                          const isOpen = openFilters[filterKey] || false;
                          
                          return (
                            <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                              <button
                                onClick={() => toggleFilter(filterKey)}
                                className="flex items-center justify-between w-full text-left mb-3 group"
                              >
                                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                  {filterGroup.title}
                                </h3>
                                {isOpen ? (
                                  <Minus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                ) : (
                                  <Plus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="space-y-2">
                                  {filterGroup.options.map((option) => {
                                    const isChecked = selectedFilters[filterKey]?.includes(option.value) || false;
                                    
                                    return (
                                      <label key={option.value} className="flex items-center cursor-pointer group">
                                        <input
                                          type={filterGroup.type}
                                          checked={isChecked}
                                          onChange={(e) => handleFilterChange(filterKey, option.value, e.target.checked)}
                                          className="w-4 h-4 text-[#00C1A7] focus:ring-[#00C1A7] focus:ring-2 rounded border-gray-300 cursor-pointer"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                          {option.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>
          )}
          
          {/* Productos - 2 columnas en móvil, 3 en tablet, 3-4 en desktop */}
          <div className={`col-span-12 ${filtersExpanded ? 'md:col-span-12 lg:col-span-9' : 'lg:col-span-12'} transition-all duration-300`}>
            {/* Products Grid */}
            {loading ? (
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 transition-all duration-300 ease-in-out ${filtersExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="relative group block animate-pulse">
                    {/* Skeleton Image */}
                    <div className="relative w-full h-80 rounded-[10px] overflow-hidden bg-gray-200"></div>
                    {/* Skeleton Content */}
                    <div className="pt-3">
                      <div className="mb-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="mt-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-lg mb-2">No se encontraron productos</p>
                <p className="text-gray-500 text-sm">Intenta con otros filtros o vuelve más tarde</p>
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 transition-all duration-300 ease-in-out [&>*]:min-w-0 ${filtersExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                  {products.map((product) => (
                    <ProductCard
                      key={`${product.id}-${locality?.id ?? "no-locality"}`}
                      {...getProductCardProps(product)}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
