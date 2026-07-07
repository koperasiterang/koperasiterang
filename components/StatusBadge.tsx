export function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { cls: "badge-pending", label: "Menunggu Persetujuan" },
    approved: { cls: "badge-approved", label: "Disetujui" },
    rejected: { cls: "badge-rejected", label: "Ditolak" },
  } as const;

  const item = map[status];
  return <span className={item.cls}>{item.label}</span>;
}
