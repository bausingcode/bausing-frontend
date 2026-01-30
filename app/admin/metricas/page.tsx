"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import { TrendingUp, ShoppingCart, DollarSign, Package, Users, BarChart3, Calendar } from "lucide-react";
import { getGeneralMetrics, GeneralMetrics } from "@/lib/api";

export default function Metricas() {
  const [generalMetrics, setGeneralMetrics] = useState<GeneralMetrics | null>(null);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Cargar métricas generales
  const loadMetrics = async () => {
    try {
      setIsLoadingGeneral(true);
      setError(null);
      const params: { start_date?: string; end_date?: string } = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const metrics = await getGeneralMetrics(Object.keys(params).length > 0 ? params : undefined);
      setGeneralMetrics(metrics);
    } catch (err: any) {
      console.error("Error fetching general metrics:", err);
      setError(err.message || "Error al cargar métricas generales");
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  // Cargar métricas al montar el componente
  useEffect(() => {
    loadMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const clearDates = async () => {
    setStartDate("");
    setEndDate("");
    // Recargar métricas sin filtros después de limpiar
    try {
      setIsLoadingGeneral(true);
      setError(null);
      const metrics = await getGeneralMetrics();
      setGeneralMetrics(metrics);
    } catch (err: any) {
      console.error("Error fetching general metrics:", err);
      setError(err.message || "Error al cargar métricas generales");
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <PageHeader 
          title="Métricas" 
          description="Análisis general de comportamiento y compras" 
        />
        
        {/* Filtro de Fechas - Estilo Airbnb compacto */}
        <div className="flex items-center gap-0 bg-white rounded-full border border-gray-200 overflow-hidden">
          <div className="flex items-center px-4 py-2.5">
            <Calendar className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="w-[130px] text-sm font-medium text-gray-900 border-0 focus:outline-none bg-transparent cursor-pointer p-0"
                />
              </div>
              <span className="text-gray-300 text-lg">—</span>
              <div className="flex flex-col">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="w-[130px] text-sm font-medium text-gray-900 border-0 focus:outline-none bg-transparent cursor-pointer p-0"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center border-l border-gray-200 pl-3 pr-3 h-full">
            <button
              onClick={loadMetrics}
              className="px-4 py-2 text-sm font-semibold text-white rounded-full hover:opacity-90 transition-all"
              style={{ backgroundColor: '#155DFC' }}
            >
              Buscar
            </button>
            {(startDate || endDate) && (
              <button
                onClick={clearDates}
                className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                title="Limpiar filtros"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Generales/Promedio */}
      {isLoadingGeneral ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[14px] border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-[14px] border border-red-200 p-8 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : generalMetrics ? (
        <>
          {/* Cards de Métricas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Usuarios"
              value={generalMetrics.total_users.toString()}
              icon={<Users className="w-5 h-5" />}
            />
            <MetricCard
              title="Usuarios con Compras"
              value={generalMetrics.users_with_purchases.toString()}
              subtitle={`${generalMetrics.total_users > 0 ? ((generalMetrics.users_with_purchases / generalMetrics.total_users) * 100).toFixed(1) : 0}% del total`}
              icon={<ShoppingCart className="w-5 h-5" />}
            />
            <MetricCard
              title="Tasa de Conversión"
              value={`${generalMetrics.conversion_rate.toFixed(1)}%`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Gastado"
              value={formatCurrency(generalMetrics.totals.total_spent)}
              icon={<DollarSign className="w-5 h-5" />}
            />
          </div>

          {/* Métricas Promedio */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Métricas Promedio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Órdenes por Usuario</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {generalMetrics.averages.orders_per_user.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Compras por Usuario</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {generalMetrics.averages.completed_orders_per_user.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Gasto Promedio</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(generalMetrics.averages.spent_per_user)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Valor Promedio Orden</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(generalMetrics.averages.order_value)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Carritos Abandonados</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {generalMetrics.averages.pending_orders_per_user.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen Totales */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumen Total</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Órdenes</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {generalMetrics.totals.orders}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Completadas</div>
                  <div className="text-2xl font-semibold text-green-600">
                    {generalMetrics.totals.completed_orders}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Carritos Abandonados</div>
                  <div className="text-2xl font-semibold text-orange-600">
                    {generalMetrics.totals.pending_orders}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Usuarios con Carritos</div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {generalMetrics.users_with_abandoned_carts}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
