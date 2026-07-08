import type { TxStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: TxStatus }) {
  const map = {
    pending: { cls: "badge-pending", label: "Menunggu Persetujuan", dot: "bg-kem-amber" },
    approved: { cls: "badge-approved", label: "Disetujui", dot: "bg-kem-green" },
    rejected: { cls: "badge-rejected", label: "Ditolak", dot: "bg-kem-danger" },
    cancelled: { cls: "badge-cancelled", label: "Dibatalkan", dot: "bg-kem-muted" },
  } as const;

  const item = map[status] ?? map.pending;
  return (
    <span className={item.cls}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}
