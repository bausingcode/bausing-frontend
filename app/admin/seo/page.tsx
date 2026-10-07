"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  RedirectRule,
  fetchAdminRedirects,
  createAdminRedirect,
  updateAdminRedirect,
  deleteAdminRedirect,
  CanonicalOverride,
  fetchAdminCanonicals,
  createAdminCanonical,
  updateAdminCanonical,
  deleteAdminCanonical,
  getAppSettings,
  updateSeoSettings,
  SeoSettings,
  fetchCategories,
  fetchAdminPageMetadata,
  bulkUpsertAdminPageMetadata,
  fetchProducts,
  fetchProductsAllPages,
  bulkUpdateProductMeta,
} from "@/lib/api";
import {
  buildCandidateRows,
  type PageMetadataRow,
} from "@/lib/seo/pageMetadataRows";
import {
  buildPageMetadataWorkbook,
  parsePageMetadataWorkbook,
} from "@/lib/seo/pageMetadataExcel";
import {
  buildProductMetadataRow,
  type ProductMetadataRow,
} from "@/lib/seo/productMetadataRows";
import {
  buildProductMetadataWorkbook,
  parseProductMetadataWorkbook,
} from "@/lib/seo/productMetadataExcel";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Loader2,
  ArrowRight,
  FileText,
  RotateCcw,
  ExternalLink,
  Sparkles,
  PenLine,
  Link2,
  Route,
  Tags,
  Download,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const EMPTY_SEO: SeoSettings = {
  robotsTxt: "",
  llmsTxt: "",
  sitemapExtraUrls: "",
};

type SeoFileTab = "robots" | "sitemap" | "llms";

const SEO_TABS: { id: SeoFileTab; label: string; file: string }[] = [
  { id: "robots", label: "robots.txt", file: "/robots.txt" },
  { id: "sitemap", label: "sitemap.xml", file: "/sitemap.xml" },
  { id: "llms", label: "llms.txt", file: "/llms.txt" },
];

type MainTab = "redirects" | "canonical" | "metadata" | "files";

const MAIN_TABS: { id: MainTab; label: string; icon: typeof Route }[] = [
  { id: "redirects", label: "Redirects", icon: Route },
  { id: "canonical", label: "Canonical", icon: Link2 },
  { id: "metadata", label: "Metadatos", icon: Tags },
  { id: "files", label: "Archivos técnicos", icon: FileText },
];

