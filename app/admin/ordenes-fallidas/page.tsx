"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import {
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";
import {
  getFailedRetries,
  SaleRetryQueueItem,
  FailedRetriesResponse,
} from "@/lib/api";

export default function OrdenesFallidasAdmin() {
  const [data, setData] = useState<FailedRetriesResponse>({
    normal_pending: [],
    manual_required: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const result = await getFailedRetries();
      setData(result);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error("Error loading failed retries:", error);
      setError(`Error al cargar órdenes fallidas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (dateString == null) return "-";
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTable = (items: SaleRetryQueueItem[], showRetryCount: boolean = true) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">
            No hay registros
          </p>
          <p className="text-gray-400 text-sm">
            No se encontraron órdenes en esta categoría
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                Fecha Creación
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                Cliente
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                Email
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                Monto
              </th>
              {showRetryCount && (
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                  Reintentos
                </th>
              )}
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                Último Reintento
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                Error
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                Order ID
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(item.created_at)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">
                  {item.cliente_nombre || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {item.cliente_email || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(item.monto_total)}
                </td>
                {showRetryCount && (
                  <td className="py-3 px-4 text-sm text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.retry_count >= 5
                          ? "bg-red-100 text-red-800"
                          : item.retry_count >= 3
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.retry_count} / {item.max_retries}
                    </span>
                  </td>
                )}
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(item.last_retry_at)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={item.error_message || ""}>
                    {item.error_message || "-"}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 font-mono text-xs">
                  {item.order_id ? (
                    <span className="truncate block max-w-xs" title={item.order_id}>
                      {item.order_id}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Órdenes Fallidas"
        description="Gestiona las órdenes que fallaron al enviarse al CRM"
      />

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Información sobre procesamiento automático */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-900 font-medium mb-1">
            Procesamiento Automático
          </p>
          <p className="text-sm text-blue-700">
            Las órdenes pendientes se procesan automáticamente cada 30 minutos.
            {lastRefresh && (
              <span className="ml-2 text-blue-600">
                Última actualización: {lastRefresh.toLocaleTimeString("es-AR")}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {isLoading && data.normal_pending.length === 0 && data.manual_required.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando órdenes fallidas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sección: Requieren Proceso Manual */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Requieren Proceso Manual
                </h3>
              </div>
              <div className="text-sm text-gray-500">
                Total: {data.manual_required.length} órdenes
              </div>
            </div>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>⚠️ Atención:</strong> Estas órdenes han alcanzado 5 o más reintentos
                y requieren intervención manual para ser procesadas correctamente.
              </p>
            </div>
            {renderTable(data.manual_required, true)}
          </div>

          {/* Sección: Pendientes (Procesamiento Automático) */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Pendientes (Procesamiento Automático)
                </h3>
              </div>
              <div className="text-sm text-gray-500">
                Total: {data.normal_pending.length} órdenes
              </div>
            </div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Estas órdenes serán procesadas automáticamente en el próximo ciclo
                (cada 30 minutos). No requieren acción manual.
              </p>
            </div>
            {renderTable(data.normal_pending, true)}
          </div>
        </div>
      )}
    </div>
  );
}
