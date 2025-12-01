import { Search, SlidersHorizontal, Eye, Edit } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function VentasPedidos() {
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
              placeholder="Buscar por nombre, DNI, teléfono o número de pedido..."
              className="w-full pl-10 text-sm pr-4 py-3 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
          <button className="px-4 py-2 cursor-pointer text-white rounded-[6px] font-medium hover:opacity-90 transition-colors flex items-center gap-2" style={{ backgroundColor: '#155DFC' }}>
            <SlidersHorizontal className="w-5 h-5" />
            Filtros
          </button>
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
              {orders.map((order, index) => (
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

