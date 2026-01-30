"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, Truck, Package, AlertCircle, MapPin, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getLogisticaPedidos, LogisticaPedido, getAppSettings, GeneralSettings } from "@/lib/api";

interface PedidoPorZona {
  zona_id: number;
  zona_nombre: string;
  pedidos: LogisticaPedido[];
}

interface LogisticaClientProps {
  initialVentas: LogisticaPedido[];
  diasEstimados: number;
}

export default function LogisticaClient({ initialVentas, diasEstimados: initialDiasEstimados }: LogisticaClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [ventas, setVentas] = useState<LogisticaPedido[]>(initialVentas);
  const [isLoading, setIsLoading] = useState(false);
  const [pedidosPorZona, setPedidosPorZona] = useState<PedidoPorZona[]>([]);
  const [todasLasZonas, setTodasLasZonas] = useState<PedidoPorZona[]>([]);
  const [diasEstimados, setDiasEstimados] = useState<number>(initialDiasEstimados);
  const [zonaPage, setZonaPage] = useState(1);
  const [zonasPerPage] = useState(5);
  const [pedidosPerPage] = useState(5);
  const [soloRetrasos, setSoloRetrasos] = useState(false);
  const [pedidosPagesPorZona, setPedidosPagesPorZona] = useState<Record<number, number>>({});

  // Actualizar días estimados si cambian
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAppSettings();
        setDiasEstimados(settings.general?.diasEstimadosEnvio || 3);
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Función para obtener la fecha de entrega (real o estimada)
  const obtenerFechaEntrega = (venta: LogisticaPedido): { date: Date | null; isReal: boolean } => {
    if (venta.fecha_entrega) {
      return { date: new Date(venta.fecha_entrega), isReal: true };
    }
    if (venta.fecha_detalle) {
      const fecha = new Date(venta.fecha_detalle);
      fecha.setDate(fecha.getDate() + diasEstimados);
      return { date: fecha, isReal: false };
    }
    return { date: null, isReal: false };
  };

  // Función para verificar si hay retraso
  const tieneRetraso = (venta: LogisticaPedido): boolean => {
    const { date: fechaEntrega } = obtenerFechaEntrega(venta);
    if (!fechaEntrega) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaEntrega.setHours(0, 0, 0, 0);

    if (venta.estado?.toLowerCase() === 'entregado') return false;

    return hoy > fechaEntrega;
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setZonaPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Cargar ventas
  const loadVentas = async () => {
    try {
      setIsLoading(true);

      const result = await getLogisticaPedidos({
        search: debouncedSearchTerm || undefined,
        solo_retrasos: soloRetrasos,
        dias_estimados: diasEstimados,
      });

      setVentas(result.ventas);
    } catch (error) {
      console.error("Error loading ventas:", error);
      setVentas([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar cuando cambia el término de búsqueda o el filtro
  useEffect(() => {
    loadVentas();
  }, [debouncedSearchTerm, soloRetrasos]);

  // Agrupar por zona y paginar
  useEffect(() => {
    if (ventas.length === 0) {
      setTodasLasZonas([]);
      setPedidosPorZona([]);
      return;
    }

    const agrupado: Record<number, LogisticaPedido[]> = {};
    for (const venta of ventas) {
      if (venta.zona_id) {
        if (!agrupado[venta.zona_id]) {
          agrupado[venta.zona_id] = [];
        }
        agrupado[venta.zona_id].push(venta);
      }
    }

    const pedidosPorZonaArray: PedidoPorZona[] = Object.entries(agrupado)
      .map(([zonaIdStr, pedidos]) => ({
        zona_id: parseInt(zonaIdStr),
        zona_nombre: `Zona ${zonaIdStr}`,
        pedidos: pedidos,
      }))
      .sort((a, b) => a.zona_id - b.zona_id);

    setTodasLasZonas(pedidosPorZonaArray);
  }, [ventas]);

  // Paginar zonas
  useEffect(() => {
    if (todasLasZonas.length === 0) {
      setPedidosPorZona([]);
      return;
    }

    const startZonaIndex = (zonaPage - 1) * zonasPerPage;
    const endZonaIndex = startZonaIndex + zonasPerPage;
    const zonasPaginadas = todasLasZonas.slice(startZonaIndex, endZonaIndex);
    setPedidosPorZona(zonasPaginadas);
  }, [zonaPage, todasLasZonas, zonasPerPage]);

  // Calcular total de retrasos
  const totalRetrasos = useMemo(() => {
    return ventas.filter(v => tieneRetraso(v)).length;
  }, [ventas, diasEstimados]);

  const getTipoTransporte = (venta: LogisticaPedido): string => {
    // Lógica para determinar tipo de transporte
    return "Propio"; // Por ahora retornamos "Propio" por defecto
  };

  const formatFecha = (fecha: string | null): string => {
    if (!fecha) return "N/A";
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  const getEstadoColor = (estado: string): string => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pagado') || estadoLower.includes('pago')) {
      return 'bg-green-100 text-green-700';
    } else if (estadoLower.includes('pendiente')) {
      return 'bg-yellow-100 text-yellow-700';
    } else if (estadoLower.includes('reparto') || estadoLower.includes('enviado') || estadoLower.includes('transito')) {
      return 'bg-blue-100 text-blue-700';
    } else if (estadoLower.includes('entregado') || estadoLower.includes('finalizado')) {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Envíos & Logística"
        description="Gestiona los envíos y pedidos por zona"
      />

      {/* Barra de búsqueda y acciones */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-6">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de pedido, cliente o dirección..."
              className="w-full pl-10 text-sm pr-4 py-3 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={loadVentas}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => {
              setSoloRetrasos(!soloRetrasos);
              setZonaPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-[6px] transition-colors cursor-pointer ${
              soloRetrasos
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {soloRetrasos ? (
              <>
                <Package className="w-4 h-4" />
                Ver todo
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Ver retrasos
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen de alertas cuando hay retrasos activos */}
      {!isLoading && soloRetrasos && totalRetrasos > 0 && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-[14px] p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {totalRetrasos} pedido(s) con retraso
              </p>
              <p className="text-xs text-red-700 mt-1">
                Hay pedidos que exceden los {diasEstimados} días estimados de envío
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {isLoading ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Cargando pedidos...</p>
        </div>
      ) : pedidosPorZona.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900 mb-1">No hay pedidos activos</p>
          <p className="text-sm text-gray-500">
            {soloRetrasos ? "No hay pedidos con retraso en este momento" : "No hay pedidos pendientes de entrega en este momento"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidosPorZona.map((zona) => (
            <div key={zona.zona_id} className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
              {/* Encabezado de zona */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {zona.zona_nombre}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {zona.pedidos.length} pedido{zona.pedidos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla de pedidos de la zona */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        N° Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Dirección
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Transporte
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Fecha Pedido
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Fecha Entrega
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Alerta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const pedidosPage = pedidosPagesPorZona[zona.zona_id] || 1;
                      const startIndex = (pedidosPage - 1) * pedidosPerPage;
                      const endIndex = startIndex + pedidosPerPage;
                      const pedidosPaginados = zona.pedidos.slice(startIndex, endIndex);

                      return pedidosPaginados.map((pedido) => {
                        const { date: fechaEntrega, isReal } = obtenerFechaEntrega(pedido);
                        const retraso = tieneRetraso(pedido);

                        return (
                          <tr key={pedido.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {pedido.numero_comprobante || `#${pedido.id}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {pedido.cliente_nombre || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <div>
                                <div>{pedido.cliente_direccion || "N/A"}</div>
                                {pedido.localidad && (
                                  <div className="text-xs text-gray-500">{pedido.localidad}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado || "")}`}
                              >
                                {capitalize(pedido.estado || "N/A")}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                              <div className="flex items-center justify-center gap-2">
                                <Truck className="w-4 h-4 text-gray-500" />
                                {getTipoTransporte(pedido)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                              {formatFecha(pedido.fecha_detalle)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                              {fechaEntrega ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  {formatFecha(fechaEntrega.toISOString())}
                                  {isReal && <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Real</span>}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {pedido.estado?.toLowerCase() === 'entregado' ? (
                                <span className="text-xs text-green-600 font-medium">Entregado</span>
                              ) : retraso ? (
                                <div className="flex items-center justify-center gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Retraso {isReal ? 'real' : 'estimado'}</span>
                                </div>
                              ) : fechaEntrega && new Date() >= fechaEntrega ? (
                                <div className="flex items-center justify-center gap-2 text-yellow-600">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-xs font-medium">Por vencer</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Paginación de pedidos por zona */}
              {(() => {
                const pedidosPage = pedidosPagesPorZona[zona.zona_id] || 1;
                const totalPagesPedidos = Math.ceil(zona.pedidos.length / pedidosPerPage);

                if (totalPagesPedidos <= 1) return null;

                return (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-700">
                      Mostrando {((pedidosPage - 1) * pedidosPerPage) + 1} a {Math.min(pedidosPage * pedidosPerPage, zona.pedidos.length)} de {zona.pedidos.length} pedido{zona.pedidos.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPedidosPagesPorZona(prev => ({ ...prev, [zona.zona_id]: Math.max(1, (prev[zona.zona_id] || 1) - 1) }))}
                        disabled={pedidosPage === 1}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors flex items-center gap-1 ${
                          pedidosPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
                        }`}
                      >
                        <ChevronLeft className="w-3 h-3" />
                        Anterior
                      </button>
                      <span className="text-sm text-gray-700 px-3">
                        Página {pedidosPage} de {totalPagesPedidos}
                      </span>
                      <button
                        onClick={() => setPedidosPagesPorZona(prev => ({ ...prev, [zona.zona_id]: Math.min(totalPagesPedidos, (prev[zona.zona_id] || 1) + 1) }))}
                        disabled={pedidosPage >= totalPagesPedidos}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors flex items-center gap-1 ${
                          pedidosPage >= totalPagesPedidos
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
                        }`}
                      >
                        Siguiente
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Paginación de zonas */}
      {!isLoading && todasLasZonas.length > zonasPerPage && pedidosPorZona.length > 0 && (
        <div className="mt-6 bg-white rounded-[14px] border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="text-sm text-gray-700">
              Mostrando zona {((zonaPage - 1) * zonasPerPage) + 1} a {Math.min(zonaPage * zonasPerPage, todasLasZonas.length)} de {todasLasZonas.length} zona{todasLasZonas.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZonaPage(p => Math.max(1, p - 1))}
                disabled={zonaPage === 1}
                className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors flex items-center gap-1 ${
                  zonaPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-sm text-gray-700 px-3">
                Página {zonaPage} de {Math.ceil(todasLasZonas.length / zonasPerPage)}
              </span>
              <button
                onClick={() => setZonaPage(p => Math.min(Math.ceil(todasLasZonas.length / zonasPerPage), p + 1))}
                disabled={zonaPage >= Math.ceil(todasLasZonas.length / zonasPerPage)}
                className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors flex items-center gap-1 ${
                  zonaPage >= Math.ceil(todasLasZonas.length / zonasPerPage)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                }`}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando hay búsqueda activa o filtro de retrasos */}
      {!isLoading && (debouncedSearchTerm || soloRetrasos) && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-[14px] p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-900">
              {debouncedSearchTerm && `Búsqueda activa: Mostrando resultados para "${debouncedSearchTerm}"`}
              {debouncedSearchTerm && soloRetrasos && " y "}
              {soloRetrasos && `Filtro de retrasos activo: Mostrando solo pedidos con retraso`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
