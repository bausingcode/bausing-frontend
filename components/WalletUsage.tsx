export default function WalletUsage() {
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
          <span className="text-lg font-normal" style={{ color: '#155DFC' }}>34</span>
        </div>
        <div className="flex justify-between items-center bg-gray-50 rounded-[10px] px-4 py-3">
          <span className="text-gray-600">Saldo total utilizado</span>
          <span className="text-lg font-normal" style={{ color: '#155DFC' }}>$12,450</span>
        </div>
        <div className="flex justify-between items-center bg-gray-50 rounded-[10px] px-4 py-3">
          <span className="text-gray-600">Saldo pendiente en sistema</span>
          <span className="text-lg font-normal" style={{ color: '#155DFC' }}>$45,890</span>
        </div>
      </div>
    </div>
  );
}

