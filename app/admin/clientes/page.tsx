import PageHeader from "@/components/PageHeader";
import ClientsTable from "@/components/ClientsTable";
import { Search, Download } from "lucide-react";

export default function Clientes() {
  const clients = [
    {
      nombre: "Juan Pérez",
      telefono: "+54 9 11 1234-5678",
      email: "juan.perez@email.com",
      localidad: "Buenos Aires, Buenos Aires",
      compras: 5,
      ultimaCompra: "2025-11-28",
      saldoBilletera: "$12,500",
      estado: "Activo",
    },
    {
      nombre: "María González",
      telefono: "+54 9 11 2345-6789",
      email: "maria.gonzalez@email.com",
      localidad: "Córdoba, Córdoba",
      compras: 3,
      ultimaCompra: "2025-11-27",
      saldoBilletera: "$8,200",
      estado: "Activo",
    },
    {
      nombre: "Carlos Rodríguez",
      telefono: "+54 9 11 3456-7890",
      email: "carlos.rodriguez@email.com",
      localidad: "Rosario, Santa Fe",
      compras: 2,
      ultimaCompra: "2025-11-28",
      saldoBilletera: "$0",
      estado: "Activo",
    },
    {
      nombre: "Ana Martínez",
      telefono: "+54 9 11 4567-8901",
      email: "ana.martinez@email.com",
      localidad: "Mendoza, Mendoza",
      compras: 7,
      ultimaCompra: "2025-11-26",
      saldoBilletera: "$25,600",
      estado: "Activo",
    },
  ];

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Clientes" 
        description="Gestiona la información de tus clientes" 
      />

      {/* Search and Export Section */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-4 mb-6" style={{ borderRadius: '14px' }}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
          <button className="px-4 py-2 cursor-pointer text-white rounded-[6px] font-medium hover:opacity-90 transition-colors flex items-center gap-2" style={{ backgroundColor: '#155DFC' }}>
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <ClientsTable clients={clients} />
    </div>
  );
}

