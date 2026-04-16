"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { TicketPercent, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
  updateAdminCoupon,
  type AdminCoupon,
  type AdminCouponsScope,
} from "@/lib/api";

const emptyForm = {
  code: "",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: "" as string | number,
  max_uses: "" as string | number,
  valid_from: "",
  valid_until: "",
  is_active: true,
  club_beneficios_only: false,
};

type CouponFormState = typeof emptyForm;

const btnPrimary =
  "rounded-[10px] bg-[#00C1A7] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity";
const btnSecondary =
  "rounded-[10px] border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const btnSecondaryActive =
  "rounded-[10px] border border-[#00C1A7] bg-[#00C1A7] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity";
const fieldClass =
  "w-full rounded-[10px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-600 focus:border-[#00C1A7] focus:outline-none focus:ring-1 focus:ring-[#00C1A7]";
const labelClass = "mb-1 block text-sm font-medium text-gray-800";

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function couponToForm(c: AdminCoupon): CouponFormState {
  return {
    code: c.code,
    discount_type: c.discount_type,
    discount_value: c.discount_value,
    max_uses: c.max_uses ?? "",
    valid_from: isoToDatetimeLocal(c.valid_from),
    valid_until: isoToDatetimeLocal(c.valid_until),
    is_active: c.is_active,
    club_beneficios_only: c.club_beneficios_only,
  };
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto" aria-busy aria-label="Cargando cupones">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-800">
            <th className="pb-2 pr-3 font-medium">Código</th>
            <th className="pb-2 pr-3 font-medium">Alcance</th>
            <th className="pb-2 pr-3 font-medium">Descuento</th>
            <th className="pb-2 pr-3 font-medium">Usos</th>
            <th className="pb-2 pr-3 font-medium">Estado</th>
            <th className="pb-2 w-24 font-medium"> </th>
          </tr>
        </thead>
        <tbody className="animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 pr-3">
                <div className="h-4 w-28 rounded bg-gray-200" />
              </td>
              <td className="py-3 pr-3">
                <div className="h-4 w-16 rounded bg-gray-200" />
              </td>
              <td className="py-3 pr-3">
                <div className="h-4 w-20 rounded bg-gray-200" />
              </td>
              <td className="py-3 pr-3">
                <div className="h-4 w-14 rounded bg-gray-200" />
              </td>
              <td className="py-3 pr-3">
                <div className="h-6 w-16 rounded-full bg-gray-200" />
              </td>
              <td className="py-3">
                <div className="flex gap-1">
                  <div className="h-8 w-8 rounded-[6px] bg-gray-200" />
                  <div className="h-8 w-8 rounded-[6px] bg-gray-200" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CouponFields({
  form,
  setForm,
}: {
  form: CouponFormState;
  setForm: React.Dispatch<React.SetStateAction<CouponFormState>>;
}) {
  return (
    <>
      <div>
        <label className={labelClass}>Código</label>
        <input
          required
          maxLength={64}
          value={form.code}
          onChange={(ev) => setForm((f) => ({ ...f, code: ev.target.value }))}
          className={`${fieldClass} uppercase`}
          placeholder="Ej: VERANO26"
        />
      </div>
      <div>
        <label className={labelClass}>Alcance</label>
        <select
          value={form.club_beneficios_only ? "club" : "general"}
          onChange={(ev) =>
            setForm((f) => ({
              ...f,
              club_beneficios_only: ev.target.value === "club",
            }))
          }
          className={fieldClass}
        >
          <option value="general">General — todo el catálogo</option>
          <option value="club">Solo Club Beneficios</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={form.discount_type}
            onChange={(ev) =>
              setForm((f) => ({
                ...f,
                discount_type: ev.target.value as "percentage" | "fixed",
              }))
            }
            className={fieldClass}
          >
            <option value="percentage">Porcentaje</option>
            <option value="fixed">Monto fijo ($)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Valor</label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.discount_value}
            onChange={(ev) =>
              setForm((f) => ({ ...f, discount_value: ev.target.value }))
            }
            className={fieldClass}
            placeholder="Ej: 10 o 15.5"
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Usos máximos</label>
        <p className="mb-1.5 text-xs text-gray-600">Vacío = usos ilimitados</p>
        <input
          type="number"
          min={1}
          value={form.max_uses}
          onChange={(ev) => setForm((f) => ({ ...f, max_uses: ev.target.value }))}
          className={fieldClass}
          placeholder="Ej: 100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Válido desde</label>
          <p className="mb-1.5 text-xs text-gray-600">Opcional</p>
          <input
            type="datetime-local"
            value={form.valid_from}
            onChange={(ev) =>
              setForm((f) => ({ ...f, valid_from: ev.target.value }))
            }
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Válido hasta</label>
          <p className="mb-1.5 text-xs text-gray-600">Opcional</p>
          <input
            type="datetime-local"
            value={form.valid_until}
            onChange={(ev) =>
              setForm((f) => ({ ...f, valid_until: ev.target.value }))
            }
            className={fieldClass}
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-900">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(ev) =>
            setForm((f) => ({ ...f, is_active: ev.target.checked }))
          }
          className="h-4 w-4 rounded"
        />
        Activo
      </label>
    </>
  );
}

