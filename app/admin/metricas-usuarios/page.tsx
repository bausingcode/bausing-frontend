"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Search, TrendingUp, ShoppingCart, DollarSign, Package, Clock, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { getUsersMetrics, UserMetrics } from "@/lib/api";
import Link from "next/link";

type SortField = "total_spent" | "completed_orders" | "pending_orders" | "avg_order_value" | "total_orders" | "last_purchase_date" | "user_created_at";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "total_spent", label: "Total gastado" },
  { value: "completed_orders", label: "Compras completadas" },
  { value: "avg_order_value", label: "Valor promedio" },
  { value: "pending_orders", label: "Carritos pendientes" },
  { value: "total_orders", label: "Total órdenes" },
  { value: "last_purchase_date", label: "Última compra" },
  { value: "user_created_at", label: "Fecha de registro" },
];

export default function MetricasUsuarios() {
  const [usersMetrics, setUsersMetrics] = useState<UserMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("total_spent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const perPage = 20;

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getUsersMetrics({
          page,
          per_page: perPage,
          search: searchQuery || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
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

    const timeoutId = setTimeout(() => {
      loadMetrics();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [page, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(dateString));
    } catch {
      return "—";
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 inline ml-1" />;
    return sortOrder === "desc"
      ? <ChevronDown className="w-3.5 h-3.5 text-blue-500 inline ml-1" />
      : <ChevronUp className="w-3.5 h-3.5 text-blue-500 inline ml-1" />;
  };

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalUsers);

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Métricas de Usuarios"
        description="Análisis de comportamiento y compras de los usuarios"
      />

      {/* Barra de búsqueda y ordenamiento */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as SortField); setPage(1); }}
              className="text-sm border border-gray-300 rounded-[8px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => { setSortOrder((o) => o === "desc" ? "asc" : "desc"); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm border border-gray-300 rounded-[8px] hover:bg-gray-50 text-gray-700"
              title={sortOrder === "desc" ? "Descendente" : "Ascendente"}
            >
              {sortOrder === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {sortOrder === "desc" ? "Mayor a menor" : "Menor a mayor"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Cargando métricas...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[14px] border border-red-200 p-8 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : usersMetrics.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {searchQuery ? "No se encontraron usuarios con ese criterio." : "No hay métricas disponibles."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th
                      className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort("completed_orders")}
                    >
                      Compras <SortIcon field="completed_orders" />
                    </th>
                    <th
                      className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort("total_spent")}
                    >
                      Total gastado <SortIcon field="total_spent" />
                    </th>
                    <th
                      className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort("avg_order_value")}
                    >
                      Promedio <SortIcon field="avg_order_value" />
                    </th>
                    <th
                      className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort("pending_orders")}
                    >
                      Carritos ab. <SortIcon field="pending_orders" />
                    </th>
                    <th
                      className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort("last_purchase_date")}
                    >
                      Última compra <SortIcon field="last_purchase_date" />
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasa abandono
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {usersMetrics.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
                        <div className="text-xs text-gray-500">{user.user_email}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-gray-400 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.orders.completed} completadas
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.orders.total} en total
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-900">
                            {user.purchases.total_spent > 0 ? formatCurrency(user.purchases.total_spent) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {user.purchases.avg_order_value > 0
                            ? formatCurrency(user.purchases.avg_order_value)
                            : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart className="w-4 h-4 text-orange-500 shrink-0" />
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
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(user.purchases.last_purchase_date)}
                            </div>
                            {user.purchases.days_since_last_purchase !== null && (
                              <div className="text-xs text-gray-500">
                                hace {user.purchases.days_since_last_purchase}d
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-900">
                            {user.cart_abandonment_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm">
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

          {/* Paginación */}
          <div className="mt-4 flex items-center justify-between bg-white rounded-[14px] border border-gray-200 px-5 py-3.5">
            <div className="text-sm text-gray-600">
              {totalUsers > 0
                ? `Mostrando ${start}–${end} de ${totalUsers} usuarios`
                : "Sin resultados"}
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
    </div>
  );
}
