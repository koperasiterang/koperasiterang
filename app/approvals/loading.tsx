export default function ApprovalsLoading() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-6 w-72" />
      <div className="skeleton h-4 w-full max-w-lg" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
