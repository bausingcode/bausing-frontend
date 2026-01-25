import { cookies } from "next/headers";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import OrderStatusCard from "@/components/OrderStatusCard";
import WalletUsage from "@/components/WalletUsage";
import Alerts from "@/components/Alerts";
import MetricCardSkeleton from "@/components/MetricCardSkeleton";
import OrderStatusCardSkeleton from "@/components/OrderStatusCardSkeleton";
import { DollarSign, FileText, TrendingUp, Package, CheckCircle, Clock, Info } from "lucide-react";
import { getDashboardStats, getDashboardAlerts, getWalletUsageStats, Alert, WalletUsageStats } from "@/lib/api";
import { Suspense } from "react";

function formatCurrency(value: number | null | undefined): string {
  // Convertir a número si es string o manejar null/undefined
  const numValue = typeof value === 'number' ? value : (value != null ? parseFloat(String(value)) : 0);
  
  // Si no es un número válido, retornar $0
  if (isNaN(numValue)) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

function formatPercent(value: number | null | undefined): string {
  // Convertir a número si es string o manejar null/undefined
  const numValue = typeof value === 'number' ? value : (value != null ? parseFloat(String(value)) : 0);
  
  // Si no es un número válido, retornar 0%
  if (isNaN(numValue)) {
    return '+0.0%';
  }
  
  return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(1)}%`;
}

async function DashboardContent() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  let stats;
  try {
    stats = await getDashboardStats(cookieHeader);
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    // Valores por defecto en caso de error
    stats = {
      ventas_hoy: 0,
      ventas_ayer: 0,
      cambio_hoy_pct: 0,
      ventas_semana: 0,
      ventas_semana_anterior: 0,
      cambio_semana_pct: 0,
      ventas_mes: 0,
      ventas_mes_anterior: 0,
      cambio_mes_pct: 0,
      total_pedidos: 0,
      pedidos_mes: 0,
      pedidos_mes_anterior: 0,
      cambio_pedidos: 0,
      estados: {
        pagados: 0,
        pendientes: 0,
        en_reparto: 0,
        entregados: 0
      }
    };
  }

  return (
    <>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Ventas de hoy"
          value={formatCurrency(stats.ventas_hoy)}
          change={formatPercent(stats.cambio_hoy_pct)}
          changeType={(stats.cambio_hoy_pct ?? 0) >= 0 ? "positive" : "negative"}
          icon={<DollarSign className="w-5 h-5" />}
          comparisonText="vs día anterior"
        />
        <MetricCard
          title="Ventas semanales"
          value={formatCurrency(stats.ventas_semana)}
          change={formatPercent(stats.cambio_semana_pct)}
          changeType={(stats.cambio_semana_pct ?? 0) >= 0 ? "positive" : "negative"}
          icon={<FileText className="w-4 h-4" />}
          comparisonText="vs semana anterior"
        />
        <MetricCard
          title="Ventas mensuales"
          value={formatCurrency(stats.ventas_mes)}
          change={formatPercent(stats.cambio_mes_pct)}
          changeType={(stats.cambio_mes_pct ?? 0) >= 0 ? "positive" : "negative"}
          icon={<TrendingUp className="w-4 h-4" />}
          comparisonText="vs mes anterior"
        />
        <MetricCard
          title="Total de pedidos"
          value={stats.total_pedidos.toString()}
          change={`${(stats.cambio_pedidos ?? 0) >= 0 ? '+' : ''}${stats.cambio_pedidos ?? 0}`}
          changeType={(stats.cambio_pedidos ?? 0) >= 0 ? "positive" : "negative"}
          icon={<Package className="w-5 h-5" />}
          comparisonText="vs mes anterior"
        />
      </div>

      {/* Estado de Pedidos */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 p-6" style={{ borderRadius: '14px' }}>
          <h2 className="text-lg font-normal mb-6" style={{ color: '#484848' }}>Estado de Pedidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <OrderStatusCard
              title="Pagados"
              value={stats.estados.pagados}
              color="green"
              icon={<CheckCircle className="w-6 h-6" />}
            />
            <OrderStatusCard
              title="Pendientes"
              value={stats.estados.pendientes}
              color="yellow"
              icon={<Clock className="w-6 h-6" />}
            />
            <OrderStatusCard
              title="En Reparto"
              value={stats.estados.en_reparto}
              color="blue"
              icon={<Info className="w-6 h-6" />}
            />
            <OrderStatusCard
              title="Entregados"
              value={stats.estados.entregados}
              color="purple"
              icon={<Package className="w-6 h-6" />}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Key Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Estado de Pedidos Skeleton */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 p-6" style={{ borderRadius: '14px' }}>
          <h2 className="text-lg font-normal mb-6" style={{ color: '#484848' }}>Estado de Pedidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <OrderStatusCardSkeleton />
            <OrderStatusCardSkeleton />
            <OrderStatusCardSkeleton />
            <OrderStatusCardSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}

export default async function AdminDashboard() {
  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Inicio" 
        description="¡Bienvenido de vuelta!" 
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>

      {/* Bottom Section - Two Columns */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 border border-gray-200 animate-pulse" style={{ borderRadius: '14px' }}>
            <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="bg-white p-6 border border-gray-200 animate-pulse" style={{ borderRadius: '14px' }}>
            <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <BottomSection />
      </Suspense>
    </div>
  );
}

async function BottomSection() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  let alerts: Alert[] = [];
  let walletStats: WalletUsageStats = {
    clientes_hoy: 0,
    saldo_utilizado: 0,
    saldo_pendiente: 0
  };
  
  try {
    const [alertsResponse, walletStatsResponse] = await Promise.all([
      getDashboardAlerts(cookieHeader).catch(() => ({ alerts: [], total: 0 })),
      getWalletUsageStats(cookieHeader).catch(() => ({
        clientes_hoy: 0,
        saldo_utilizado: 0,
        saldo_pendiente: 0
      }))
    ]);
    
    alerts = alertsResponse.alerts || [];
    walletStats = walletStatsResponse;
  } catch (error) {
    console.error("Error loading bottom section data:", error);
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <WalletUsage stats={walletStats} />
      <Alerts alerts={alerts} />
    </div>
  );
}
