export default function MetricCardSkeleton() {
  return (
    <div className="bg-white p-3 border border-gray-200 animate-pulse" style={{ borderRadius: '14px' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-3 w-24 bg-gray-200 rounded"></div>
        <div className="w-7 h-7 rounded-md bg-gray-200"></div>
      </div>
      <div className="h-8 w-32 bg-gray-200 rounded mb-1.5"></div>
      <div className="h-3 w-40 bg-gray-200 rounded"></div>
    </div>
  );
}
