"use client";

import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { Users, Settings, TrendingUp, Save, DollarSign } from "lucide-react";
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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [config, setConfig] = useState<ReferralConfig>({
    credit_type: 'fixed',
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
      const [configData, statsData] = await Promise.all([
        getAdminReferralConfig(),
        loadStats(),
      ]);
      setConfig(configData);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Error al cargar configuración',
      });
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
    } catch (error: any) {
      console.error('Error loading stats:', error);
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
      
      setMessage({
        type: 'success',
        text: 'Configuración guardada correctamente',
      });
      
      // Recargar estadísticas después de guardar
      await loadStats();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Error al guardar configuración',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Programa de Referidos" icon={<Users className="w-6 h-6" />} />
        <div className="container mx-auto px-4 py-8">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Programa de Referidos" icon={<Users className="w-6 h-6" />} />
      
      <div className="container mx-auto px-4 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Configuración */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-[#00C1A7]" />
                <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
              </div>

              <div className="space-y-6">
                {/* Tipo de crédito */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de crédito
                  </label>
                  <select
                    value={config.credit_type}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        credit_type: e.target.value as 'fixed' | 'percentage',
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
                  >
                    <option value="fixed">Monto fijo</option>
                    <option value="percentage">Porcentaje del total</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.credit_type === 'fixed'
                      ? 'Se otorgará un monto fijo por cada referido'
                      : 'Se otorgará un porcentaje del total de la compra'}
                  </p>
                </div>

                {/* Monto fijo o porcentaje */}
                {config.credit_type === 'fixed' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto fijo (Pesos Bausing)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.credit_amount}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            credit_amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
                        placeholder="500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Monto de Pesos Bausing que se otorgará por cada compra referida
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          setConfig((prev) => ({
                            ...prev,
                            percentage: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full pr-8 pl-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
                        placeholder="5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Porcentaje del total de la compra que se otorgará como crédito
                    </p>
                  </div>
                )}

                {/* Botón guardar */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00C1A7] text-white py-2.5 px-6 rounded-lg font-semibold hover:bg-[#00a892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Guardar configuración
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="space-y-6 w-full">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-[#00C1A7]" />
                <h2 className="text-xl font-semibold text-gray-900">Estadísticas</h2>
              </div>

              {statsLoading ? (
                <div className="text-center py-8">
                  <Loader />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Total de Referidos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_referrals}</p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Total de Créditos Otorgados</p>
                    <p className="text-2xl font-bold text-[#00C1A7]">
                      ${stats.total_credits.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Referidos Acreditados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.credited_referrals}</p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Referidos Pendientes</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending_referrals}</p>
                  </div>

                  {/* Top Referidores */}
                  {stats.top_referrers.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Referidores</h3>
                      <div className="space-y-3">
                        {stats.top_referrers.map((referrer, index) => (
                          <div
                            key={referrer.user_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-[#00C1A7]">#{index + 1}</span>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {referrer.first_name} {referrer.last_name}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{referrer.email}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {referrer.total_referrals} referido{referrer.total_referrals !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm font-bold text-[#00C1A7]">
                                ${referrer.total_credits.toLocaleString('es-AR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No hay estadísticas disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
