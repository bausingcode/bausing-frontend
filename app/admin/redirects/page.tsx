"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  RedirectRule,
  fetchAdminRedirects,
  createAdminRedirect,
  updateAdminRedirect,
  deleteAdminRedirect,
  getAppSettings,
  updateSeoSettings,
  SeoSettings,
} from "@/lib/api";
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

export default function AdminRedirectsPage() {
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

  useEffect(() => {
    load();
    loadSeo();
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

  const cardClass = "bg-white rounded-[10px] border border-gray-200";
  const cardRadius = { borderRadius: "14px" } as const;

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="SEO"
        description="Redirects, robots.txt, sitemap.xml y llms.txt en un solo lugar."
      />

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
    </div>
  );
}
