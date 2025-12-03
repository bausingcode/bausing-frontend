"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Eye, Edit } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DateRangePicker from "@/components/DateRangePicker";

export default function VentasPedidos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [selectedMediosPago, setSelectedMediosPago] = useState<string[]>([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const orders = [
    {
      id: "#001234",
      cliente: "Juan Pérez",
      monto: "$45,000",
      estado: "Pagado",
      estadoColor: "green",
      medioPago: "Mercado Pago",
      fecha: "2025-11-28",
    },
    {
      id: "#001235",
      cliente: "María González",
      monto: "$32,500",
      estado: "Enviado",
      estadoColor: "blue",
      medioPago: "Mixto",
      fecha: "2025-11-27",
    },
    {
      id: "#001236",
      cliente: "Carlos Rodríguez",
      monto: "$67,800",
      estado: "Pendiente",
      estadoColor: "yellow",
      medioPago: "Efectivo",
      fecha: "2025-11-28",
    },
    {
      id: "#001237",
      cliente: "Ana Martínez",
      monto: "$28,900",
      estado: "Entregado",
      estadoColor: "purple",
      medioPago: "Billetera",
      fecha: "2025-11-26",
    },
    {
      id: "#001238",
      cliente: "Luis Fernández",
      monto: "$55,600",
      estado: "En Preparación",
      estadoColor: "orange",
      medioPago: "Mercado Pago",
      fecha: "2025-11-28",
    },
  ];

  const estadoColors = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  };

  // Opciones de filtros
  const estadosDisponibles = ["Pagado", "Enviado", "Pendiente", "Entregado", "En Preparación"];
  const mediosPagoDisponibles = ["Mercado Pago", "Mixto", "Efectivo", "Billetera"];

  // Toggle estado
  const toggleEstado = (estado: string) => {
    setSelectedEstados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  // Toggle medio de pago
  const toggleMedioPago = (medio: string) => {
    setSelectedMediosPago((prev) =>
      prev.includes(medio) ? prev.filter((m) => m !== medio) : [...prev, medio]
    );
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setSelectedEstados([]);
    setSelectedMediosPago([]);
    setFechaDesde("");
    setFechaHasta("");
  };

  // Filtrar pedidos por búsqueda, estado, medio de pago y fecha
  const filteredOrders = orders.filter((order) => {
    // Filtro de búsqueda
    const searchLower = searchTerm.toLowerCase();
    const orderId = order.id.toLowerCase();
    const clienteName = order.cliente.toLowerCase();
    const matchesSearch = searchTerm === "" || orderId.includes(searchLower) || clienteName.includes(searchLower);

    // Filtro por estado
    const matchesEstado = selectedEstados.length === 0 || selectedEstados.includes(order.estado);

    // Filtro por medio de pago
    const matchesMedioPago = selectedMediosPago.length === 0 || selectedMediosPago.includes(order.medioPago);

    // Filtro por fecha
    let matchesFecha = true;
    if (fechaDesde && order.fecha < fechaDesde) {
      matchesFecha = false;
    }
    if (fechaHasta && order.fecha > fechaHasta) {
      matchesFecha = false;
    }

    return matchesSearch && matchesEstado && matchesMedioPago && matchesFecha;
  });

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
              {/* Filtro por Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Estado del Envío
                </label>
                <div className="space-y-2">
                  {estadosDisponibles.map((estado) => {
                    const isChecked = selectedEstados.includes(estado);
                    return (
                      <label
                        key={estado}
                        className="flex items-center cursor-pointer group"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEstado(estado)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                              isChecked
                                ? "border-blue-600"
                                : "border-gray-300"
                            }`}
                            style={{
                              backgroundColor: isChecked ? '#155DFC' : 'white',
                            }}
                          >
                            {isChecked && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                          {estado}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Filtro por Medio de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Medio de Pago
                </label>
                <div className="space-y-2">
                  {mediosPagoDisponibles.map((medio) => {
                    const isChecked = selectedMediosPago.includes(medio);
                    return (
                      <label
                        key={medio}
                        className="flex items-center cursor-pointer group"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMedioPago(medio)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                              isChecked
                                ? "border-blue-600"
                                : "border-gray-300"
                            }`}
                            style={{
                              backgroundColor: isChecked ? '#155DFC' : 'white',
                            }}
                          >
                            {isChecked && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                          {medio}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Filtro por Fecha */}
              <div>
                <DateRangePicker
                  fechaDesde={fechaDesde}
                  fechaHasta={fechaHasta}
                  onFechaDesdeChange={setFechaDesde}
                  onFechaHastaChange={setFechaHasta}
                />
              </div>
            </div>

            {/* Botón Limpiar Filtros */}
            {(selectedEstados.length > 0 || selectedMediosPago.length > 0 || fechaDesde || fechaHasta) && (
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
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Medio de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.monto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColors[order.estadoColor as keyof typeof estadoColors]}`}
                    >
                      {order.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.medioPago}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

