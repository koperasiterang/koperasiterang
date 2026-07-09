export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, APPROVER_ROLES, ROLE_LABEL, type UserRole } from "@/lib/types";
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
    .select("*, approvals(approver_id, decision), profiles!transactions_created_by_fkey(full_name)")
    .eq("koperasi_id", profile?.koperasi_id)
    .eq("status", "pending")
    .eq("approval_threshold_hit", true)
    .order("created_at", { ascending: false });

  // Semua pihak yang berwenang menyetujui di koperasi ini (untuk menampilkan siapa yang diam).
  const { data: approvers } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("koperasi_id", profile?.koperasi_id)
    .in("role", APPROVER_ROLES as string[]);

  const role = profile?.role as UserRole | undefined;
  const isApprover = role ? APPROVER_ROLES.includes(role) : false;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <header>
        <p className="eyebrow mb-1.5">Persetujuan Bersama</p>
        <h1 className="text-2xl font-extrabold">Persetujuan</h1>
        <p className="text-kem-muted mt-1 text-sm max-w-2xl">
          Pengeluaran di atas Rp 5.000.000 butuh 2 persetujuan dari pihak yang bukan penginput
          (Ketua, Bendahara, Sekretaris, atau Pengawas). Cukup 1 penolakan untuk membatalkan.
        </p>
      </header>

      {/* Callout tanggung jawab */}
      <div className="rounded-2xl border border-kem-amber/40 bg-kem-amberSoft/50 p-4">
        <p className="text-sm text-kem-ink">
          <span className="font-bold">Setiap keputusan di sini tercatat permanen atas nama Anda.</span>{" "}
          Menyetujui berarti Anda ikut bertanggung jawab bila kelak ditemukan penyelewengan. Diam pun
          tercatat, pastikan Anda memeriksa sebelum memutuskan.
        </p>
      </div>

      {!isApprover && (
        <p className="text-xs text-kem-amber">
          Anda masuk sebagai {role ? ROLE_LABEL[role] : "-"}, dapat memantau tetapi tidak memberi suara.
        </p>
      )}

      <div className="space-y-3">
        {pending?.map((tx: any) => {
          const votes = new Map<string, string>(
            (tx.approvals ?? []).map((a: any) => [a.approver_id, a.decision])
          );
          const myVote = tx.approvals?.find((a: any) => a.approver_id === profile?.id);
          const approveCount = (tx.approvals ?? []).filter((a: any) => a.decision === "approve").length;
          const progress = Math.min(approveCount, 2);
          const isCreator = tx.created_by === profile?.id;

          const eligible = (approvers ?? []).filter((a: any) => a.id !== tx.created_by);
          const approvedBy = eligible.filter((a: any) => votes.get(a.id) === "approve");
          const abstained = eligible.filter((a: any) => !votes.has(a.id));

          return (
            <div key={tx.id} className="card">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-kem-ink">{tx.description}</p>
                  <p className="text-sm text-kem-muted mt-1">
                    Uang Keluar ·{" "}
                    <span className="font-semibold text-kem-ink">{formatIDR(tx.amount)}</span>
                  </p>
                  <p className="text-xs text-kem-muted mt-0.5">
                    Diinput oleh {tx.profiles?.full_name ?? "-"} · {tx.category ?? "tanpa kategori"}
                  </p>
                </div>

                {isApprover && isCreator && (
                  <span className="text-xs text-kem-muted shrink-0 max-w-[9rem] text-right">
                    Anda penginput, tidak bisa menyetujui sendiri
                  </span>
                )}
                {isApprover && !isCreator && !myVote && (
                  <div className="flex gap-2 shrink-0">
                    <form action={submitApproval.bind(null, tx.id, "approve")}>
                      <button className="btn-primary text-sm px-4 py-2">Setuju</button>
                    </form>
                    <form action={submitApproval.bind(null, tx.id, "reject")}>
                      <button className="btn-danger text-sm px-4 py-2">Tolak</button>
                    </form>
                  </div>
                )}
                {isApprover && !isCreator && myVote && (
                  <span
                    className={`text-sm shrink-0 font-semibold ${
                      myVote.decision === "approve" ? "text-kem-green" : "text-kem-danger"
                    }`}
                  >
                    ✓ Anda {myVote.decision === "approve" ? "menyetujui" : "menolak"}
                  </span>
                )}
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center gap-1.5">
                  {[0, 1].map((i) => (
                    <span
                      key={i}
                      className={`h-2 flex-1 rounded-full ${i < progress ? "bg-kem-teal" : "bg-kem-border"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-kem-muted mt-2">{approveCount} dari 2 persetujuan.</p>
              </div>

              {/* Siapa yang sudah setuju & siapa yang masih diam (Opsi A) */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {approvedBy.map((a: any) => (
                  <span key={a.id} className="badge bg-kem-greenSoft text-kem-green">
                    ✓ {a.full_name} ({ROLE_LABEL[a.role as UserRole]})
                  </span>
                ))}
                {abstained.map((a: any) => (
                  <span key={a.id} className="badge bg-kem-bg text-kem-muted border border-kem-border">
                    ● belum bersuara: {a.full_name} ({ROLE_LABEL[a.role as UserRole]})
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {(!pending || pending.length === 0) && (
          <div className="card text-center py-8">
            <p className="text-kem-muted text-sm">Tidak ada transaksi yang menunggu persetujuan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
