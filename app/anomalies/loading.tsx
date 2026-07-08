export default function AnomaliesLoading() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-6 w-72" />
      <div className="skeleton h-4 w-full max-w-lg" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex justify-between">
            <div className="space-y-2 w-2/3">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-3 w-2/3" />
            </div>
            <div className="skeleton h-6 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
