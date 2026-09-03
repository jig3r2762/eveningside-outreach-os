export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse p-2">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-md" />
          <div className="h-4 w-72 bg-gray-100 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-md" />
          <div className="h-9 w-32 bg-gray-200 rounded-md" />
        </div>
      </div>

      {/* KPI Cards Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-white border border-gray-200/80 rounded-xl p-3 space-y-2 shadow-2xs">
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-7 w-14 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Table/Kanban Skeleton */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="h-8 w-48 bg-gray-100 rounded-md" />
        </div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-11 bg-gray-50/80 border border-gray-100 rounded-lg flex items-center px-4 justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
