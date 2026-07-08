export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import { submitApproval } from "@/lib/actions";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

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
    <div className="space-y-5 animate-fade-in-up">
      <RealtimeRefresher koperasiId={profile?.koperasi_id} />

      <header>
        <p className="eyebrow mb-2">Multi-Signature Approval</p>
        <h1 className="text-2xl font-display">Persetujuan</h1>
        <p className="text-terang-muted mt-1 text-sm max-w-2xl">
          Transaksi di atas Rp 5.000.000 butuh minimal 2 dari 3 persetujuan (Ketua, Bendahara,
          Pengawas) sebelum dieksekusi. Tidak ada satu individu pun yang bisa mengotorisasi sendirian.
        </p>
        {!canVote && (
          <p className="text-xs text-terang-warn mt-2">
            Anda masuk sebagai {profile?.role} — dapat memantau proses, tetapi tidak memberi suara.
          </p>
        )}
      </header>

      <div className="space-y-3">
        {pending?.map((tx: any) => {
          const myVote = tx.approvals?.find((a: any) => a.approver_id === profile?.id);
          const approveCount = tx.approvals?.filter((a: any) => a.decision === "approve").length ?? 0;
          const rejectCount = tx.approvals?.filter((a: any) => a.decision === "reject").length ?? 0;
          const progress = Math.min(approveCount, 2);

          return (
            <div key={tx.id} className="card">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-terang-muted mt-1">
                    {tx.type === "masuk" ? "Uang Masuk" : "Uang Keluar"} ·{" "}
                    <span className="font-semibold text-terang-ink">{formatIDR(tx.amount)}</span>
                  </p>
                </div>
                {canVote && !myVote && (
                  <div className="flex gap-2 shrink-0">
                    <form action={submitApproval.bind(null, tx.id, "approve")}>
                      <button className="btn-primary text-xs px-3 py-1.5">Setuju</button>
                    </form>
                    <form action={submitApproval.bind(null, tx.id, "reject")}>
                      <button className="btn-secondary text-xs px-3 py-1.5">Tolak</button>
                    </form>
                  </div>
                )}
                {myVote && (
                  <span
                    className={`text-xs shrink-0 font-medium ${
                      myVote.decision === "approve" ? "text-terang-safe" : "text-terang-danger"
                    }`}
                  >
                    ✓ Anda {myVote.decision === "approve" ? "menyetujui" : "menolak"}
                  </span>
                )}
              </div>

              {/* Progress 2-dari-3 */}
              <div className="mt-4">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < progress ? "bg-terang-accent" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-terang-muted mt-2">
                  {approveCount} setuju · {rejectCount} tolak · butuh 2 untuk final
                </p>
              </div>
            </div>
          );
        })}
        {(!pending || pending.length === 0) && (
          <div className="card text-center py-8">
            <p className="text-terang-muted text-sm">Tidak ada transaksi yang menunggu persetujuan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
