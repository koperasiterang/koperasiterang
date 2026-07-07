export type UserRole = "ketua" | "bendahara" | "anggota" | "pengawas" | "dinas";

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
  status: "pending" | "approved" | "rejected";
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
