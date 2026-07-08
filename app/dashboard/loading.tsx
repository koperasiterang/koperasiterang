export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="skeleton h-6 w-56" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <div className="skeleton h-11 w-64" />
      <div className="card space-y-4">
        <div className="skeleton h-5 w-40" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
