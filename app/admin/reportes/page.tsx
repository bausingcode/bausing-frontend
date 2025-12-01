"use client";

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from "@/components/PageHeader";

export default function Reportes() {
  // Datos para Ventas por Día (últimos 7 días)
  const ventasPorDia = [
    { fecha: '22/1', ventas: 4500 },
    { fecha: '23/1', ventas: 5200 },
    { fecha: '24/1', ventas: 4800 },
    { fecha: '25/1', ventas: 6100 },
    { fecha: '26/1', ventas: 7200 },
    { fecha: '27/1', ventas: 6800 },
    { fecha: '28/1', ventas: 6200 },
  ];

  // Datos para Ventas por Modelo
  const ventasPorModelo = [
    { modelo: 'Fénix', ventas: 150000 },
    { modelo: 'Perla', ventas: 90000 },
    { modelo: 'Diamante', ventas: 220000 },
    { modelo: 'Base Premium', ventas: 70000 },
  ];

  // Datos para Ventas por Provincia
  const ventasPorProvincia = [
    { name: 'Buenos Aires', value: 45, color: '#3B82F6' },
    { name: 'Córdoba', value: 18, color: '#10B981' },
    { name: 'Santa Fe', value: 12, color: '#F59E0B' },
    { name: 'Mendoza', value: 10, color: '#EF4444' },
    { name: 'Otras', value: 15, color: '#8B5CF6' },
  ];

  // Datos para Uso de Billetera Bausing
  const usoBilletera = [
    { mes: 'Ago', Otorgado: 4800, Pendiente: 1000, Usado: 2000 },
    { mes: 'Sep', Otorgado: 5200, Pendiente: 1200, Usado: 4000 },
    { mes: 'Oct', Otorgado: 7000, Pendiente: 1500, Usado: 5000 },
    { mes: 'Nov', Otorgado: 8500, Pendiente: 2500, Usado: 6000 },
  ];

  // Top 5 Mejores Clientes
  const topClientes = [
    { posicion: 1, cliente: 'Ana Martínez', compras: 7, total: '$245,000' },
    { posicion: 2, cliente: 'Juan Pérez', compras: 5, total: '$189,000' },
    { posicion: 3, cliente: 'María González', compras: 4, total: '$156,000' },
    { posicion: 4, cliente: 'Carlos López', compras: 4, total: '$142,000' },
    { posicion: 5, cliente: 'Laura Sánchez', compras: 3, total: '$138,000' },
  ];

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Estadísticas" 
        description="Analiza el rendimiento de tu negocio" 
      />

      {/* Top Row Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-[10px] border border-gray-200 p-4" style={{ borderRadius: '14px' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: '#484848' }}>Ventas del Mes</h3>
          <p className="text-2xl font-normal text-gray-900 mb-2">$995,000</p>
          <div className="flex items-center gap-1 text-xs">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-green-600 font-medium">+18.5%</span>
            <span className="text-gray-500">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-200 p-4" style={{ borderRadius: '14px' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: '#484848' }}>Pedidos del Mes</h3>
          <p className="text-2xl font-normal text-gray-900 mb-2">323</p>
          <div className="flex items-center gap-1 text-xs">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-green-600 font-medium">+12.3%</span>
            <span className="text-gray-500">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-200 p-4" style={{ borderRadius: '14px' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: '#484848' }}>Ticket Promedio</h3>
          <p className="text-2xl font-normal text-gray-900 mb-2">$3,080</p>
          <div className="flex items-center gap-1 text-xs">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-green-600 font-medium">+5.2%</span>
            <span className="text-gray-500">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-200 p-4" style={{ borderRadius: '14px' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: '#484848' }}>Tasa de Recompra</h3>
          <p className="text-2xl font-normal text-gray-900 mb-2">27.5%</p>
          <p className="text-xs text-gray-500">89 de 323</p>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ventas por Día */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6 relative" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Ventas por Día (Últimos 7 días)</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasPorDia}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis key="xaxis" dataKey="fecha" stroke="#6B7280" fontSize={12} />
              <YAxis key="yaxis" stroke="#6B7280" fontSize={12} domain={[0, 8000]} ticks={[0, 2000, 4000, 6000, 8000]} />
              <Tooltip key="tooltip" />
              <Line key="line" type="monotone" dataKey="ventas" stroke="#155DFC" strokeWidth={2} dot={{ fill: '#155DFC' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por Modelo */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6 relative" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Ventas por Modelo</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorModelo}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis key="xaxis" dataKey="modelo" stroke="#6B7280" fontSize={12} />
              <YAxis key="yaxis" stroke="#6B7280" fontSize={12} domain={[0, 240000]} ticks={[0, 60000, 120000, 180000, 240000]} />
              <Tooltip key="tooltip" />
              <Bar key="bar" dataKey="ventas" fill="#155DFC" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lower Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ventas por Provincia */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6 relative" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Ventas por Provincia</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                key="pie"
                data={ventasPorProvincia}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ventasPorProvincia.map((entry, index) => (
                  <Cell key={`cell-${index}-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip key="tooltip" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Uso de Billetera Bausing */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6 relative" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Uso de Billetera Bausing</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usoBilletera}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis key="xaxis" dataKey="mes" stroke="#6B7280" fontSize={12} />
              <YAxis key="yaxis" stroke="#6B7280" fontSize={12} domain={[0, 10000]} ticks={[0, 2500, 5000, 7500, 10000]} />
              <Tooltip key="tooltip" />
              <Legend key="legend" />
              <Bar key="bar-otorgado" dataKey="Otorgado" fill="#3B82F6" />
              <Bar key="bar-pendiente" dataKey="Pendiente" fill="#F59E0B" />
              <Bar key="bar-usado" dataKey="Usado" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Mejores Clientes */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-6 mb-8" style={{ borderRadius: '14px' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Top 5 Mejores Clientes</h2>
          <button className="px-4 py-2 bg-green-500 text-white rounded-[10px] text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Posición
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cantidad de Compras
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Gastado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topClientes.map((cliente) => (
                <tr key={cliente.posicion} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    {cliente.posicion}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                    {cliente.cliente}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                    {cliente.compras} compras
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    {cliente.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exportar Reportes Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[10px] border border-gray-200 p-6" style={{ borderRadius: '14px' }}>
          <h3 className="text-base font-medium text-gray-900 mb-2">Reporte Completo de Ventas</h3>
          <p className="text-sm text-gray-600 mb-4">Incluye todos los datos de ventas del período</p>
          <button className="w-full px-4 py-2 text-white rounded-[10px] text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#155DFC' }}>
            Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-200 p-6" style={{ borderRadius: '14px' }}>
          <h3 className="text-base font-medium text-gray-900 mb-2">Reporte de Billetera</h3>
          <p className="text-sm text-gray-600 mb-4">Movimientos y estadísticas de Pesos Bausing</p>
          <button className="w-full px-4 py-2 text-white rounded-[10px] text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#155DFC' }}>
            Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-200 p-6" style={{ borderRadius: '14px' }}>
          <h3 className="text-base font-medium text-gray-900 mb-2">Reporte de Clientes</h3>
          <p className="text-sm text-gray-600 mb-4">Base de datos completa con historial</p>
          <button className="w-full px-4 py-2 text-white rounded-[10px] text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#155DFC' }}>
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
}

