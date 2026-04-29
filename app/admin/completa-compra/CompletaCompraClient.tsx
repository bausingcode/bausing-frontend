"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Category,
  fetchCategories,
  getPdpCrossSellAdmin,
  updatePdpCrossSell,
  Product,
  fetchProducts,
} from "@/lib/api";
import { Loader2, Package, Save, Search, X, ChevronDown } from "lucide-react";
import { firstProductImageUrl, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImagePlaceholder";
import wsrvLoader from "@/lib/wsrvLoader";
import { calculateProductPrice } from "@/utils/priceUtils";

type CatProducts = { product1: Product | null; product2: Product | null };

const emptyCatProducts = (): CatProducts => ({
  product1: null,
  product2: null,
});

function CompletaCompraSkeleton() {
  return (
    <div className="pb-8 animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-64 bg-gray-200 rounded-md mb-3" />
        <div className="h-4 w-full max-w-2xl bg-gray-100 rounded-md mb-2" />
      </div>
      <div className="flex justify-end mb-6">
        <div className="h-10 w-40 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-[14px] p-5 bg-white"
            style={{ borderRadius: "14px" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded shrink-0 mt-0.5" />
              <div className="h-5 w-40 bg-gray-200 rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
                <div className="h-10 w-full bg-gray-100 rounded-[8px]" />
              </div>
              <div>
                <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
                <div className="h-10 w-full bg-gray-100 rounded-[8px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputSearchClass =
  "w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-[8px] bg-white text-gray-900 text-sm placeholder:text-gray-500 caret-[#00C1A7] focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/40 focus:border-[#00C1A7]";

const selectClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-[8px] bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/40 focus:border-[#00C1A7] appearance-none cursor-pointer";

type PickerContext = { categoryId: string; slot: 1 | 2 };

function ProductPickerModal({
  open,
  onClose,
  mainCategory,
  subcategories,
  excludeIds,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  mainCategory: Category;
  subcategories: Category[];
  excludeIds: string[];
  onSelect: (p: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scope, setScope] = useState<"category" | "all">("category");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setDebouncedSearch("");
    setScope("category");
    setSubcategoryId("");
    setPage(1);
    setItems([]);
    setTotalPages(1);
  }, [open, mainCategory.id]);

  useEffect(() => {
    if (scope === "all") setSubcategoryId("");
  }, [scope]);

  const runFetch = useCallback(
    async (pageNum: number, append: boolean) => {
      const isFirst = pageNum === 1;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);
      try {
        const params: Parameters<typeof fetchProducts>[0] = {
          is_active: true,
          require_crm_product_id: true,
          include_images: true,
          include_promos: true,
          page: pageNum,
          per_page: 24,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (scope === "category") {
          if (subcategoryId) params.subcategory_ids = subcategoryId;
          else params.category_id = mainCategory.id;
        }
        const res = await fetchProducts(params);
        const filtered = (res.products || []).filter((p) => !excludeIds.includes(p.id));
        setTotalPages(Math.max(1, res.total_pages || 1));
        setPage(pageNum);
        if (append) {
          setItems((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...filtered.filter((p) => !ids.has(p.id))];
          });
        } else {
          setItems(filtered);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      debouncedSearch,
      scope,
      subcategoryId,
      mainCategory.id,
      excludeIds,
    ],
  );

  useEffect(() => {
    if (!open) return;
    void runFetch(1, false);
  }, [open, debouncedSearch, scope, subcategoryId, mainCategory.id, runFetch]);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const handlePick = (p: Product) => {
    if (excludeSet.has(p.id)) return;
    onSelect(p);
    onClose();
  };

  const loadMore = () => {
    if (loading || loadingMore || page >= totalPages) return;
    void runFetch(page + 1, true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 p-4">
      <div className="bg-white rounded-[14px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Elegir producto</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 space-y-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU…"
              className={inputSearchClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ámbito</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "category" | "all")}
                className={`${selectClass} pr-10`}
              >
                <option value="category">Solo: {mainCategory.name}</option>
                <option value="all">Todo el catálogo</option>
              </select>
              <ChevronDown className="absolute right-3 top-[2.125rem] w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Subcategoría</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={scope !== "category" || subcategories.length === 0}
                className={`${selectClass} pr-10 disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">Todas las subcategorías</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[2.125rem] w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-[10px] bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-600 py-10 text-sm">
              No hay productos con estos criterios. Probá otra búsqueda o cambiá los filtros.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((product) => {
                const disabled = excludeSet.has(product.id);
                const priceInfo = calculateProductPrice(
                  { ...product, promos: Array.isArray(product.promos) ? product.promos : [] },
                  1,
                );
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handlePick(product)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-[10px] border transition-colors ${
                        disabled
                          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                          : "border-gray-200 bg-white hover:border-[#00C1A7] hover:bg-gray-50/80"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-[6px] bg-gray-100 overflow-hidden shrink-0">
                        <img
                          src={
                            (() => {
                              const u = firstProductImageUrl(product);
                              return u === PRODUCT_IMAGE_PLACEHOLDER || u.startsWith("data:")
                                ? u
                                : wsrvLoader({ src: u, width: 112 });
                            })()
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          {product.category_name || "—"}
                          {product.category_option_value
                            ? ` · ${product.category_option_value}`
                            : null}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          {priceInfo.currentPrice}
                        </span>
                        {disabled ? (
                          <p className="text-[11px] text-amber-700 mt-1">Ya elegido</p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && page < totalPages ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 w-full py-2.5 text-sm font-medium text-[#00A890] border border-gray-200 rounded-[8px] hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingMore ? "Cargando…" : "Cargar más"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SelectedProductRow({
  product,
  label,
  onChange,
  onClear,
}: {
  product: Product | null;
  label: string;
  onChange: () => void;
  onClear: () => void;
}) {
  const priceInfo = product
    ? calculateProductPrice(
        { ...product, promos: Array.isArray(product.promos) ? product.promos : [] },
        1,
      )
    : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {product ? (
        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-[8px] bg-gray-50/50">
          <div className="w-12 h-12 rounded-[6px] overflow-hidden bg-gray-100 shrink-0">
            <img
              src={
                (() => {
                  const u = firstProductImageUrl(product);
                  return u === PRODUCT_IMAGE_PLACEHOLDER || u.startsWith("data:")
                    ? u
                    : wsrvLoader({ src: u, width: 96 });
                })()
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
            <p className="text-xs text-gray-700 mt-0.5 tabular-nums">{priceInfo?.currentPrice}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onChange}
              className="text-xs font-medium text-[#00A890] px-2 py-1.5 rounded-md hover:bg-gray-100"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50"
              aria-label="Quitar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onChange}
          className="w-full py-2.5 px-4 border-2 border-dashed border-gray-300 rounded-[8px] text-sm font-medium text-gray-800 hover:border-[#00C1A7] hover:text-[#00A890] hover:bg-[#00C1A7]/5 transition-colors"
        >
          Elegir producto
        </button>
      )}
    </div>
  );
}

export default function CompletaCompraClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, CatProducts>>({});
  const [picker, setPicker] = useState<PickerContext | null>(null);

  const mainCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => !c.parent_id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
    [categories],
  );

  const subsByParent = useMemo(() => {
    const m = new Map<string, Category[]>();
    for (const c of categories) {
      if (!c.parent_id) continue;
      const list = m.get(c.parent_id) ?? [];
      list.push(c);
      m.set(c.parent_id, list);
    }
    for (const [, list] of m) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    }
    return m;
  }, [categories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [cats, saved] = await Promise.all([fetchCategories(false), getPdpCrossSellAdmin()]);
        if (cancelled) return;
        setCategories(cats);
        const mains = cats.filter((x) => !x.parent_id);
        const next: Record<string, CatProducts> = {};
        await Promise.all(
          mains.map(async (c) => {
            const ids = (saved[c.id] ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 2);
            if (ids.length === 0) {
              next[c.id] = emptyCatProducts();
              return;
            }
            const res = await fetchProducts({
              product_ids: ids.join(","),
              include_images: true,
              include_promos: true,
              require_crm_product_id: true,
              is_active: true,
              per_page: 12,
              page: 1,
            });
            const map = new Map(res.products.map((p) => [p.id, p]));
            next[c.id] = {
              product1: ids[0] ? map.get(ids[0]) ?? null : null,
              product2: ids[1] ? map.get(ids[1]) ?? null : null,
            };
          }),
        );
        if (cancelled) return;
        setByCategory(next);
      } catch (e) {
        if (!cancelled) {
          setMessage({ type: "error", text: e instanceof Error ? e.message : "Error al cargar" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setMessage(null);
    const payload: Record<string, string[]> = {};
    for (const c of mainCategories) {
      const row = byCategory[c.id] ?? emptyCatProducts();
      const ids = [row.product1?.id, row.product2?.id].filter(
        (x): x is string => Boolean(x && String(x).trim()),
      );
      if (ids.length) payload[c.id] = ids.slice(0, 2);
    }
    try {
      setSaving(true);
      await updatePdpCrossSell(payload);
      setMessage({ type: "success", text: "Guardado correctamente." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "No se pudo guardar",
      });
    } finally {
      setSaving(false);
    }
  };

  const setProductSlot = (categoryId: string, slot: 1 | 2, product: Product | null) => {
    setByCategory((prev) => {
      const cur = prev[categoryId] ?? emptyCatProducts();
      if (slot === 1) {
        return { ...prev, [categoryId]: { ...cur, product1: product } };
      }
      return { ...prev, [categoryId]: { ...cur, product2: product } };
    });
  };

  const pickerCategory = picker ? mainCategories.find((c) => c.id === picker.categoryId) : null;
  const pickerSubs = pickerCategory ? subsByParent.get(pickerCategory.id) ?? [] : [];
  const pickerRow = picker ? byCategory[picker.categoryId] : null;
  const pickerExclude = useMemo(() => {
    if (!picker || !pickerRow) return [];
    const out: string[] = [];
    if (picker.slot !== 1 && pickerRow.product1?.id) out.push(pickerRow.product1.id);
    if (picker.slot !== 2 && pickerRow.product2?.id) out.push(pickerRow.product2.id);
    return out;
  }, [picker, pickerRow]);

  if (loading) {
    return <CompletaCompraSkeleton />;
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Completa tu compra"
        description="Elegí hasta dos productos por categoría principal para sugerir en la ficha del producto."
      />

      {pickerCategory && picker ? (
        <ProductPickerModal
          open
          onClose={() => setPicker(null)}
          mainCategory={pickerCategory}
          subcategories={pickerSubs}
          excludeIds={pickerExclude}
          onSelect={(p) => setProductSlot(picker.categoryId, picker.slot, p)}
        />
      ) : null}

      {message ? (
        <div
          className={`mb-6 px-4 py-3 rounded-[10px] text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#00C1A7] text-white text-sm font-medium hover:bg-[#00A890] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
      </div>

      <div className="space-y-4">
        {mainCategories.map((c) => {
          const row = byCategory[c.id] ?? emptyCatProducts();
          return (
            <div
              key={c.id}
              className="border border-gray-200 rounded-[14px] p-5 bg-white"
              style={{ borderRadius: "14px" }}
            >
              <div className="flex items-start gap-3 mb-5">
                <Package className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
                <h2 className="text-base font-semibold text-gray-900">{c.name}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectedProductRow
                  label="Producto 1"
                  product={row.product1}
                  onChange={() => setPicker({ categoryId: c.id, slot: 1 })}
                  onClear={() => setProductSlot(c.id, 1, null)}
                />
                <SelectedProductRow
                  label="Producto 2"
                  product={row.product2}
                  onChange={() => setPicker({ categoryId: c.id, slot: 2 })}
                  onClear={() => setProductSlot(c.id, 2, null)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
