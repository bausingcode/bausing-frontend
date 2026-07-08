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
  totalGastado: string;
  ultimaCompra: string;
  saldoBilletera: string;
  estado: string;
  is_suspended?: boolean;
}

const PER_PAGE = 30;

export default function Clientes() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Intl.DateTimeFormat("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(dateString));
    } catch {
      return "N/A";
    }
  };

  // Debounce del search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadCustomers = async (p: number, search: string) => {
    try {
      setIsLoading(true);
      const result = await fetchCustomers({ page: p, per_page: PER_PAGE, search: search || undefined });
      setUsers(result.users);
      setTotalPages(result.pagination.total_pages);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const clients: Client[] = useMemo(() => {
    return users.map((user) => ({
      id: user.id,
      nombre: `${user.first_name} ${user.last_name}`.trim(),
      telefono: user.phone || "N/A",
      email: user.email,
      localidad: "N/A",
      compras: user.total_orders ?? 0,
      totalGastado: user.total_spent ? formatCurrency(user.total_spent) : "$0",
      ultimaCompra: formatDate(user.last_order_date),
      saldoBilletera: user.wallet ? formatCurrency(user.wallet.balance) : "$0",
      estado: user.is_suspended ? "Suspendido" : (user.email_verified ? "Activo" : "Inactivo"),
      is_suspended: user.is_suspended || false,
    }));
  }, [users]);

  const handleCreateCustomer = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    await createCustomer(data);
    loadCustomers(page, debouncedSearch);
  };

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleSuspendCustomer(userId, !currentStatus);
      loadCustomers(page, debouncedSearch);
    } catch (error: any) {
      alert(`Error al actualizar cliente: ${error.message}`);
    }
  };

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, total);

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Clientes"
        description="Gestiona la información de tus clientes"
      />

      {/* Barra de búsqueda y acciones */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 cursor-pointer text-white rounded-[8px] font-medium hover:opacity-90 transition-colors flex items-center gap-2"
            style={{ backgroundColor: '#155DFC' }}
          >
            <Plus className="w-5 h-5" />
            Crear Cliente
          </button>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Cargando clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {debouncedSearch ? "No se encontraron clientes con ese criterio de búsqueda." : "No hay clientes registrados."}
          </p>
        </div>
      ) : (
        <>
          <ClientsTable clients={clients} onToggleSuspend={handleToggleSuspend} />

          {/* Paginación */}
          <div className="mt-4 flex items-center justify-between bg-white rounded-[14px] border border-gray-200 px-5 py-3.5">
            <div className="text-sm text-gray-600">
              {total > 0 ? `Mostrando ${start}–${end} de ${total} clientes` : "Sin resultados"}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700 px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          </div>
        </>
      )}

      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCustomer}
      />
    </div>
  );
}
