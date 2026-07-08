"use client";

import { MoreVertical } from "lucide-react";
import { useState } from "react";
import ClientDetailOverlay from "./ClientDetailOverlay";

interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  localidad: string;
  compras: number;
  totalGastado: string;
  ultimaCompra: string;
  saldoBilletera: string;
  estado: string;
  is_suspended?: boolean;
}

interface ClientsTableProps {
  clients: Client[];
  onToggleSuspend: (userId: string, currentStatus: boolean) => void;
}

export default function ClientsTable({ clients, onToggleSuspend }: ClientsTableProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
    setTimeout(() => setSelectedClient(null), 300);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setTimeout(() => setIsOverlayOpen(true), 10);
  };

  return (
    <>
      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compras
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total gastado
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última compra
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo billetera
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.nombre}</div>
                    <div className="text-xs text-gray-500">{client.email}</div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
                    {client.telefono}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {client.compras}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {client.totalGastado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                    {client.ultimaCompra}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium" style={{ color: '#155DFC' }}>
                    {client.saldoBilletera}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      client.is_suspended
                        ? "bg-red-100 text-red-700"
                        : client.estado === "Activo"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {client.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewClient(client)}
                      className="text-gray-500 cursor-pointer hover:text-gray-900 transition-colors p-1"
                      title="Ver detalles"
                      type="button"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClient && (
        <ClientDetailOverlay
          client={selectedClient}
          isOpen={isOverlayOpen}
          onClose={handleCloseOverlay}
          onSuspend={onToggleSuspend}
        />
      )}
    </>
  );
}