export default function AdminRedirectsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("redirects");

  const [items, setItems] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RedirectRule | null>(null);
  const [sourcePath, setSourcePath] = useState("");
  const [targetPath, setTargetPath] = useState("");
  const [redirectType, setRedirectType] = useState<301 | 302>(301);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RedirectRule | null>(null);

  // Canonical tags: listado + editor de <link rel="canonical"> por URL
  const [canonicalItems, setCanonicalItems] = useState<CanonicalOverride[]>([]);
  const [canonicalLoading, setCanonicalLoading] = useState(true);
  const [canonicalError, setCanonicalError] = useState("");
  const [canonicalModalOpen, setCanonicalModalOpen] = useState(false);
  const [editingCanonical, setEditingCanonical] = useState<CanonicalOverride | null>(null);
  const [canonicalPath, setCanonicalPath] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [canonicalActive, setCanonicalActive] = useState(true);
  const [canonicalNotes, setCanonicalNotes] = useState("");
  const [canonicalSaving, setCanonicalSaving] = useState(false);
  const [deleteCanonicalTarget, setDeleteCanonicalTarget] = useState<CanonicalOverride | null>(null);

  // SEO técnico: robots.txt, sitemap.xml, llms.txt — editor de archivo completo
  const [seoTab, setSeoTab] = useState<SeoFileTab>("robots");
  const [seo, setSeo] = useState<SeoSettings>(EMPTY_SEO);
  const [originalSeo, setOriginalSeo] = useState<SeoSettings>(EMPTY_SEO);
  // Si hay override guardado en la base (texto "Personalizado") vs. se está sirviendo el generado automáticamente
  const [seoOverrideActive, setSeoOverrideActive] = useState({ robots: false, llms: false });
  const [sitemapPreview, setSitemapPreview] = useState("");
  const [seoLoading, setSeoLoading] = useState(true);
  const [seoSaving, setSeoSaving] = useState(false);
  const [resettingTab, setResettingTab] = useState<SeoFileTab | null>(null);
  const [seoMessage, setSeoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchAdminRedirects();
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  /** Trae el texto real que hoy sirve una ruta pública (el archivo tal cual lo ve Google). */
  const fetchLiveFile = async (path: string): Promise<string> => {
    try {
      const res = await fetch(path, { cache: "no-store" });
      return res.ok ? await res.text() : "";
    } catch {
      return "";
    }
  };

  const loadSeo = async () => {
    setSeoLoading(true);
    try {
      const settings = await getAppSettings();
      const storedRobots = settings.seo?.robotsTxt || "";
      const storedLlms = settings.seo?.llmsTxt || "";
      setSeoOverrideActive({
        robots: Boolean(storedRobots.trim()),
        llms: Boolean(storedLlms.trim()),
      });

      // Si no hay override guardado, precargar el editor con el archivo real que se está
      // sirviendo ahora mismo (el generado automáticamente), para que se vea "el archivo entero".
      const [liveRobots, liveLlms, liveSitemap] = await Promise.all([
        storedRobots ? Promise.resolve(storedRobots) : fetchLiveFile("/robots.txt"),
        storedLlms ? Promise.resolve(storedLlms) : fetchLiveFile("/llms.txt"),
        fetchLiveFile("/sitemap.xml"),
      ]);

      const loaded: SeoSettings = {
        robotsTxt: liveRobots,
        llmsTxt: liveLlms,
        sitemapExtraUrls: settings.seo?.sitemapExtraUrls || "",
      };
      setSeo(loaded);
      setOriginalSeo(loaded);
      setSitemapPreview(liveSitemap);
    } catch (e: unknown) {
      setSeoMessage({ type: "error", text: e instanceof Error ? e.message : "Error al cargar la configuración de SEO" });
    } finally {
      setSeoLoading(false);
    }
  };

  const hasUnsavedSeoChanges = () => JSON.stringify(seo) !== JSON.stringify(originalSeo);

  const handleSaveSeo = async () => {
    setSeoSaving(true);
    setSeoMessage(null);
    try {
      await updateSeoSettings(seo);
      setOriginalSeo(seo);
      setSeoOverrideActive({
        robots: Boolean(seo.robotsTxt?.trim()),
        llms: Boolean(seo.llmsTxt?.trim()),
      });
      setSeoMessage({ type: "success", text: "Configuración de SEO guardada correctamente" });
      setTimeout(() => setSeoMessage(null), 3000);
    } catch (e: unknown) {
      setSeoMessage({ type: "error", text: e instanceof Error ? e.message : "No se pudo guardar la configuración de SEO" });
    } finally {
      setSeoSaving(false);
    }
  };

  /** Borra el override guardado y vuelve a mostrar el contenido generado automáticamente. */
  const handleResetSeoTab = async (tab: "robots" | "llms") => {
    setResettingTab(tab);
    setSeoMessage(null);
    const field: "robotsTxt" | "llmsTxt" = tab === "robots" ? "robotsTxt" : "llmsTxt";
    const path = tab === "robots" ? "/robots.txt" : "/llms.txt";
    try {
      await updateSeoSettings({ [field]: "" });
      const liveDefault = await fetchLiveFile(path);
      setSeo((prev) => ({ ...prev, [field]: liveDefault }));
      setOriginalSeo((prev) => ({ ...prev, [field]: liveDefault }));
      setSeoOverrideActive((prev) => ({ ...prev, [tab]: false }));
      setSeoMessage({ type: "success", text: `Se restableció ${tab === "robots" ? "robots.txt" : "llms.txt"} al contenido automático` });
      setTimeout(() => setSeoMessage(null), 3000);
    } catch (e: unknown) {
      setSeoMessage({ type: "error", text: e instanceof Error ? e.message : "No se pudo restablecer" });
    } finally {
      setResettingTab(null);
    }
  };

  const loadCanonicals = async () => {
    setCanonicalError("");
    setCanonicalLoading(true);
    try {
      const data = await fetchAdminCanonicals();
      setCanonicalItems(data);
    } catch (e: unknown) {
      setCanonicalError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setCanonicalLoading(false);
    }
  };

  // Metadatos: título/descripción de páginas de catálogo e institucionales
  const [metadataRows, setMetadataRows] = useState<PageMetadataRow[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [metadataUploading, setMetadataUploading] = useState(false);
  const [metadataMessage, setMetadataMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const metadataFileInputRef = useRef<HTMLInputElement>(null);

  const loadMetadataRows = async () => {
    setMetadataError("");
    setMetadataLoading(true);
    try {
      const [categories, overrides] = await Promise.all([
        fetchCategories(true),
        fetchAdminPageMetadata(),
      ]);
      setMetadataRows(buildCandidateRows(categories, overrides));
    } catch (e: unknown) {
      setMetadataError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setMetadataLoading(false);
    }
  };

  const toggleSelectedPath = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedPaths((prev) =>
      prev.size === metadataRows.length ? new Set() : new Set(metadataRows.map((r) => r.path))
    );
  };

  const handleDownloadMetadataExcel = async () => {
    const rows =
      selectedPaths.size > 0
        ? metadataRows.filter((r) => selectedPaths.has(r.path))
        : metadataRows;
    if (rows.length === 0) return;
    await buildPageMetadataWorkbook(rows);
  };

  const handleUploadMetadataExcel = async (file: File) => {
    setMetadataUploading(true);
    setMetadataMessage(null);
    try {
      const parsed = await parsePageMetadataWorkbook(file);
      const rowByPath = new Map(metadataRows.map((r) => [r.path, r]));
      const items = parsed.map((p) => ({
        path: p.path,
        page_type: rowByPath.get(p.path)?.page_type || "institutional",
        meta_title: p.meta_title,
        meta_description: p.meta_description,
      }));
      const result = await bulkUpsertAdminPageMetadata(items);
      setMetadataMessage({
        type: "success",
        text: `Actualizadas: ${result.updated} · Restablecidas a automático: ${result.cleared}`,
      });
      setTimeout(() => setMetadataMessage(null), 5000);
      await loadMetadataRows();
    } catch (e: unknown) {
      setMetadataMessage({ type: "error", text: e instanceof Error ? e.message : "No se pudo subir el archivo" });
    } finally {
      setMetadataUploading(false);
    }
  };

  // Metadatos: sub-tab para elegir el origen de las filas (categorías/institucionales vs productos)
  const [metadataSubTab, setMetadataSubTab] = useState<"pages" | "products">("pages");

  // Metadatos > Productos: búsqueda + paginado (puede haber cientos de productos, a
  // diferencia de las ~30 filas de categorías/institucionales que se listan todas juntas)
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productIncludeInactive, setProductIncludeInactive] = useState(false);
  const [productRows, setProductRows] = useState<ProductMetadataRow[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");
  // Mapa (no solo ids) para poder exportar filas seleccionadas en búsquedas/páginas anteriores
  const [selectedProductRows, setSelectedProductRows] = useState<Map<string, ProductMetadataRow>>(new Map());
  const [selectingAllMatches, setSelectingAllMatches] = useState(false);
  const [productUploading, setProductUploading] = useState(false);
  const [productMessage, setProductMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductSearch(productSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    setProductPage(1);
  }, [debouncedProductSearch, productIncludeInactive]);

  const loadProductRows = async () => {
    setProductError("");
    setProductLoading(true);
    try {
      const res = await fetchProducts({
        search: debouncedProductSearch || undefined,
        page: productPage,
        per_page: 50,
        is_active: productIncludeInactive ? undefined : true,
        include_variants: false,
        include_images: false,
        include_promos: false,
      });
      setProductRows(res.products.map(buildProductMetadataRow));
      setProductTotalPages(res.total_pages || 1);
      setProductTotal(res.total || 0);
    } catch (e: unknown) {
      setProductError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    if (metadataSubTab === "products") {
      loadProductRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadataSubTab, debouncedProductSearch, productPage, productIncludeInactive]);

  const toggleSelectedProduct = (row: ProductMetadataRow) => {
    setSelectedProductRows((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.set(row.id, row);
      return next;
    });
  };

  const toggleSelectAllProductsOnPage = () => {
    setSelectedProductRows((prev) => {
      const next = new Map(prev);
      const allSelected = productRows.length > 0 && productRows.every((r) => next.has(r.id));
      if (allSelected) {
        productRows.forEach((r) => next.delete(r.id));
      } else {
        productRows.forEach((r) => next.set(r.id, r));
      }
      return next;
    });
  };

  const handleDownloadProductMetadataExcel = async () => {
    const rows = Array.from(selectedProductRows.values());
    if (rows.length === 0) return;
    await buildProductMetadataWorkbook(rows);
  };

  /** Trae TODAS las páginas que matchean la búsqueda/filtro actual (no solo la visible) y las selecciona. */
  const handleSelectAllMatches = async () => {
    setSelectingAllMatches(true);
    setProductError("");
    try {
      const res = await fetchProductsAllPages({
        search: debouncedProductSearch || undefined,
        is_active: productIncludeInactive ? undefined : true,
        include_variants: false,
        include_images: false,
        include_promos: false,
      });
      setSelectedProductRows((prev) => {
        const next = new Map(prev);
        for (const product of res.products) {
          next.set(product.id, buildProductMetadataRow(product));
        }
        return next;
      });
    } catch (e: unknown) {
      setProductError(e instanceof Error ? e.message : "No se pudieron traer todos los resultados");
    } finally {
      setSelectingAllMatches(false);
    }
  };

  const handleClearProductSelection = () => setSelectedProductRows(new Map());

  const handleUploadProductMetadataExcel = async (file: File) => {
    setProductUploading(true);
    setProductMessage(null);
    try {
      const parsed = await parseProductMetadataWorkbook(file);
      const items = parsed.map((p) => ({
        id: p.id,
        meta_title: p.meta_title,
        meta_description: p.meta_description,
      }));
      const result = await bulkUpdateProductMeta(items);
      const notFoundText = result.not_found.length > 0 ? ` · No encontrados: ${result.not_found.length}` : "";
      setProductMessage({
        type: "success",
        text: `Actualizados: ${result.updated}${notFoundText}`,
      });
      setTimeout(() => setProductMessage(null), 5000);
      setSelectedProductRows(new Map());
      await loadProductRows();
    } catch (e: unknown) {
      setProductMessage({ type: "error", text: e instanceof Error ? e.message : "No se pudo subir el archivo" });
    } finally {
      setProductUploading(false);
    }
  };

  useEffect(() => {
    load();
    loadSeo();
    loadCanonicals();
    loadMetadataRows();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setSourcePath("");
    setTargetPath("");
    setRedirectType(301);
    setActive(true);
    setNotes("");
    setModalOpen(true);
  };

  const openEdit = (row: RedirectRule) => {
    setEditing(row);
    setSourcePath(row.source_path);
    setTargetPath(row.target_path);
    setRedirectType(row.redirect_type);
    setActive(row.is_active);
    setNotes(row.notes || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    const source = sourcePath.trim();
    const target = targetPath.trim();
    if (!source || !target) {
      setError("Completá la URL de origen y la URL de destino");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateAdminRedirect(editing.id, {
          source_path: source,
          target_path: target,
          redirect_type: redirectType,
          is_active: active,
          notes,
        });
      } else {
        await createAdminRedirect({
          source_path: source,
          target_path: target,
          redirect_type: redirectType,
          is_active: active,
          notes,
        });
      }
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: RedirectRule) => {
    setError("");
    try {
      await updateAdminRedirect(row.id, { is_active: !row.is_active });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await deleteAdminRedirect(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  const openCreateCanonical = () => {
    setEditingCanonical(null);
    setCanonicalPath("");
    setCanonicalUrl("");
    setCanonicalActive(true);
    setCanonicalNotes("");
    setCanonicalModalOpen(true);
  };

  const openEditCanonical = (row: CanonicalOverride) => {
    setEditingCanonical(row);
    setCanonicalPath(row.path);
    setCanonicalUrl(row.canonical_url);
    setCanonicalActive(row.is_active);
    setCanonicalNotes(row.notes || "");
    setCanonicalModalOpen(true);
  };

  const closeCanonicalModal = () => {
    setCanonicalModalOpen(false);
    setEditingCanonical(null);
  };

  const handleSaveCanonical = async () => {
    const path = canonicalPath.trim();
    const target = canonicalUrl.trim();
    if (!path || !target) {
      setCanonicalError("Completá la URL de la página y la URL canonical");
      return;
    }
    setCanonicalSaving(true);
    setCanonicalError("");
    try {
      if (editingCanonical) {
        await updateAdminCanonical(editingCanonical.id, {
          path,
          canonical_url: target,
          is_active: canonicalActive,
          notes: canonicalNotes,
        });
      } else {
        await createAdminCanonical({
          path,
          canonical_url: target,
          is_active: canonicalActive,
          notes: canonicalNotes,
        });
      }
      closeCanonicalModal();
      await loadCanonicals();
    } catch (e: unknown) {
      setCanonicalError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setCanonicalSaving(false);
    }
  };

  const toggleCanonicalActive = async (row: CanonicalOverride) => {
    setCanonicalError("");
    try {
      await updateAdminCanonical(row.id, { is_active: !row.is_active });
      await loadCanonicals();
    } catch (e: unknown) {
      setCanonicalError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleDeleteCanonical = async () => {
    if (!deleteCanonicalTarget) return;
    setCanonicalSaving(true);
    setCanonicalError("");
    try {
      await deleteAdminCanonical(deleteCanonicalTarget.id);
      setDeleteCanonicalTarget(null);
      await loadCanonicals();
    } catch (e: unknown) {
      setCanonicalError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setCanonicalSaving(false);
    }
  };

  const cardClass = "bg-white rounded-[10px] border border-gray-200";
  const cardRadius = { borderRadius: "14px" } as const;

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="SEO"
        description="Redirects, canonical, robots.txt, sitemap.xml y llms.txt en un solo lugar."
      />

      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {MAIN_TABS.map((t) => {
          const isActive = mainTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setMainTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium -mb-px border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {mainTab === "redirects" ? (
        <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-normal" style={{ color: "#484848" }}>
          Redirects
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nuevo redirect
        </button>
      </div>

      {error ? (
        <div className={`mb-6 ${cardClass} p-4 border-red-200 bg-red-50`} style={cardRadius}>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Cargando redirects…</p>
        </div>
      ) : items.length === 0 ? (
        <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
          <p className="text-gray-500 text-sm">
            Todavía no hay redirects. Creá el primero con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`} style={cardRadius}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Origen → Destino
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-24">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-24">
                    Usos
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-36">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-32">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 text-sm">
                        <code className="text-gray-900 font-medium break-all">
                          {row.source_path}
                        </code>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <code className="text-gray-500 break-all">{row.target_path}</code>
                      </div>
                      {row.notes ? (
                        <p className="text-xs text-gray-400 mt-1">{row.notes}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.redirect_type === 301
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.redirect_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-600">
                      {row.hit_count}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.is_active ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {row.is_active ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="inline-flex p-2 rounded-[6px] text-gray-600 hover:bg-gray-100 transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="inline-flex p-2 rounded-[6px] text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      ) : null}

      {mainTab === "canonical" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-lg font-normal" style={{ color: "#484848" }}>
                Canonical
              </h2>
              <p className="text-sm text-gray-500">
                Definí la URL canonical (<code>&lt;link rel=&quot;canonical&quot;&gt;</code>) que debe
                usar cada URL del sitio, para casos de contenido duplicado o variantes con filtros.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateCanonical}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              Nuevo canonical
            </button>
          </div>

          {canonicalError ? (
            <div className={`mb-6 ${cardClass} p-4 border-red-200 bg-red-50`} style={cardRadius}>
              <p className="text-sm text-red-800">{canonicalError}</p>
            </div>
          ) : null}

          {canonicalLoading ? (
            <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Cargando canonicals…</p>
            </div>
          ) : canonicalItems.length === 0 ? (
            <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
              <p className="text-gray-500 text-sm">
                Todavía no hay canonicals definidos. Creá el primero con el botón de arriba.
              </p>
            </div>
          ) : (
            <div className={`${cardClass} overflow-hidden`} style={cardRadius}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Página → Canonical
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-36">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-32">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {canonicalItems.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2 text-sm">
                            <code className="text-gray-900 font-medium break-all">
                              {row.path}
                            </code>
                            <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <code className="text-gray-500 break-all">{row.canonical_url}</code>
                          </div>
                          {row.notes ? (
                            <p className="text-xs text-gray-400 mt-1">{row.notes}</p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <button
                            type="button"
                            onClick={() => toggleCanonicalActive(row)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {row.is_active ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {row.is_active ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditCanonical(row)}
                              className="inline-flex p-2 rounded-[6px] text-gray-600 hover:bg-gray-100 transition-colors"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCanonicalTarget(row)}
                              className="inline-flex p-2 rounded-[6px] text-red-600 hover:bg-red-50 transition-colors"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}

      {mainTab === "metadata" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-normal" style={{ color: "#484848" }}>
                Metadatos
              </h2>
              <p className="text-sm text-gray-500">
                Título y descripción de las páginas de catálogo, institucionales y productos.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={metadataSubTab === "pages" ? handleDownloadMetadataExcel : handleDownloadProductMetadataExcel}
                disabled={
                  metadataSubTab === "pages"
                    ? metadataLoading || metadataRows.length === 0
                    : selectedProductRows.size === 0
                }
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Descargar Excel
                {metadataSubTab === "pages"
                  ? selectedPaths.size > 0 ? ` (${selectedPaths.size})` : ""
                  : selectedProductRows.size > 0 ? ` (${selectedProductRows.size})` : ""}
              </button>
              <button
                type="button"
                onClick={() =>
                  metadataSubTab === "pages"
                    ? metadataFileInputRef.current?.click()
                    : productFileInputRef.current?.click()
                }
                disabled={metadataSubTab === "pages" ? metadataUploading : productUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(metadataSubTab === "pages" ? metadataUploading : productUploading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Subir Excel
              </button>
              <input
                ref={metadataFileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadMetadataExcel(file);
                  e.target.value = "";
                }}
              />
              <input
                ref={productFileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadProductMetadataExcel(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 mb-6">
            <button
              type="button"
              onClick={() => setMetadataSubTab("pages")}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                metadataSubTab === "pages"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Categorías e institucionales
            </button>
            <button
              type="button"
              onClick={() => setMetadataSubTab("products")}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                metadataSubTab === "products"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Productos
            </button>
          </div>

          {metadataSubTab === "pages" ? (
            <>
              {metadataMessage ? (
                <div
                  className={`mb-4 p-4 rounded-lg text-sm ${
                    metadataMessage.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {metadataMessage.text}
                </div>
              ) : null}

              {metadataError ? (
                <div className={`mb-6 ${cardClass} p-4 border-red-200 bg-red-50`} style={cardRadius}>
                  <p className="text-sm text-red-800">{metadataError}</p>
                </div>
              ) : null}

              {metadataLoading ? (
                <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Cargando páginas…</p>
                </div>
              ) : metadataRows.length === 0 ? (
                <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
                  <p className="text-gray-500 text-sm">No hay páginas para mostrar.</p>
                </div>
              ) : (
                <div className={`${cardClass} overflow-hidden`} style={cardRadius}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-4 text-left w-10">
                            <input
                              type="checkbox"
                              checked={selectedPaths.size === metadataRows.length}
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                            Página
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                            Título / Descripción
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-28">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {metadataRows.map((row) => (
                          <tr key={row.path} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-4 align-top">
                              <input
                                type="checkbox"
                                checked={selectedPaths.has(row.path)}
                                onChange={() => toggleSelectedPath(row.path)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 align-top">
                              <p className="text-sm font-medium text-gray-900">{row.label}</p>
                              <code className="text-xs text-gray-500 break-all">{row.path}</code>
                            </td>
                            <td className="px-6 py-4 align-top max-w-md">
                              <p className="text-sm text-gray-900 truncate">{row.effectiveTitle}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {row.effectiveDescription}
                              </p>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                  row.hasOverride
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {row.hasOverride ? "Personalizado" : "Automático"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto por nombre, SKU…"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productIncludeInactive}
                    onChange={(e) => setProductIncludeInactive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  Incluir inactivos
                </label>
                {!productLoading && productRows.length > 0 ? (
                  <span className="text-sm text-gray-500">
                    {productTotal} resultado{productTotal === 1 ? "" : "s"}
                    {productTotalPages > 1 ? ` · página ${productPage} de ${productTotalPages}` : ""}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={handleSelectAllMatches}
                  disabled={selectingAllMatches || productTotal === 0}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {selectingAllMatches ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Seleccionar los {productTotal} productos guardados
                </button>
                {selectedProductRows.size > 0 ? (
                  <>
                    <span className="text-sm text-gray-500">
                      {selectedProductRows.size} seleccionado{selectedProductRows.size === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearProductSelection}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Limpiar selección
                    </button>
                  </>
                ) : null}
              </div>

              {productMessage ? (
                <div
                  className={`mb-4 p-4 rounded-lg text-sm ${
                    productMessage.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {productMessage.text}
                </div>
              ) : null}

              {productError ? (
                <div className={`mb-6 ${cardClass} p-4 border-red-200 bg-red-50`} style={cardRadius}>
                  <p className="text-sm text-red-800">{productError}</p>
                </div>
              ) : null}

              {productLoading ? (
                <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Cargando productos…</p>
                </div>
              ) : productRows.length === 0 ? (
                <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
                  <p className="text-gray-500 text-sm">No se encontraron productos.</p>
                </div>
              ) : (
                <div className={`${cardClass} overflow-hidden`} style={cardRadius}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-4 text-left w-10">
                            <input
                              type="checkbox"
                              checked={productRows.length > 0 && productRows.every((r) => selectedProductRows.has(r.id))}
                              onChange={toggleSelectAllProductsOnPage}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                            Producto
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                            Título / Descripción
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-28">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {productRows.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-4 align-top">
                              <input
                                type="checkbox"
                                checked={selectedProductRows.has(row.id)}
                                onChange={() => toggleSelectedProduct(row)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 align-top">
                              <p className="text-sm font-medium text-gray-900">{row.name}</p>
                              {row.sku ? (
                                <code className="text-xs text-gray-500">{row.sku}</code>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 align-top max-w-md">
                              <p className="text-sm text-gray-900 truncate">{row.effectiveTitle}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {row.effectiveDescription}
                              </p>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                  row.hasOverride
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {row.hasOverride ? "Personalizado" : "Automático"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {productTotalPages > 1 ? (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                        disabled={productPage <= 1}
                        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </button>
                      <span className="text-sm text-gray-500">
                        Página {productPage} de {productTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                        disabled={productPage >= productTotalPages}
                        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </>
      ) : null}

      {mainTab === "files" ? (
      <>
      {/* SEO técnico: editor de robots.txt, sitemap.xml y llms.txt */}
      <div className={`${cardClass} overflow-hidden mt-8`} style={cardRadius}>
        <div className="flex items-center gap-3 p-6 pb-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
            <FileText className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Archivos técnicos</h2>
            <p className="text-sm text-gray-500">
              Editá el contenido tal cual se sirve en cada URL pública.
            </p>
          </div>
        </div>

        <div className="px-6 pt-5">
          {seoMessage ? (
            <div
              className={`mb-4 p-4 rounded-lg text-sm ${
                seoMessage.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {seoMessage.text}
            </div>
          ) : null}
        </div>

        {seoLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-8 px-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando archivos…
          </div>
        ) : (
          <>
            {/* Pestañas tipo editor */}
            <div className="flex items-center gap-1 px-6 border-b border-gray-200">
              {SEO_TABS.map((t) => {
                const isActive = seoTab === t.id;
                const overrideActive =
                  t.id === "robots" ? seoOverrideActive.robots : t.id === "llms" ? seoOverrideActive.llms : false;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSeoTab(t.id)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg -mb-px border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t.label}
                    {t.id !== "sitemap" ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          overrideActive ? "bg-amber-400" : isActive ? "bg-emerald-400" : "bg-emerald-500"
                        }`}
                        title={overrideActive ? "Personalizado" : "Automático"}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="p-6 pt-5">
              {/* Barra de estado del archivo activo */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {seoTab === "sitemap" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
                      <Sparkles className="h-3 w-3" />
                      Siempre automático — solo lectura
                    </span>
                  ) : (seoTab === "robots" ? seoOverrideActive.robots : seoOverrideActive.llms) ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      <PenLine className="h-3 w-3" />
                      Personalizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                      <Sparkles className="h-3 w-3" />
                      Automático
                    </span>
                  )}
                  <a
                    href={SEO_TABS.find((t) => t.id === seoTab)?.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    Ver archivo en vivo
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {seoTab !== "sitemap" ? (
                  <button
                    type="button"
                    onClick={() => handleResetSeoTab(seoTab)}
                    disabled={resettingTab !== null}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {resettingTab === seoTab ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Restablecer al automático
                  </button>
                ) : null}
              </div>

              {/* robots.txt */}
              {seoTab === "robots" ? (
                <textarea
                  value={seo.robotsTxt}
                  onChange={(e) => setSeo({ ...seo, robotsTxt: e.target.value })}
                  spellCheck={false}
                  className="w-full min-h-[420px] px-4 py-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y"
                  placeholder={"User-Agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://tusitio.com/sitemap.xml"}
                />
              ) : null}

              {/* llms.txt */}
              {seoTab === "llms" ? (
                <textarea
                  value={seo.llmsTxt}
                  onChange={(e) => setSeo({ ...seo, llmsTxt: e.target.value })}
                  spellCheck={false}
                  className="w-full min-h-[420px] px-4 py-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y"
                  placeholder={"# Bausing\n\n> Descripción del sitio para asistentes de IA...\n\n- [Catálogo](https://bausing.com/catalogo)"}
                />
              ) : null}

              {/* sitemap.xml */}
              {seoTab === "sitemap" ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-3">
                      Se arma solo con los productos, categorías y notas de blog activos. Para no
                      romper el SEO real no se edita a mano, pero podés ver el archivo completo acá
                      y sumar URLs manuales abajo.
                    </p>
                    <textarea
                      value={sitemapPreview}
                      readOnly
                      spellCheck={false}
                      className="w-full min-h-[320px] px-4 py-3 bg-gray-900 text-gray-400 rounded-lg border border-gray-800 focus:outline-none font-mono text-xs leading-relaxed resize-y cursor-default"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URLs adicionales
                    </label>
                    <textarea
                      value={seo.sitemapExtraUrls}
                      onChange={(e) => setSeo({ ...seo, sitemapExtraUrls: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800 font-mono text-sm"
                      placeholder={"/programa-de-creadores\n/club-beneficios"}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Una URL o ruta por línea. Se suman a las páginas que ya se listan
                      automáticamente la próxima vez que se genere el sitemap.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleSaveSeo}
                  disabled={seoSaving || !hasUnsavedSeoChanges()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {seoSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {seoSaving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className={`${cardClass} shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6`}
            style={cardRadius}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar redirect" : "Nuevo redirect"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              URL de origen (la que da 404)
            </label>
            <input
              type="text"
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="/colchones-viejos/queen"
            />

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              URL de destino
            </label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="/catalogo/colchones/queen"
            />

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Tipo de redirect
            </label>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setRedirectType(301)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  redirectType === 301
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                301 · Permanente
              </button>
              <button
                type="button"
                onClick={() => setRedirectType(302)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  redirectType === 302
                    ? "border-amber-600 bg-amber-50 text-amber-800"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                302 · Temporal
              </button>
            </div>

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Ej.: producto discontinuado, se reemplaza por..."
            />

            <label className="flex items-center gap-2 text-sm text-gray-800 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Activo
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm font-medium"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className={`${cardClass} shadow-xl max-w-md w-full p-6`} style={cardRadius}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Eliminar este redirect?
            </h3>
            <p className="text-sm text-gray-600 mb-6 break-all">
              {deleteTarget.source_path} → {deleteTarget.target_path}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canonicalModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className={`${cardClass} shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6`}
            style={cardRadius}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCanonical ? "Editar canonical" : "Nuevo canonical"}
              </h2>
              <button
                type="button"
                onClick={closeCanonicalModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              URL de la página
            </label>
            <input
              type="text"
              value={canonicalPath}
              onChange={(e) => setCanonicalPath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="/catalogo/colchones?orden=precio"
            />

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              URL canonical
            </label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="/catalogo/colchones"
            />

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={canonicalNotes}
              onChange={(e) => setCanonicalNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Ej.: variante con filtros, mismo contenido que la base"
            />

            <label className="flex items-center gap-2 text-sm text-gray-800 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={canonicalActive}
                onChange={(e) => setCanonicalActive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Activo
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCanonicalModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCanonical}
                disabled={canonicalSaving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm font-medium"
              >
                {canonicalSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteCanonicalTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className={`${cardClass} shadow-xl max-w-md w-full p-6`} style={cardRadius}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Eliminar este canonical?
            </h3>
            <p className="text-sm text-gray-600 mb-6 break-all">
              {deleteCanonicalTarget.path} → {deleteCanonicalTarget.canonical_url}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCanonicalTarget(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCanonical}
                disabled={canonicalSaving}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
