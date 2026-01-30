"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Search, TrendingUp, ShoppingCart, DollarSign, Package, Clock, User } from "lucide-react";
import { getUsersMetrics, UserMetrics } from "@/lib/api";
import Link from "next/link";

export default function MetricasUsuarios() {
  const [usersMetrics, setUsersMetrics] = useState<UserMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const perPage = 50;

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getUsersMetrics({
          page,
          per_page: perPage,
          search: searchQuery || undefined,
        });
        setUsersMetrics(response.users);
        setTotalPages(response.pagination.total_pages);
        setTotalUsers(response.pagination.total);
      } catch (err: any) {
        console.error("Error fetching user metrics:", err);
        setError(err.message || "Error al cargar métricas");
        setUsersMetrics([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      loadMetrics();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [page, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Métricas de Usuarios" 
        description="Análisis de comportamiento y compras de los usuarios" 
      />

      {/* Search Section */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-4 mb-6" style={{ borderRadius: '14px' }}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      {isLoading ? (
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center" style={{ borderRadius: '14px' }}>
          <p className="text-gray-500">Cargando métricas...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[10px] border border-red-200 p-8 text-center" style={{ borderRadius: '14px' }}>
          <p className="text-red-500">{error}</p>
        </div>
      ) : usersMetrics.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center" style={{ borderRadius: '14px' }}>
          <p className="text-gray-500">
            {searchQuery ? "No se encontraron usuarios con ese criterio de búsqueda." : "No hay métricas disponibles."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden" style={{ borderRadius: '14px' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compras
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Gastado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carritos Abandonados
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Compra
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversión
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersMetrics.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
                          <div className="text-sm text-gray-500">{user.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.orders.completed} completadas
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.orders.total} total
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(user.purchases.total_spent)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {user.purchases.avg_order_value > 0 
                            ? formatCurrency(user.purchases.avg_order_value)
                            : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-orange-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.abandoned_carts.count}
                            </div>
                            {user.abandoned_carts.total_value > 0 && (
                              <div className="text-xs text-gray-500">
                                {formatCurrency(user.abandoned_carts.total_value)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(user.purchases.last_purchase_date)}
                            </div>
                            {user.purchases.days_since_last_purchase !== null && (
                              <div className="text-xs text-gray-500">
                                Hace {user.purchases.days_since_last_purchase} días
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {user.conversion_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/clientes?userId=${user.user_id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-[10px] border border-gray-200 p-4" style={{ borderRadius: '14px' }}>
              <div className="text-sm text-gray-700">
                Mostrando página {page} de {totalPages} ({totalUsers} usuarios totales)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
