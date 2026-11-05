"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { Save, RotateCcw, Plus, Trash2, Search, X } from "lucide-react";
import {
  fetchCategories,
  fetchProductsAllPages,
  fetchViacargoTarifas,
  updateViacargoTarifas,
  type Category,
  type ViacargoTarifas,
} from "@/lib/api";

/** Precios como dígitos sin formato ("87000"), uno por zona; "" = usa la API de Via Cargo */
type Fila = string[];

interface ExtraForm {
  key: string;
  id?: string;
  label: string;
  category_id: string;
  category_option_id: string;
  product_ids: string[];
  precios: Fila;
}

interface ProductChoice {
  id: string;
  name: string;
}

interface FormState {
  precios: Record<string, Fila>;
  extras: ExtraForm[];
}

const toDigits = (v: string) => v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
const formatPesos = (digits: string) => (digits ? Number(digits).toLocaleString("es-AR") : "");
const toText = (v: number | null) => (v == null ? "" : String(v));

const toForm = (data: ViacargoTarifas): FormState => ({
  // Defensivo: un backend sin deployar puede no devolver extras / product_ids
  precios: Object.fromEntries(Object.entries(data.precios ?? {}).map(([tipo, fila]) => [tipo, (fila ?? []).map(toText)])),
  extras: (data.extras ?? []).map((e) => ({
    key: e.id || crypto.randomUUID(),
    id: e.id,
    label: e.label,
    category_id: e.category_id || "",
    category_option_id: e.category_option_id || "",
    product_ids: e.product_ids || [],
    precios: (e.precios ?? []).map(toText),
  })),
});

const sameForm = (a: FormState, b: FormState) =>
  JSON.stringify({ ...a, extras: a.extras.map(({ key, ...e }) => e) }) ===
  JSON.stringify({ ...b, extras: b.extras.map(({ key, ...e }) => e) });

