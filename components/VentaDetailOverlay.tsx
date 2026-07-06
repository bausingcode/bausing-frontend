"use client";

import { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Venta } from "@/lib/api";

interface VentaDetailOverlayProps {
  venta: Venta;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (ventaId: number) => Promise<void>;
}

export default function VentaDetailOverlay({
  venta,
  isOpen,
  onClose,
  onDelete,
}: VentaDetailOverlayProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formatMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(venta.id);
      setShowConfirm(false);
      onClose();
    } catch (err: any) {
      setDeleteError(err?.message || "Error al eliminar la venta");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 z-[99] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ transition: 'opacity 350ms cubic-bezier(0.32, 0.72, 0, 1)' }}
      />

      {/* Overlay Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full bg-white z-[100]"
        style={{
          maxWidth: '480px',
          boxShadow: '-4px 0 32px rgba(0, 0, 0, 0.18)',
          transition: 'transform 350ms cubic-bezier(0.32, 0.72, 0, 1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles de la Venta
            </h2>
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={() => { setShowConfirm(true); setDeleteError(null); }}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar venta"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Información General
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Pedido
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.numero_comprobante || `#${venta.id}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </label>
                    <div className="mt-1">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {capitalize(venta.estado || "N/A")}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.fecha_detalle || venta.created_at?.split('T')[0] || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formatMonto(venta.total_venta || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Información del Cliente
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.cliente_nombre || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.cliente_telefono || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.email_cliente || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.cliente_direccion || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localidad
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.localidad || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {venta.documento_cliente || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items de la Venta */}
              {venta.js && venta.js.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Items de la Venta
                  </h3>
                  <div className="space-y-3">
                    {venta.js.map((item: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Item ID: {item.item_id || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Cantidad: {item.cantidad_recibida || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                              Precio: {formatMonto(item.precio || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatMonto((item.precio || 0) * (item.cantidad_recibida || 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Métodos de Pago */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Métodos de Pago
                </h3>
                {venta.pagos_procesados && venta.pagos_procesados.length > 0 ? (
                  <div className="space-y-3">
                    {venta.pagos_procesados.map((pago: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {pago.forma_pago_descripcion || "N/A"}
                            </p>
                            {pago.numero_comprobante && (
                              <p className="text-xs text-gray-500 mt-1">
                                Comprobante: {pago.numero_comprobante}
                              </p>
                            )}
                            {pago.fecha_cobranza && (
                              <p className="text-xs text-gray-500">
                                Fecha: {pago.fecha_cobranza}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatMonto(pago.valor_acreditado || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay pagos procesados</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-[6px] font-medium hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { if (!deleting) setShowConfirm(false); }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Eliminar esta venta?
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Se eliminará permanentemente la venta{" "}
                  <span className="font-medium text-gray-700">
                    {venta.numero_comprobante || `#${venta.id}`}
                  </span>{" "}
                  de {venta.cliente_nombre}. Esta acción no se puede deshacer.
                </p>
              </div>

              {deleteError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 w-full text-left">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setShowConfirm(false); setDeleteError(null); }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Sí, eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
