export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { FlagAnomalyButton } from "@/components/FlagAnomalyButton";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function TransactionsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("koperasi_id")
    .eq("id", user?.id)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, profiles!transactions_created_by_fkey(full_name)")
    .eq("koperasi_id", profile?.koperasi_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5 animate-fade-in-up">
      <RealtimeRefresher koperasiId={profile?.koperasi_id} />

      <header>
        <p className="eyebrow mb-2">Audit Trail Immutable</p>
        <h1 className="text-2xl font-display">Semua Transaksi</h1>
        <p className="text-terang-muted mt-1 text-sm max-w-2xl">
          Setiap transaksi tercatat permanen. Koreksi hanya lewat entri baru yang merujuk transaksi
          asal — riwayat asli tidak pernah dihapus atau diubah. Setiap baris dirantai dengan hash
          SHA-256 sehingga perubahan sekecil apa pun langsung terdeteksi.
        </p>
      </header>

      <div className="relative space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-terang-border/60">
        {transactions?.map((tx: any) => (
          <div key={tx.id} className="relative pl-7">
            <span
              className={`absolute left-0 top-6 h-3.5 w-3.5 rounded-full ring-4 ring-terang-bg ${
                tx.type === "masuk" ? "bg-terang-safe" : "bg-terang-danger"
              }`}
            />
            <div className="card card-hover">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-terang-muted mt-1">
                    {new Date(tx.created_at).toLocaleString("id-ID")} · dicatat oleh{" "}
                    {tx.profiles?.full_name ?? "—"} · {tx.category ?? "tanpa kategori"}
                  </p>
                  {tx.correction_of && (
                    <p className="text-xs text-terang-warn mt-1">
                      ↳ Koreksi dari transaksi #{tx.correction_of.slice(0, 8)}: {tx.correction_reason}
                    </p>
                  )}
                  {tx.batch_hash && (
                    <p className="text-[11px] text-terang-muted/70 mt-2 font-mono flex items-center gap-1">
                      <span className="text-terang-teal">⛓</span> hash: {tx.batch_hash.slice(0, 24)}…
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={
                      tx.type === "masuk"
                        ? "text-terang-safe font-semibold"
                        : "text-terang-danger font-semibold"
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
              {tx.created_by !== user?.id && (
                <div className="mt-3 border-t border-terang-border/50 pt-2">
                  <FlagAnomalyButton transactionId={tx.id} />
                </div>
              )}
            </div>
          </div>
        ))}
        {(!transactions || transactions.length === 0) && (
          <p className="text-terang-muted text-sm pl-7">Belum ada transaksi.</p>
        )}
      </div>
    </div>
  );
}
