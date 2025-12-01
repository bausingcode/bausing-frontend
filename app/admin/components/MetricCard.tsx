interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
}

export default function MetricCard({
  title,
  value,
  change,
  changeType,
  icon,
}: MetricCardProps) {
  return (
    <div className="bg-white p-3 border border-gray-200" style={{ borderRadius: '14px' }}>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-medium" style={{ color: '#484848' }}>{title}</h3>
        <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-normal text-gray-900 mb-1.5">{value}</p>
      <div className="flex items-center gap-1 text-xs">
        <svg
          className={`w-2.5 h-2.5 ${
            changeType === "positive" ? "text-green-600" : "text-red-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {changeType === "positive" ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          )}
        </svg>
        <span
          className={`font-medium ${
            changeType === "positive" ? "text-green-600" : "text-red-600"
          }`}
        >
          {change}
        </span>
        <span className="text-gray-500">vs mes anterior</span>
      </div>
    </div>
  );
}

