interface QuickAction {
  text: string;
  color: "red" | "blue" | "green" | "purple";
}

const colorClasses = {
  red: "bg-red-500 hover:bg-red-600",
  blue: "bg-blue-500 hover:bg-blue-600",
  green: "bg-green-500 hover:bg-green-600",
  purple: "bg-purple-500 hover:bg-purple-600",
};

export default function QuickActions() {
  const actions: QuickAction[] = [
    { text: "Ver pedidos con problemas", color: "red" },
    { text: "Ver clientes con más saldo", color: "blue" },
    { text: "Procesar pedidos pendientes", color: "green" },
    { text: "Revisar reclamos", color: "purple" },
  ];

  return (
    <div className="bg-white p-6 border border-gray-200" style={{ borderRadius: '14px' }}>
      <h2 className="text-lg font-normal text-gray-900 mb-6">
        Acciones Rápidas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`px-6 py-3 ${colorClasses[action.color]} text-white rounded-[10px] font-medium transition-colors`}
          >
            {action.text}
          </button>
        ))}
      </div>
    </div>
  );
}

