export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { FlagAnomalyButton } from "@/components/FlagAnomalyButton";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Semua Transaksi & Audit Trail</h1>
        <Link href="/dashboard" className="text-sm text-white/50">
          ← Dashboard
        </Link>
      </div>
      <p className="text-sm text-white/50">
        Setiap transaksi tercatat permanen. Koreksi hanya bisa dilakukan lewat entri baru yang
        merujuk ke transaksi asal — riwayat asli tidak pernah dihapus atau diubah.
      </p>

      <div className="space-y-3">
        {transactions?.map((tx: any) => (
          <div key={tx.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-xs text-white/40 mt-1">
                  {new Date(tx.created_at).toLocaleString("id-ID")} · dicatat oleh{" "}
                  {tx.profiles?.full_name} · {tx.category ?? "tanpa kategori"}
                </p>
                {tx.correction_of && (
                  <p className="text-xs text-yellow-300 mt-1">
                    ↳ Koreksi dari transaksi #{tx.correction_of.slice(0, 8)}: {tx.correction_reason}
                  </p>
                )}
                {tx.batch_hash && (
                  <p className="text-xs text-white/30 mt-1 font-mono">hash: {tx.batch_hash.slice(0, 16)}…</p>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className={tx.type === "masuk" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                  {tx.type === "masuk" ? "+" : "-"}
                  {formatIDR(tx.amount)}
                </p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
            {tx.created_by !== user?.id && (
              <div className="mt-2">
                <FlagAnomalyButton transactionId={tx.id} />
              </div>
            )}
          </div>
        ))}
        {(!transactions || transactions.length === 0) && (
          <p className="text-white/40 text-sm">Belum ada transaksi.</p>
        )}
      </div>
    </div>
  );
}
