interface Alert {
  text: string;
  count: number;
  color: "red" | "yellow" | "blue";
}

const colorClasses = {
  red: {
    bg: "bg-red-50",
    border: "border-l-4 border-red-500",
    text: "text-gray-700",
    badge: "bg-red-100 text-red-700",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-l-4 border-yellow-500",
    text: "text-gray-700",
    badge: "bg-yellow-100 text-yellow-700",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-l-4 border-blue-500",
    text: "text-gray-700",
    badge: "bg-blue-100 text-blue-700",
  },
};

export default function Alerts() {
  const alerts: Alert[] = [
    {
      text: "3 errores en pagos de Mercado Pago",
      count: 3,
      color: "red",
    },
    {
      text: "7 reclamos abiertos pendientes",
      count: 7,
      color: "yellow",
    },
    {
      text: "2 movimientos inusuales en billetera",
      count: 2,
      color: "blue",
    },
  ];

  return (
    <div className="bg-white p-6 border border-gray-200" style={{ borderRadius: '14px' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-normal" style={{ color: '#484848' }}>
          Alertas Importantes
        </h2>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const colors = colorClasses[alert.color];
          return (
            <div
              key={index}
              className={`flex justify-between items-center ${colors.bg} ${colors.border} rounded-lg px-4 py-3`}
            >
              <span className={colors.text}>{alert.text}</span>
              <span
                className={`px-3 py-1 rounded-lg ${colors.badge} text-sm font-medium`}
              >
                {alert.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

