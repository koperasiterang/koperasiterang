export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, APPROVER_ROLES, type UserRole } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { FlagAnomalyButton } from "@/components/FlagAnomalyButton";
import { CancelTransactionButton } from "@/components/CancelTransactionButton";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function TransactionsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, koperasi_id, role")
    .eq("id", user?.id)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, profiles!transactions_created_by_fkey(full_name)")
    .eq("koperasi_id", profile?.koperasi_id)
    .order("created_at", { ascending: false });

  const role = profile?.role as UserRole | undefined;
  const canCancel = role ? APPROVER_ROLES.includes(role) : false;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <RealtimeRefresher koperasiId={profile?.koperasi_id} />

      <header>
        <p className="eyebrow mb-1.5">Audit Trail Immutable</p>
        <h1 className="text-2xl font-extrabold">Semua Transaksi</h1>
        <p className="text-kem-muted mt-1 text-sm max-w-2xl">
          Setiap transaksi tercatat permanen. Pembatalan pun tidak menghapus data — statusnya berubah
          jadi &ldquo;Dibatalkan&rdquo; dan alasannya tercatat di audit log. Tiap baris dirantai dengan
          hash SHA-256 sehingga perubahan sekecil apa pun terdeteksi.
        </p>
      </header>

      <div className="relative space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-kem-border">
        {transactions?.map((tx: any) => {
          const isOwn = tx.created_by === user?.id;
          const cancellable = canCancel && (tx.status === "pending" || tx.status === "approved");
          return (
            <div key={tx.id} className="relative pl-7">
              <span
                className={`absolute left-0 top-6 h-3.5 w-3.5 rounded-full ring-4 ring-kem-bg ${
                  tx.status === "cancelled"
                    ? "bg-kem-muted"
                    : tx.type === "masuk"
                    ? "bg-kem-green"
                    : "bg-kem-danger"
                }`}
              />
              <div className="card card-hover">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-kem-ink">{tx.description}</p>
                    <p className="text-xs text-kem-muted mt-1">
                      {new Date(tx.created_at).toLocaleString("id-ID")} · dicatat oleh{" "}
                      {tx.profiles?.full_name ?? "—"} · {tx.category ?? "tanpa kategori"}
                    </p>
                    {tx.batch_hash && (
                      <p className="text-[11px] text-kem-muted/80 mt-2 font-mono flex items-center gap-1">
                        <span className="text-kem-teal">⛓</span> {tx.batch_hash.slice(0, 24)}…
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={
                        tx.type === "masuk"
                          ? "text-kem-green font-semibold"
                          : "text-kem-danger font-semibold"
                      }
                    >
                      {tx.type === "masuk" ? "+" : "−"}
                      {formatIDR(tx.amount)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>

                {(!isOwn || cancellable) && (
                  <div className="mt-3 border-t border-kem-border pt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {/* Penginput tidak boleh menandai anomali transaksinya sendiri */}
                    {!isOwn && <FlagAnomalyButton transactionId={tx.id} />}
                    {cancellable && <CancelTransactionButton transactionId={tx.id} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(!transactions || transactions.length === 0) && (
          <p className="text-kem-muted text-sm pl-7">Belum ada transaksi.</p>
        )}
      </div>
    </div>
  );
}
