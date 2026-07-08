"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Search, DollarSign, Package, Clock, ChevronUp, ChevronDown, ChevronsUpDown, Users, TrendingUp } from "lucide-react";
import { getUsersMetrics, UserMetrics } from "@/lib/api";
import Link from "next/link";

type SortField = "total_spent" | "completed_orders" | "avg_order_value" | "total_orders" | "last_purchase_date" | "user_created_at";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "total_spent",       label: "Total gastado" },
  { value: "completed_orders",  label: "Nº compras" },
  { value: "avg_order_value",   label: "Ticket promedio" },
  { value: "total_orders",      label: "Total órdenes" },
  { value: "last_purchase_date",label: "Última compra" },
  { value: "user_created_at",   label: "Fecha de registro" },
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
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await getUsersMetrics({
          page,
          per_page: perPage,
          search: searchQuery || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
        setUsersMetrics(res.users);
        setTotalPages(res.pagination.total_pages);
        setTotalUsers(res.pagination.total);
      } catch (err: any) {
        setError(err.message || "Error al cargar métricas");
        setUsersMetrics([]);
      } finally {
        setIsLoading(false);
      }
    };

    const t = setTimeout(load, searchQuery ? 500 : 0);
    return () => clearTimeout(t);
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

  const fmt = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const fmtDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat("es-AR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(dateString));
    } catch { return "—"; }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronsUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return sortOrder === "desc"
      ? <ChevronDown className="w-3 h-3 text-blue-500 inline ml-1" />
      : <ChevronUp   className="w-3 h-3 text-blue-500 inline ml-1" />;
  };

  const start = (page - 1) * perPage + 1;
  const end   = Math.min(page * perPage, totalUsers);

  // Stats rápidos para mostrar arriba
  const totalSpentAll   = usersMetrics.reduce((s, u) => s + u.purchases.total_spent, 0);
  const usersWithOrders = usersMetrics.filter((u) => u.orders.completed > 0).length;
  const avgTicket       = usersWithOrders > 0
    ? usersMetrics.filter((u) => u.purchases.avg_order_value > 0).reduce((s, u) => s + u.purchases.avg_order_value, 0) / usersWithOrders
    : 0;

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Métricas de Usuarios"
        description="Análisis de comportamiento y compras por usuario"
      />

      {/* Barra de búsqueda + ordenamiento */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-5">
        <div className="flex gap-3 flex-wrap items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
            />
          </div>

          {/* Ordenar por */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 whitespace-nowrap">Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as SortField); setPage(1); }}
              className="text-sm border border-gray-200 rounded-[8px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => { setSortOrder((o) => o === "desc" ? "asc" : "desc"); setPage(1); }}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-[8px] hover:bg-gray-50 text-gray-700 bg-white"
            >
              {sortOrder === "desc"
                ? <><ChevronDown className="w-4 h-4" /> Mayor a menor</>
                : <><ChevronUp   className="w-4 h-4" /> Menor a mayor</>}
            </button>
          </div>

          {/* Conteo total */}
          {!isLoading && (
            <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
              {totalUsers} usuarios
            </span>
          )}
        </div>
      </div>

      {/* Resumen de página actual */}
      {!isLoading && !error && usersMetrics.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-[14px] border border-gray-200 px-5 py-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Con compras (página)</div>
              <div className="text-lg font-semibold text-gray-900">{usersWithOrders} / {usersMetrics.length}</div>
            </div>
          </div>
          <div className="bg-white rounded-[14px] border border-gray-200 px-5 py-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Gastado (página)</div>
              <div className="text-lg font-semibold text-gray-900">{fmt(totalSpentAll)}</div>
            </div>
          </div>
          <div className="bg-white rounded-[14px] border border-gray-200 px-5 py-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Ticket promedio (página)</div>
              <div className="text-lg font-semibold text-gray-900">{avgTicket > 0 ? fmt(avgTicket) : "—"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-sm">Cargando métricas...</div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[14px] border border-red-200 p-8 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : usersMetrics.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {searchQuery ? "Sin resultados para esa búsqueda." : "Sin datos disponibles."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th
                      className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => handleSort("completed_orders")}
                    >
                      Compras <SortIcon field="completed_orders" />
                    </th>
                    <th
                      className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => handleSort("total_spent")}
                    >
                      Total gastado <SortIcon field="total_spent" />
                    </th>
                    <th
                      className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => handleSort("avg_order_value")}
                    >
                      Ticket prom. <SortIcon field="avg_order_value" />
                    </th>
                    <th
                      className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => handleSort("last_purchase_date")}
                    >
                      Última compra <SortIcon field="last_purchase_date" />
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersMetrics.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium text-gray-900 leading-tight">{user.user_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{user.user_email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <div>
                              <span className="text-sm font-semibold text-gray-900">{user.orders.completed}</span>
                              {user.orders.total > user.orders.completed && (
                                <span className="text-xs text-gray-400 ml-1">/ {user.orders.total}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">
                              {user.purchases.total_spent > 0 ? fmt(user.purchases.total_spent) : <span className="text-gray-300 font-normal">—</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {user.purchases.avg_order_value > 0 ? fmt(user.purchases.avg_order_value) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <div>
                              <div className="text-sm text-gray-700">{fmtDate(user.purchases.last_purchase_date)}</div>
                              {user.purchases.days_since_last_purchase !== null && user.purchases.last_purchase_date && (
                                <div className="text-xs text-gray-400">hace {user.purchases.days_since_last_purchase}d</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/clientes?userId=${user.user_id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Ver cliente →
                          </Link>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          <div className="mt-4 flex items-center justify-between bg-white rounded-[14px] border border-gray-200 px-5 py-3">
            <div className="text-xs text-gray-500">
              {totalUsers > 0 ? `${start}–${end} de ${totalUsers} usuarios` : "Sin resultados"}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                «
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                Anterior
              </button>
              <span className="px-3 py-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                Siguiente
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                »
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
