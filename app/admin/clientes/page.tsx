"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import ClientsTable from "@/components/ClientsTable";
import CreateCustomerModal from "@/components/CreateCustomerModal";
import { Search, Plus } from "lucide-react";
import { fetchCustomers, User, createCustomer, toggleSuspendCustomer } from "@/lib/api";

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

export default function Clientes() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        const customers = await fetchCustomers();
        setUsers(customers);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Convert users to clients format
  const clients: Client[] = useMemo(() => {
    return users.map((user) => ({
      id: user.id,
      nombre: `${user.first_name} ${user.last_name}`.trim(),
      telefono: user.phone || "N/A",
      email: user.email,
      localidad: "N/A", // Not available in user model yet
      compras: 0, // Not available in user model yet
      ultimaCompra: "N/A", // Not available in user model yet
      saldoBilletera: "$0", // Not available in user model yet
      estado: user.is_suspended ? "Suspendido" : (user.email_verified ? "Activo" : "Inactivo"),
      is_suspended: user.is_suspended || false,
    }));
  }, [users]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return clients;
    }

    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.nombre.toLowerCase().includes(query) ||
        client.telefono.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const handleCreateCustomer = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    try {
      await createCustomer(data);
      
      // Recargar lista de clientes
      const customers = await fetchCustomers();
      setUsers(customers);
    } catch (error: any) {
      throw error;
    }
  };

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleSuspendCustomer(userId, !currentStatus);
      
      // Recargar lista de clientes
      const customers = await fetchCustomers();
      setUsers(customers);
    } catch (error: any) {
      alert(`Error al actualizar cliente: ${error.message}`);
    }
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Clientes" 
        description="Gestiona la información de tus clientes" 
      />

      {/* Search and Create Section */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-4 mb-6" style={{ borderRadius: '14px' }}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 cursor-pointer text-white rounded-[6px] font-medium hover:opacity-90 transition-colors flex items-center gap-2" 
            style={{ backgroundColor: '#155DFC' }}
          >
            <Plus className="w-5 h-5" />
            Crear Cliente
          </button>
        </div>
      </div>

      {/* Clients Table */}
      {isLoading ? (
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center" style={{ borderRadius: '14px' }}>
          <p className="text-gray-500">Cargando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center" style={{ borderRadius: '14px' }}>
          <p className="text-gray-500">
            {searchQuery ? "No se encontraron clientes con ese criterio de búsqueda." : "No hay clientes registrados."}
          </p>
        </div>
      ) : (
        <ClientsTable clients={filteredClients} onToggleSuspend={handleToggleSuspend} />
      )}

      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCustomer}
      />
    </div>
  );
}

