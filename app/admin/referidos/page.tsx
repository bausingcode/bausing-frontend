"use client";

import PageHeader from "@/components/PageHeader";
import { Users, Settings, TrendingUp, Save, Loader2, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getAdminReferralConfig,
  updateAdminReferralConfig,
  getAdminReferralStats,
  type ReferralConfig,
  type AdminReferralStats,
} from "@/lib/api";

export default function ReferidosAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [config, setConfig] = useState<ReferralConfig>({
    credit_type: "fixed",
    credit_amount: 500,
    percentage: 5,
  });

  const [stats, setStats] = useState<AdminReferralStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData] = await Promise.all([
        getAdminReferralConfig(),
        loadStats(),
      ]);
      setConfig(configData);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Error al cargar configuración" });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await getAdminReferralStats();
      setStats(statsData);
      return statsData;
    } catch {
      return null;
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await updateAdminReferralConfig(config);
      setMessage({ type: "success", text: "Configuración guardada correctamente" });
      await loadStats();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Error al guardar configuración" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 pt-6 pb-8 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <div className="mb-[80px]">
        <PageHeader title="Programa de Referidos" description="Configurá y monitoreá el programa de referidos" />
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-[10px] text-sm font-medium border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuración */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Configuración</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo de crédito
              </label>
              <select
                value={config.credit_type}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, credit_type: e.target.value as "fixed" | "percentage" }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/30 focus:border-[#00C1A7] text-gray-900 bg-white"
              >
                <option value="fixed">Monto fijo</option>
                <option value="percentage">Porcentaje del total</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {config.credit_type === "fixed"
                  ? "Monto fijo por cada referido exitoso"
                  : "Porcentaje del total de la compra referida"}
              </p>
            </div>

            {config.credit_type === "fixed" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Monto fijo (Pesos Bausing)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={config.credit_amount}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, credit_amount: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/30 focus:border-[#00C1A7] text-gray-900"
                    placeholder="500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Porcentaje (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={config.percentage}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full pl-4 pr-8 py-2.5 text-sm border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/30 focus:border-[#00C1A7] text-gray-900"
                    placeholder="5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#00C1A7] text-white py-2.5 px-4 rounded-[8px] text-sm font-medium hover:bg-[#00a892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Guardando..." : "Guardar configuración"}
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total referidos", value: stats?.total_referrals ?? "—", color: "text-gray-900" },
              { label: "Créditos otorgados", value: stats ? `$${stats.total_credits.toLocaleString("es-AR", { minimumFractionDigits: 0 })}` : "—", color: "text-[#00C1A7]" },
              { label: "Acreditados", value: stats?.credited_referrals ?? "—", color: "text-green-600" },
              { label: "Pendientes", value: stats?.pending_referrals ?? "—", color: "text-amber-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-[14px] border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">{stat.label}</p>
                {statsLoading ? (
                  <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Top Referidores */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-6 flex-1">
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Top Referidores</h2>
            </div>

            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-50 rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : stats && stats.top_referrers.length > 0 ? (
              <div className="space-y-2">
                {stats.top_referrers.map((referrer, index) => (
                  <div
                    key={referrer.user_id}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-[10px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-[#00C1A7] w-5 shrink-0">#{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {referrer.first_name} {referrer.last_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{referrer.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-[#00C1A7]">
                        ${referrer.total_credits.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {referrer.total_referrals} referido{referrer.total_referrals !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Sin datos de referidores aún</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
