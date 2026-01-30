"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Eye, Loader2, Package, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DateRangePicker from "@/components/DateRangePicker";
import VentaDetailOverlay from "@/components/VentaDetailOverlay";
import { fetchVentas, Venta } from "@/lib/api";

export default function VentasPedidos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<string>("");
  const [selectedMedioPago, setSelectedMedioPago] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [estadosDisponibles, setEstadosDisponibles] = useState<string[]>([]);
  const [mediosPagoDisponibles, setMediosPagoDisponibles] = useState<string[]>([]);

  // Función para cargar ventas
  const loadVentas = async () => {
    try {
      setIsLoading(true);
      const result = await fetchVentas({
        search: searchTerm || undefined,
        estados: selectedEstado ? [selectedEstado] : undefined,
        medios_pago: selectedMedioPago ? [selectedMedioPago] : undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        page,
        per_page: perPage,
      });
      setVentas(result.ventas);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.pages);
      
      // Actualizar estados y medios de pago disponibles desde todas las ventas
      // Para esto necesitaríamos hacer una consulta sin filtros, pero por ahora
      // usamos los estados y medios de pago de las ventas cargadas
      const estados = Array.from(new Set(result.ventas.map(v => v.estado).filter(Boolean))).sort() as string[];
      const medios = Array.from(
        new Set(
          result.ventas.flatMap(v => 
            v.pagos_procesados?.map((p: any) => p.forma_pago_descripcion || "N/A") || []
          )
        )
      ).sort() as string[];
      setEstadosDisponibles(estados);
      setMediosPagoDisponibles(medios);
    } catch (error) {
      console.error("Error loading ventas:", error);
      setVentas([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar ventas al montar y cuando cambian los filtros
  useEffect(() => {
    loadVentas();
  }, [page, searchTerm, selectedEstado, selectedMedioPago, fechaDesde, fechaHasta]);

  // Capitalizar primera letra
  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Mapear estados a colores
  const getEstadoColor = (estado: string): string => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes("pagado") || estadoLower.includes("entregado") || estadoLower.includes("finalizado")) {
      return "bg-green-100 text-green-700";
    }
    if (estadoLower.includes("enviado") || estadoLower.includes("reparto")) {
      return "bg-blue-100 text-blue-700";
    }
    if (estadoLower.includes("pendiente")) {
      return "bg-yellow-100 text-yellow-700";
    }
    if (estadoLower.includes("preparación") || estadoLower.includes("preparacion")) {
      return "bg-orange-100 text-orange-700";
    }
    if (estadoLower.includes("cancelado")) {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setSelectedEstado("");
    setSelectedMedioPago("");
    setFechaDesde("");
    setFechaHasta("");
    setSearchTerm("");
    setPage(1);
  };

  // Formatear monto
  const formatMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  // Obtener medio de pago principal de una venta
  const getMedioPagoPrincipal = (venta: Venta): string => {
    if (venta.pagos_procesados && venta.pagos_procesados.length > 0) {
      return venta.pagos_procesados[0].forma_pago_descripcion || "N/A";
    }
    return "N/A";
  };

  // Abrir overlay con detalles de venta
  const handleViewVenta = (venta: Venta) => {
    setSelectedVenta(venta);
    setIsOverlayOpen(true);
  };

  // Cerrar overlay
  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
    setSelectedVenta(null);
  };

  // Manejar cambio de búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Resetear a primera página cuando cambia la búsqueda
      loadVentas();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Ventas" 
        description="Gestiona todos los pedidos de tu tienda" 
      />

      {/* Search and Filter Section */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-4 mb-6" style={{ borderRadius: '14px' }}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre del cliente o número de pedido..."
              className="w-full pl-10 text-sm pr-4 py-3 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="px-4 py-2 cursor-pointer text-white rounded-[6px] font-medium hover:opacity-90 transition-colors flex items-center gap-2" 
            style={{ backgroundColor: '#155DFC' }}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {/* Panel de Filtros con animación smooth */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isFiltersOpen ? "max-h-[800px] opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Filtro por Estado del Envío */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Estado del Envío
                </label>
                <select
                  value={selectedEstado}
                  onChange={(e) => {
                    setSelectedEstado(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-gray-800 bg-white hover:bg-gray-50/80 transition-colors select-arrow"
                >
                  <option value="">Todos</option>
                  {estadosDisponibles.map((estado) => (
                    <option key={estado} value={estado}>
                      {capitalize(estado)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Medio de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Medio de Pago
                </label>
                <select
                  value={selectedMedioPago}
                  onChange={(e) => {
                    setSelectedMedioPago(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-gray-800 bg-white hover:bg-gray-50/80 transition-colors select-arrow"
                >
                  <option value="">Todos</option>
                  {mediosPagoDisponibles.map((medio) => (
                    <option key={medio} value={medio}>
                      {medio}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Fecha */}
              <div>
                <DateRangePicker
                  fechaDesde={fechaDesde}
                  fechaHasta={fechaHasta}
                  onFechaDesdeChange={(fecha) => {
                    setFechaDesde(fecha);
                    setPage(1);
                  }}
                  onFechaHastaChange={(fecha) => {
                    setFechaHasta(fecha);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Botón Limpiar Filtros */}
            {(selectedEstado || selectedMedioPago || fechaDesde || fechaHasta || searchTerm) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={limpiarFiltros}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden" style={{ borderRadius: '14px' }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ventas</h3>
          <button
            onClick={loadVentas}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refrescar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  N° Pedido
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                {/* <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Medio de Pago
                </th> */}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-sm text-gray-600">Cargando ventas...</p>
                    </div>
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="w-12 h-12 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">No hay ventas</p>
                      <p className="text-sm text-gray-500">
                        Aún no hay ventas registradas
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-medium text-gray-900">
                      {venta.numero_comprobante || `#${venta.id}`}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-700">
                      {venta.cliente_nombre || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-700">
                      {formatMonto(venta.total_venta || 0)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado || "")}`}
                      >
                        {capitalize(venta.estado || "N/A")}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getMedioPagoPrincipal(venta)}
                    </td> */}
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-700">
                      {venta.fecha_detalle || venta.created_at?.split('T')[0] || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3 justify-center">
                        <button 
                          onClick={() => handleViewVenta(venta)}
                          className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Mostrando {((page - 1) * perPage) + 1} a {Math.min(page * perPage, total)} de {total} ventas
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors ${
                  page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors ${
                  page === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                }`}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay de Detalles */}
      {selectedVenta && (
        <VentaDetailOverlay
          venta={selectedVenta}
          isOpen={isOverlayOpen}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  );
}
