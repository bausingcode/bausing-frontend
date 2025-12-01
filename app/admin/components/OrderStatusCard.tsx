interface OrderStatusCardProps {
  title: string;
  value: number;
  color: "green" | "yellow" | "blue" | "purple";
  icon: React.ReactNode;
}

const colorClasses = {
  green: {
    bg: "bg-green-50",
    border: "border-green-100",
    text: "text-green-800",
    textBold: "#00A63E",
    icon: "#00A63E",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-100",
    text: "text-yellow-800",
    textBold: "#D08700",
    icon: "#D08700",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-800",
    textBold: "#155DFC",
    icon: "#155DFC",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-100",
    text: "text-purple-800",
    textBold: "#9810FA",
    icon: "#9810FA",
  },
};

export default function OrderStatusCard({
  title,
  value,
  color,
  icon,
}: OrderStatusCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`${colors.bg} p-6 ${colors.border} border`}
      style={{ borderRadius: '14px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${colors.text}`}>{title}</h3>
        <div style={{ color: colors.icon }}>{icon}</div>
      </div>
      <p className="text-3xl font-normal" style={{ color: colors.textBold }}>{value}</p>
    </div>
  );
}

