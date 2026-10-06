"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import {
  fetchCreatorProgramContentAdmin,
  saveCreatorProgramContent,
  type CreatorProgramContent,
} from "@/lib/api";
import { Users, Plus, Trash2, Loader2, Save, ChevronUp, ChevronDown } from "lucide-react";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900";
const labelClass = "block text-xs font-medium text-gray-600 mb-1.5";
const cardClass = "bg-white rounded-[14px] border border-gray-200 p-6";

function Field({
  label,
  value,
  onChange,
  textarea = false,
  minRows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  minRows?: number;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label className={labelClass}>{label}</label>
      {textarea ? (
        <AutoResizeTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minRows={minRows}
          className={inputClass}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  itemPlaceholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  itemPlaceholder?: string;
}) {
  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...items, ""]);
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const t = copy[index];
    copy[index] = copy[next];
    copy[next] = t;
    onChange(copy);
  };

  return (
    <div className="mb-4">
      <label className={labelClass}>{label}</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-1">
              <button
                type="button"
                aria-label="Subir"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="p-1 rounded-[6px] text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Bajar"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                className="p-1 rounded-[6px] text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={item}
              onChange={(e) => update(index, e.target.value)}
              className={`${inputClass} flex-1`}
              placeholder={itemPlaceholder}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="p-2 rounded-[6px] text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar item
      </button>
    </div>
  );
}

export default function ProgramaCreadoresClient() {
  const [content, setContent] = useState<CreatorProgramContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCreatorProgramContentAdmin();
      setContent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el contenido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const set = <K extends keyof CreatorProgramContent>(key: K, value: CreatorProgramContent[K]) => {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const saved = await saveCreatorProgramContent(content);
      setContent(saved);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} text-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Cargando contenido…</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div>
        <PageHeader title="Programa de Creadores" icon={<Users className="w-5 h-5" />} />
        <div className={`${cardClass} border-red-200 bg-red-50`}>
          <p className="text-sm text-red-800">{error || "No se pudo cargar el contenido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Programa de Creadores"
          description="Editá el contenido que ven los visitantes en /programa-de-creadores."
          icon={<Users className="w-5 h-5" />}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-[10px] bg-[#00C1A7] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 flex-shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </div>

      {error ? (
        <div className={`mb-6 ${cardClass} border-red-200 bg-red-50`}>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-[14px] border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">Contenido guardado correctamente.</p>
        </div>
      ) : null}

      <div className={`${cardClass} mb-6`}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Encabezado</h2>
        <Field label="Título" value={content.hero_title} onChange={(v) => set("hero_title", v)} />
        <Field
          label="Subtítulo"
          value={content.hero_subtitle}
          onChange={(v) => set("hero_subtitle", v)}
        />
        <Field
          label="Descripción"
          value={content.hero_description}
          onChange={(v) => set("hero_description", v)}
          textarea
          minRows={4}
        />
      </div>

      <div className={`${cardClass} mb-6`}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">¿Qué tenés que hacer?</h2>
        <Field
          label="Título de la sección"
          value={content.steps_title}
          onChange={(v) => set("steps_title", v)}
        />
        <ListEditor
          label="Pasos"
          items={content.steps}
          onChange={(v) => set("steps", v)}
          itemPlaceholder="Ej.: Compartirlo en tus redes sociales"
        />
      </div>

      <div className={`${cardClass} mb-6`}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">¿Qué necesitás para participar?</h2>
        <Field
          label="Título de la sección"
          value={content.requirements_title}
          onChange={(v) => set("requirements_title", v)}
        />
        <ListEditor
          label="Requisitos"
          items={content.requirements}
          onChange={(v) => set("requirements", v)}
          itemPlaceholder="Ej.: Perfil público"
        />
        <Field
          label="Frase destacada"
          value={content.requirements_note}
          onChange={(v) => set("requirements_note", v)}
        />
      </div>

      <div className={`${cardClass} mb-6`}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">¿Cómo me sumo?</h2>
        <Field
          label="Título de la sección"
          value={content.join_title}
          onChange={(v) => set("join_title", v)}
        />
        <Field
          label="Descripción"
          value={content.join_description}
          onChange={(v) => set("join_description", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Número de WhatsApp (con código de país, sin +)"
            value={content.whatsapp_number}
            onChange={(v) => set("whatsapp_number", v)}
            placeholder="5493518737683"
          />
          <Field
            label="Mensaje precargado de WhatsApp"
            value={content.whatsapp_message}
            onChange={(v) => set("whatsapp_message", v)}
          />
        </div>
        <Field
          label="Texto luego del contacto"
          value={content.join_followup}
          onChange={(v) => set("join_followup", v)}
          textarea
          minRows={3}
        />
      </div>

      <div className={`${cardClass} mb-6`}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">¿Por qué sumarte?</h2>
        <Field
          label="Título de la sección"
          value={content.benefits_title}
          onChange={(v) => set("benefits_title", v)}
        />
        <ListEditor
          label="Beneficios"
          items={content.benefits}
          onChange={(v) => set("benefits", v)}
          itemPlaceholder="Ej.: Monetizás tu contenido"
        />
      </div>

      <div className={cardClass}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Llamado a la acción</h2>
        <Field label="Título" value={content.cta_title} onChange={(v) => set("cta_title", v)} />
        <Field
          label="Texto del botón"
          value={content.cta_button_text}
          onChange={(v) => set("cta_button_text", v)}
        />
      </div>
    </div>
  );
}
