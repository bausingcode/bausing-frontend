export default function OrderStatusCardSkeleton() {
  return (
    <div className="bg-gray-50 p-4 border border-gray-100 animate-pulse" style={{ borderRadius: '14px' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
      </div>
      <div className="h-9 w-16 bg-gray-200 rounded"></div>
    </div>
  );
}
