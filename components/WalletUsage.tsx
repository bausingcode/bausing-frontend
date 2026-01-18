import { WalletUsageStats } from "@/lib/api";

interface WalletUsageProps {
  stats: WalletUsageStats;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function WalletUsage({ stats }: WalletUsageProps) {
  return (
    <div className="bg-white p-6 border border-gray-200" style={{ borderRadius: '14px' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h2 className="text-md font-normal" style={{ color: '#484848' }}>
          Uso de Billetera Bausing
        </h2>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center bg-gray-50 rounded-[10px] px-4 py-3">
          <span className="text-gray-600">Clientes que usaron hoy</span>
          <span className="text-lg font-normal" style={{ color: '#155DFC' }}>{stats.clientes_hoy}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-50 rounded-[10px] px-4 py-3">
          <span className="text-gray-600">Saldo total utilizado</span>
          <span className="text-lg font-normal" style={{ color: '#155DFC' }}>{formatCurrency(stats.saldo_utilizado)}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-50 rounded-[10px] px-4 py-3">
          <span className="text-gray-600">Saldo pendiente en sistema</span>
          <span className="text-lg font-normal" style={{ color: '#155DFC' }}>{formatCurrency(stats.saldo_pendiente)}</span>
        </div>
      </div>
    </div>
  );
}