function PriceInput({ value, onChange, changed }: { value: string; onChange: (digits: string) => void; changed?: boolean }) {
  return (
    <div
      className={`flex items-center w-full min-w-[112px] rounded-lg border bg-white transition-all focus-within:ring-2 focus-within:ring-[#00C1A7]/20 focus-within:border-[#00C1A7] ${
        changed ? "border-amber-400 bg-amber-50/60" : !value ? "border-dashed border-gray-300 bg-gray-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <span className={`pl-2.5 text-sm select-none ${value ? "text-gray-400" : "text-gray-300"}`}>$</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatPesos(value)}
        onChange={(e) => onChange(toDigits(e.target.value))}
        placeholder="Usa API"
        title={value ? undefined : "Vacío: se cotiza con la API de Via Cargo"}
        className="w-full bg-transparent pl-1 pr-2.5 py-2 text-sm text-gray-900 tabular-nums text-right placeholder:text-gray-400 placeholder:text-xs focus:outline-none"
      />
    </div>
  );
}

const normalize = (s: string) =>
  s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function ProductPicker({
  products,
  selected,
  onChange,
}: {
  products: ProductChoice[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return products.filter((p) => !selected.includes(p.id) && normalize(p.name).includes(q)).slice(0, 8);
  }, [query, products, selected]);

  return (
    <div ref={boxRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#00C1A7]/20 focus-within:border-[#00C1A7]">
        {selected.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 max-w-full rounded-md bg-[#00C1A7]/10 text-[#00796B] px-2 py-0.5 text-xs"
          >
            <span className="truncate">{byId.get(id)?.name ?? "Producto eliminado"}</span>
            <button
              type="button"
              onClick={() => onChange(selected.filter((s) => s !== id))}
              className="shrink-0 hover:text-red-600"
              title="Quitar"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1 flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length ? "Agregar otro…" : "Buscar producto…"}
            className="w-full bg-transparent py-0.5 text-sm text-gray-900 focus:outline-none"
          />
        </div>
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onChange([...selected, p.id]);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-2 text-xs text-gray-500">
          No hay productos que coincidan
        </div>
      )}
    </div>
  );
}

export default function TarifasViacargoPage() {
  const [tarifas, setTarifas] = useState<ViacargoTarifas | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductChoice[]>([]);
  const [initial, setInitial] = useState<FormState>({ precios: {}, extras: [] });
  const [form, setForm] = useState<FormState>({ precios: {}, extras: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const applyData = (data: ViacargoTarifas) => {
    const f = toForm(data);
    setTarifas(data);
    setInitial(f);
    setForm(f);
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [data, cats, prods] = await Promise.all([
          fetchViacargoTarifas(),
          fetchCategories(true),
          fetchProductsAllPages({ is_active: true, include_variants: false, include_images: false, include_promos: false }),
        ]);
        setCategories(cats);
        setProducts(
          (prods?.products ?? [])
            .map((p) => ({ id: p.id, name: (p.name || "").trim() }))
            .sort((a, b) => a.name.localeCompare(b.name, "es")),
        );
        applyData(data);
      } catch (error) {
        console.error("Error loading Via Cargo tariffs:", error);
        alert(error instanceof Error ? error.message : "Error al cargar las tarifas");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /** "Padre › Hija", ordenadas para el selector */
  const categoryChoices = useMemo(
    () =>
      categories
        .map((c) => ({ id: c.id, label: c.parent_name ? `${c.parent_name} › ${c.name}` : c.name, options: c.options ?? [] }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    [categories],
  );

  const zonasCount = tarifas?.zonas.length ?? 0;
  const isDirty = tarifas !== null && !sameForm(form, initial);

  const setPrecio = (tipo: string, i: number, digits: string) =>
    setForm((prev) => ({
      ...prev,
      precios: { ...prev.precios, [tipo]: prev.precios[tipo].map((v, j) => (j === i ? digits : v)) },
    }));

  const updateExtra = (key: string, patch: Partial<ExtraForm>) =>
    setForm((prev) => ({ ...prev, extras: prev.extras.map((e) => (e.key === key ? { ...e, ...patch } : e)) }));

  const addExtra = () =>
    setForm((prev) => ({
      ...prev,
      extras: [
        ...prev.extras,
        {
          key: crypto.randomUUID(),
          label: "",
          category_id: "",
          category_option_id: "",
          product_ids: [],
          precios: Array(zonasCount).fill(""),
        },
      ],
    }));

  const removeExtra = (key: string) =>
    setForm((prev) => ({ ...prev, extras: prev.extras.filter((e) => e.key !== key) }));

  const handleSave = async () => {
    if (!tarifas) return;
    // Vacío = esa zona se cotiza con la API de Via Cargo
    const toNumbers = (fila: Fila) => fila.map((v) => (v ? Number(v) : null));
    const filaOk = (fila: Fila) => fila.every((v) => !v || Number(v) > 0);

    for (const tipo of tarifas.tipos) {
      if (!filaOk(form.precios[tipo.key])) {
        alert(`Los precios de "${tipo.label}" deben ser mayores a 0`);
        return;
      }
    }
    for (const [i, e] of form.extras.entries()) {
      const nombre = e.label.trim() || `tarifa #${i + 1}`;
      if (!e.label.trim()) return alert(`Poné un nombre a la ${nombre}`);
      if (!e.category_id && e.product_ids.length === 0)
        return alert(`Elegí una categoría o productos para "${nombre}"`);
      if (!filaOk(e.precios)) return alert(`Los precios de "${nombre}" deben ser mayores a 0`);
    }

    try {
      setIsSaving(true);
      const data = await updateViacargoTarifas(
        Object.fromEntries(Object.entries(form.precios).map(([t, fila]) => [t, toNumbers(fila)])),
        form.extras.map((e) => ({
          id: e.id,
          label: e.label.trim(),
          category_id: e.category_id || null,
          category_option_id: (e.category_id && e.category_option_id) || null,
          product_ids: e.product_ids,
          precios: toNumbers(e.precios),
        })),
      );
      applyData(data);
    } catch (error) {
      console.error("Error saving Via Cargo tariffs:", error);
      alert(error instanceof Error ? error.message : "Error al guardar las tarifas");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !tarifas) {
    return <Loader message="Cargando tarifas..." />;
  }

  const zonaHeaders = (
    <>
      {tarifas.zonas.map((zona) => (
        <th key={zona.key} className="px-2 py-3 text-right align-top font-medium text-gray-700 min-w-[128px]">
          <span className="block text-sm">{zona.label}</span>
          {zona.provincias.length > 0 && (
            <span className="block mt-1 text-[11px] font-normal text-gray-400 leading-snug whitespace-normal">
              {zona.provincias.join(" · ")}
            </span>
          )}
        </th>
      ))}
    </>
  );

  return (
    <div className="pb-24">
      <PageHeader
        title="Tarifas Via Cargo"
        description="Precio de envío por unidad para el catálogo País (retiro en sucursal), según el producto y la zona de destino."
      />

      {/* Tarifas fijas */}
      <section className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Colchones, sommiers y electros</h2>
          <p className="text-xs text-gray-500 mt-0.5">Se asignan solos según la subcategoría de medida de cada producto.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-medium text-gray-700 min-w-[230px]">Producto</th>
                {zonaHeaders}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tarifas.tipos.map((tipo) => (
                <tr key={tipo.key} className="hover:bg-gray-50/50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-gray-900">{tipo.label}</td>
                  {tarifas.zonas.map((zona, i) => (
                    <td key={zona.key} className="px-2 py-2.5">
                      <PriceInput
                        value={form.precios[tipo.key]?.[i] ?? ""}
                        onChange={(d) => setPrecio(tipo.key, i, d)}
                        changed={(form.precios[tipo.key]?.[i] ?? "") !== (initial.precios[tipo.key]?.[i] ?? "")}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tarifas agregadas */}
      <section className="mt-6 bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Otras tarifas</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Para productos que no están arriba (Smart TV, aires, respaldos, muebles…). Elegí una categoría, productos puntuales o las dos cosas. Un producto elegido puntualmente usa esta tarifa aunque tenga otra.
            </p>
          </div>
          <button
            onClick={addExtra}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#00C1A7] text-[#00A890] rounded-lg text-xs font-medium hover:bg-[#00C1A7]/5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Agregar tarifa
          </button>
        </div>

        {form.extras.length === 0 ? (
          <button
            onClick={addExtra}
            className="w-full px-4 py-10 flex flex-col items-center gap-2 text-center hover:bg-gray-50/60 transition-colors"
          >
            <span className="w-10 h-10 rounded-full bg-[#00C1A7]/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#00A890]" />
            </span>
            <span className="text-sm font-medium text-gray-800">Todavía no agregaste tarifas</span>
            <span className="text-xs text-gray-500">Por ejemplo: "Smart TV" en Grandes electros › Smart TV</span>
          </button>
        ) : (
          <div className="divide-y divide-gray-100">
            {form.extras.map((extra) => {
              const choice = categoryChoices.find((c) => c.id === extra.category_id);
              const original = initial.extras.find((e) => e.key === extra.key);
              return (
                <div key={extra.key} className="p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <label className="flex-1 min-w-[180px]">
                      <span className="block text-xs font-medium text-gray-600 mb-1">Nombre</span>
                      <input
                        type="text"
                        value={extra.label}
                        onChange={(e) => updateExtra(extra.key, { label: e.target.value })}
                        placeholder="Ej: Smart TV"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7]"
                      />
                    </label>
                    <label className="flex-1 min-w-[220px]">
                      <span className="block text-xs font-medium text-gray-600 mb-1">Categoría</span>
                      <select
                        value={extra.category_id}
                        onChange={(e) => updateExtra(extra.key, { category_id: e.target.value, category_option_id: "" })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7]"
                      >
                        <option value="">Ninguna (solo productos)</option>
                        {categoryChoices.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {choice && choice.options.length > 0 && (
                      <label className="flex-1 min-w-[180px]">
                        <span className="block text-xs font-medium text-gray-600 mb-1">Opción</span>
                        <select
                          value={extra.category_option_id}
                          onChange={(e) => updateExtra(extra.key, { category_option_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7]"
                        >
                          <option value="">Todas</option>
                          {choice.options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.value}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <button
                      onClick={() => removeExtra(extra.key)}
                      title="Eliminar tarifa"
                      className="mt-5 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <span className="block text-xs font-medium text-gray-600 mb-1">
                      Productos puntuales <span className="font-normal text-gray-400">(opcional)</span>
                    </span>
                    <ProductPicker
                      products={products}
                      selected={extra.product_ids}
                      onChange={(ids) => updateExtra(extra.key, { product_ids: ids })}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {tarifas.zonas.map((zona, i) => (
                      <label key={zona.key}>
                        <span className="block text-[11px] font-medium text-gray-500 mb-1">{zona.label}</span>
                        <PriceInput
                          value={extra.precios[i] ?? ""}
                          onChange={(d) =>
                            updateExtra(extra.key, { precios: extra.precios.map((v, j) => (j === i ? d : v)) })
                          }
                          changed={original ? (extra.precios[i] ?? "") !== (original.precios[i] ?? "") : false}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {tarifas.updated_at && (
        <p className="mt-4 text-xs text-gray-400">
          Última modificación: {new Date(tarifas.updated_at).toLocaleString("es-AR")}
        </p>
      )}

      {/* Barra de guardado */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl transition-all duration-200 ${
          isDirty ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between gap-3 rounded-[14px] border border-gray-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
          <span className="text-sm text-gray-700">Tenés cambios sin guardar</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setForm(initial)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Descartar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00C1A7] text-white rounded-lg text-xs font-medium hover:bg-[#00a892] transition-all disabled:opacity-50 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
