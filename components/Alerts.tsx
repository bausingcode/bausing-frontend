"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { Alert } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AlertsProps {
  alerts: Alert[];
}

const colorClasses = {
  red: {
    bg: "bg-red-50",
    border: "border-l-3 border-red-500",
    text: "text-gray-700",
    badge: "bg-red-100 text-red-700",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-l-3 border-yellow-500",
    text: "text-gray-700",
    badge: "bg-yellow-100 text-yellow-700",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-l-3 border-blue-500",
    text: "text-gray-700",
    badge: "bg-blue-100 text-blue-700",
  },
};

export default function Alerts({ alerts }: AlertsProps) {
  const router = useRouter();

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white p-6 border border-gray-200" style={{ borderRadius: '14px' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <h2 className="text-md font-normal" style={{ color: '#484848' }}>
            Alertas Importantes
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No hay alertas</p>
          <p className="text-xs text-gray-500 text-center">Todo está en orden en este momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 border border-gray-200" style={{ borderRadius: '14px' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
        </div>
        <h2 className="text-md font-normal" style={{ color: '#484848' }}>
          Alertas Importantes
        </h2>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const colors = colorClasses[alert.color];
          return (
            <div
              key={index}
              className={`flex items-center justify-between gap-3 ${colors.bg} ${colors.border} rounded-[10px] text-sm px-4 py-3`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ 
                    backgroundColor: alert.color === 'red' ? '#dc2626' : 
                                    alert.color === 'yellow' ? '#ca8a04' : '#2563eb' 
                  }}
                ></div>
                <span className={colors.text}>{alert.text}</span>
              </div>
              {alert.url && (
                <button
                  onClick={() => router.push(alert.url!)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                    alert.color === 'red' 
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : alert.color === 'yellow'
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Ir a ver
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
