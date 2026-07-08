export function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { cls: "badge-pending", label: "Menunggu Persetujuan", dot: "bg-terang-warn" },
    approved: { cls: "badge-approved", label: "Disetujui", dot: "bg-terang-safe" },
    rejected: { cls: "badge-rejected", label: "Ditolak", dot: "bg-terang-danger" },
  } as const;

  const item = map[status];
  return (
    <span className={item.cls}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}