function submitFormPayload(form: CouponFormState) {
  const dv = Number(form.discount_value);
  if (!Number.isFinite(dv) || dv <= 0) {
    throw new Error("Ingresá un descuento válido mayor a 0");
  }
  let maxUses: number | null = null;
  if (String(form.max_uses).trim() !== "") {
    const m = parseInt(String(form.max_uses), 10);
    if (!Number.isFinite(m) || m < 1) {
      throw new Error("Usos máximos: número entero ≥ 1 o vacío");
    }
    maxUses = m;
  }
  return {
    code: form.code.trim(),
    discount_type: form.discount_type,
    discount_value: dv,
    max_uses: maxUses,
    valid_from: form.valid_from.trim() ? form.valid_from.trim() : null,
    valid_until: form.valid_until.trim() ? form.valid_until.trim() : null,
    is_active: form.is_active,
    club_beneficios_only: form.club_beneficios_only,
  };
}

export default function CuponesClient() {
  const [listScope, setListScope] = useState<AdminCouponsScope>("all");
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [editForm, setEditForm] = useState<CouponFormState>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await fetchAdminCoupons(listScope);
      setCoupons(rows);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Error al cargar cupones");
    } finally {
      setLoading(false);
    }
  }, [listScope]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (c: AdminCoupon) => {
    setEditing(c);
    setEditForm(couponToForm(c));
    setError(null);
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      setEditSaving(true);
      setError(null);
      const payload = submitFormPayload(editForm);
      await updateAdminCoupon(editing.id, payload);
      closeEdit();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteSaving(true);
      setError(null);
      await deleteAdminCoupon(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = submitFormPayload(form);
      await createAdminCoupon(payload);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear cupón");
    } finally {
      setSaving(false);
    }
  };

  const formatDiscount = (c: AdminCoupon) => {
    if (c.discount_type === "percentage") {
      return `${c.discount_value}%`;
    }
    return `$${c.discount_value.toLocaleString("es-AR")}`;
  };

  const scopeLabel = (c: AdminCoupon) =>
    c.club_beneficios_only ? "Club" : "General";

  return (
    <div>
      <PageHeader
        title="Cupones de descuento"
        description="Cupones generales para el catálogo, o exclusivos del Club Beneficios (el checkout debe validar el alcance)."
        icon={<TicketPercent className="w-5 h-5" />}
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-[12px] border border-gray-200 bg-gray-50/50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <Plus className="w-5 h-5 text-gray-800" />
            Nuevo cupón
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <CouponFields form={form} setForm={setForm} />
            <button type="submit" disabled={saving} className={`w-full ${btnPrimary}`}>
              {saving ? "Guardando…" : "Crear cupón"}
            </button>
          </form>
        </section>

        <section className="rounded-[12px] border border-gray-200 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              Listado
              {!loading ? <span className="font-normal text-gray-600"> ({coupons.length})</span> : null}
            </h2>
            <div className="flex flex-wrap gap-2 text-sm">
              {(
                [
                  { id: "all" as const, label: "Todos" },
                  { id: "general" as const, label: "Generales" },
                  { id: "club" as const, label: "Solo Club" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setListScope(opt.id)}
                  disabled={loading}
                  className={
                    listScope === opt.id ? btnSecondaryActive : btnSecondary
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <TableSkeleton />
          ) : coupons.length === 0 ? (
            <p className="text-sm text-gray-700">No hay cupones en este filtro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-800">
                    <th className="pb-2 pr-3 font-medium">Código</th>
                    <th className="pb-2 pr-3 font-medium">Alcance</th>
                    <th className="pb-2 pr-3 font-medium">Descuento</th>
                    <th className="pb-2 pr-3 font-medium">Usos</th>
                    <th className="pb-2 pr-3 font-medium">Estado</th>
                    <th className="pb-2 w-28 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                      <td className="py-2 pr-3 font-mono text-gray-900">{c.code}</td>
                      <td className="py-2 pr-3 text-gray-700">{scopeLabel(c)}</td>
                      <td className="py-2 pr-3 text-gray-700">{formatDiscount(c)}</td>
                      <td className="py-2 pr-3 text-gray-800">
                        {c.max_uses != null
                          ? `${c.uses_count} / ${c.max_uses}`
                          : `${c.uses_count} / ∞`}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            c.is_active
                              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                              : "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          }
                        >
                          {c.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="inline-flex rounded-[6px] p-2 text-gray-600 transition-colors hover:bg-gray-100"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            className="inline-flex rounded-[6px] p-2 text-red-600 transition-colors hover:bg-red-50"
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
          )}
        </section>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[14px] border border-gray-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal
            aria-labelledby="edit-coupon-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="edit-coupon-title" className="text-lg font-semibold text-gray-900">
                Editar cupón
              </h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <CouponFields form={editForm} setForm={setEditForm} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className={`${btnSecondary} px-4 py-2`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleEditSave()}
                disabled={editSaving}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2 ${btnPrimary}`}
              >
                {editSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[14px] border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              ¿Eliminar este cupón?
            </h3>
            <p className="mb-6 font-mono text-sm text-gray-800">{deleteTarget.code}</p>
            <p className="mb-6 text-sm text-gray-600">
              Esta acción no se puede deshacer. Si el cupón ya se usó en pedidos, considerá desactivarlo en lugar de borrarlo.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteSaving}
                className={`${btnSecondary} px-4 py-2`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteSaving}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
