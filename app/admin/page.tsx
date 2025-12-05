import MetricCard from "@/components/MetricCard";
import OrderStatusCard from "@/components/OrderStatusCard";
import WalletUsage from "@/components/WalletUsage";
import Alerts from "@/components/Alerts";
import QuickActions from "@/components/QuickActions";
import PageHeader from "@/components/PageHeader";
import { DollarSign, FileText, TrendingUp, Package, CheckCircle, Clock, Info } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Inicio" 
        description="¡Bienvenido de vuelta, Alejo!" 
      />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Ventas de hoy"
          value="1,078"
          change="+12.5%"
          changeType="positive"
          icon={<DollarSign className="w-5 h-5" />}
          comparisonText="vs día anterior"
        />
        <MetricCard
          title="Ventas semanales"
          value="89"
          change="-8.2%"
          changeType="negative"
          icon={<FileText className="w-4 h-4" />}
          comparisonText="vs semana anterior"
        />
        <MetricCard
          title="Ventas mensuales"
          value="74.5%"
          change="+3.1%"
          changeType="positive"
          icon={<TrendingUp className="w-4 h-4" />}
          comparisonText="vs mes anterior"
        />
        <MetricCard
          title="Total de pedidos"
          value="24"
          change="+2"
          changeType="positive"
          icon={<Package className="w-4 h-4" />}
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
          value={89}
          color="green"
          icon={<CheckCircle className="w-6 h-6" />}
        />
        <OrderStatusCard
          title="Pendientes"
          value={23}
          color="yellow"
          icon={<Clock className="w-6 h-6" />}
        />
        <OrderStatusCard
          title="En Camino"
          value={34}
          color="blue"
          icon={<Info className="w-6 h-6" />}
        />
        <OrderStatusCard
          title="Entregados"
          value={78}
          color="purple"
          icon={<Package className="w-6 h-6" />}
        />
          </div>
        </div>
      </div>

      {/* Bottom Section - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <WalletUsage />
        <Alerts />
      </div>

      {/* <QuickActions /> */}
    </div>
  );
}
