export type UserRole = "ketua" | "bendahara" | "sekretaris" | "anggota" | "pengawas" | "dinas";

export type TxStatus = "pending" | "approved" | "rejected" | "cancelled";

/** Peran pengurus yang boleh MENGINPUT transaksi. */
export const PENGURUS_ROLES: UserRole[] = ["ketua", "bendahara", "sekretaris"];

/** Peran yang boleh MENYETUJUI (multi-sig) — tetap dibatasi "bukan penginput" di server. */
export const APPROVER_ROLES: UserRole[] = ["ketua", "bendahara", "sekretaris", "pengawas"];

/** Kategori transaksi baku, untuk konsistensi data & rekap dashboard. */
export const TX_CATEGORIES = ["Simpanan", "Pinjaman", "Operasional"] as const;
export type TxCategory = (typeof TX_CATEGORIES)[number];

export const ROLE_LABEL: Record<UserRole, string> = {
  ketua: "Ketua",
  bendahara: "Bendahara",
  sekretaris: "Sekretaris",
  pengawas: "Pengawas",
  anggota: "Anggota",
  dinas: "Dinas Koperasi",
};

export type Profile = {
  id: string;
  koperasi_id: string;
  full_name: string;
  role: UserRole;
};

export type Transaction = {
  id: string;
  koperasi_id: string;
  type: "masuk" | "keluar";
  amount: number;
  description: string;
  category: string | null;
  created_by: string;
  correction_of: string | null;
  correction_reason: string | null;
  status: TxStatus;
  approval_threshold_hit: boolean;
  created_at: string;
  batch_hash: string | null;
};

export type Approval = {
  id: string;
  transaction_id: string;
  approver_id: string;
  decision: "approve" | "reject";
  created_at: string;
};

export type AnomalyFlag = {
  id: string;
  transaction_id: string;
  flagged_by: string | null;
  source: "anggota" | "ai";
  reason: string;
  reviewed: boolean;
  reviewed_by: string | null;
  created_at: string;
};

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Pemisah ribuan tanpa simbol mata uang, mis. 5000000 -> "5.000.000". */
export function formatNumberID(amount: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount);
}
