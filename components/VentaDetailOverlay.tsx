"use client";

import { X } from "lucide-react";
import { Venta } from "@/lib/api";

interface VentaDetailOverlayProps {
  venta: Venta;
  isOpen: boolean;
  onClose: () => void;
}

export default function VentaDetailOverlay({
  venta,
  isOpen,
  onClose,
}: VentaDetailOverlayProps) {
  // Formatear monto
  const formatMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  // Capitalizar primera letra
  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <>
      {/* Overlay Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles de la Venta
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
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

              {/* Pagos Procesados */}
              {venta.pagos_procesados && venta.pagos_procesados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Pagos Procesados
                  </h3>
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
                </div>
              )}
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
    </>
  );
}

