"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  FaqItemAdmin,
  fetchAdminFaqItems,
  createAdminFaqItem,
  updateAdminFaqItem,
  deleteAdminFaqItem,
  reorderAdminFaqItems,
} from "@/lib/api";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  X,
  Save,
  Loader2,
} from "lucide-react";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";

export default function AdminPreguntasFrecuentesPage() {
  const [items, setItems] = useState<FaqItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItemAdmin | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqItemAdmin | null>(null);
  const [reordering, setReordering] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchAdminFaqItems();
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setQuestion("");
    setAnswer("");
    setPublished(true);
    setModalOpen(true);
  };

  const openEdit = (row: FaqItemAdmin) => {
    setEditing(row);
    setQuestion(row.question);
    setAnswer(row.answer);
    setPublished(row.is_published);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    const q = question.trim();
    const a = answer.trim();
    if (!q || !a) {
      setError("Completá pregunta y respuesta");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateAdminFaqItem(editing.id, {
          question: q,
          answer: a,
          is_published: published,
        });
      } else {
        await createAdminFaqItem({
          question: q,
          answer: a,
          is_published: published,
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

  const togglePublished = async (row: FaqItemAdmin) => {
    setError("");
    try {
      await updateAdminFaqItem(row.id, {
        is_published: !row.is_published,
      });
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
      await deleteAdminFaqItem(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  const moveRow = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    setReordering(true);
    setError("");
    const ids = items.map((i) => i.id);
    const t = ids[index];
    ids[index] = ids[next];
    ids[next] = t;
    try {
      const updated = await reorderAdminFaqItems(ids);
      setItems(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al reordenar");
      await load();
    } finally {
      setReordering(false);
    }
  };

  const cardClass =
    "bg-white rounded-[10px] border border-gray-200";
  const cardRadius = { borderRadius: "14px" } as const;

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Preguntas frecuentes"
        description="Gestioná las preguntas que ven los visitantes en /preguntas-frecuentes"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2
          className="text-lg font-normal"
          style={{ color: "#484848" }}
        >
          Listado
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nueva pregunta
        </button>
      </div>

      {error ? (
        <div
          className={`mb-6 ${cardClass} p-4 border-red-200 bg-red-50`}
          style={cardRadius}
        >
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Cargando preguntas…</p>
        </div>
      ) : items.length === 0 ? (
        <div className={`${cardClass} p-8 text-center`} style={cardRadius}>
          <p className="text-gray-500 text-sm">
            Todavía no hay preguntas. Creá la primera con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`} style={cardRadius}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-14">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Pregunta
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-36">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 w-40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          aria-label="Subir"
                          disabled={reordering || index === 0}
                          onClick={() => moveRow(index, -1)}
                          className="p-1 rounded-[6px] text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar"
                          disabled={reordering || index === items.length - 1}
                          onClick={() => moveRow(index, 1)}
                          className="p-1 rounded-[6px] text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium align-top max-w-md">
                      <span className="line-clamp-2">{row.question}</span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => togglePublished(row)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.is_published
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.is_published ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                        {row.is_published ? "Publicada" : "Borrador"}
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

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className={`${cardClass} shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6`}
            style={cardRadius}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar pregunta" : "Nueva pregunta"}
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
              Pregunta
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Ej.: ¿Hacen envíos a todo el país?"
            />

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Respuesta
            </label>
            <AutoResizeTextarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              minRows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Texto que se muestra al expandir la pregunta."
            />

            <label className="flex items-center gap-2 text-sm text-gray-800 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Visible en el sitio
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
          <div
            className={`${cardClass} shadow-xl max-w-md w-full p-6`}
            style={cardRadius}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Eliminar esta pregunta?
            </h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-3">
              {deleteTarget.question}
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
