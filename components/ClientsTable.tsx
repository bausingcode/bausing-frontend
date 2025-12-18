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
    // Esperar a que termine la animación antes de desmontar
    setTimeout(() => {
      setSelectedClient(null);
    }, 300);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setTimeout(() => {
      setIsOverlayOpen(true);
    }, 10);
  };

  return (
    <>
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden" style={{ borderRadius: '14px' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Compras
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Saldo Billetera
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {client.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {client.telefono}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {client.compras}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center" style={{ color: '#155DFC' }}>
                    {client.saldoBilletera}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      client.is_suspended 
                        ? "bg-red-100 text-red-700" 
                        : client.estado === "Activo"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {client.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleViewClient(client)}
                        className="text-gray-600 cursor-pointer hover:text-gray-900 transition-colors p-1"
                        title="Ver detalles"
                        type="button"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
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

