export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import { submitApproval } from "@/lib/actions";

export default async function ApprovalsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, koperasi_id, role")
    .eq("id", user?.id)
    .single();

  const { data: pending } = await supabase
    .from("transactions")
    .select("*, approvals(approver_id, decision)")
    .eq("koperasi_id", profile?.koperasi_id)
    .eq("status", "pending")
    .eq("approval_threshold_hit", true)
    .order("created_at", { ascending: false });

  const canVote = ["ketua", "bendahara", "pengawas"].includes(profile?.role ?? "");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Persetujuan Multi-Signature</h1>
        <Link href="/dashboard" className="text-sm text-white/50">
          ← Dashboard
        </Link>
      </div>
      <p className="text-sm text-white/50">
        Transaksi di atas Rp 5.000.000 butuh minimal 2 dari 3 persetujuan (Ketua, Bendahara,
        Pengawas) sebelum dieksekusi.
      </p>

      <div className="space-y-3">
        {pending?.map((tx: any) => {
          const myVote = tx.approvals?.find((a: any) => a.approver_id === profile?.id);
          const approveCount = tx.approvals?.filter((a: any) => a.decision === "approve").length ?? 0;
          const rejectCount = tx.approvals?.filter((a: any) => a.decision === "reject").length ?? 0;

          return (
            <div key={tx.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {tx.type === "masuk" ? "Uang Masuk" : "Uang Keluar"} · {formatIDR(tx.amount)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Persetujuan: {approveCount} setuju · {rejectCount} tolak (butuh 2)
                  </p>
                </div>
                {canVote && !myVote && (
                  <div className="flex gap-2 shrink-0 ml-3">
                    <form action={submitApproval.bind(null, tx.id, "approve")}>
                      <button className="btn-primary text-xs px-3 py-1">Setuju</button>
                    </form>
                    <form action={submitApproval.bind(null, tx.id, "reject")}>
                      <button className="btn-secondary text-xs px-3 py-1">Tolak</button>
                    </form>
                  </div>
                )}
                {myVote && (
                  <span className="text-xs text-white/40 shrink-0 ml-3">
                    Anda sudah {myVote.decision === "approve" ? "menyetujui" : "menolak"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {(!pending || pending.length === 0) && (
          <p className="text-white/40 text-sm">Tidak ada transaksi yang menunggu persetujuan.</p>
        )}
      </div>
    </div>
  );
}
