import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, koperasi(nama, wilayah)")
    .eq("id", user?.id)
    .single();

  const { data: balanceRow } = await supabase
    .from("koperasi_balance")
    .select("saldo")
    .eq("koperasi_id", profile?.koperasi_id)
    .maybeSingle();

  const { data: recentTx } = await supabase
    .from("transactions")
    .select("*")
    .eq("koperasi_id", profile?.koperasi_id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: pendingApprovals } = await supabase
    .from("transactions")
    .select("id")
    .eq("koperasi_id", profile?.koperasi_id)
    .eq("status", "pending")
    .eq("approval_threshold_hit", true);

  const { data: openAnomalies } = await supabase
    .from("anomaly_flags")
    .select("id, transaction_id")
    .eq("reviewed", false);

  const isPengurus = profile?.role === "ketua" || profile?.role === "bendahara";

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-terang-accent">
            {(profile as any)?.koperasi?.nama ?? "Koperasi Terang"}
          </h1>
          <p className="text-sm text-white/50">
            {(profile as any)?.koperasi?.wilayah} · Masuk sebagai {profile?.full_name} ({profile?.role})
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn-secondary text-sm">Keluar</button>
        </form>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-white/50 text-sm">Saldo Kas Koperasi</p>
          <p className="text-2xl font-bold mt-1">{formatIDR(balanceRow?.saldo ?? 0)}</p>
          <p className="text-xs text-white/40 mt-1">Dihitung realtime dari transaksi yang disetujui</p>
        </div>
        <div className="card">
          <p className="text-white/50 text-sm">Menunggu Persetujuan (Multi-Sig)</p>
          <p className="text-2xl font-bold mt-1">{pendingApprovals?.length ?? 0}</p>
          <Link href="/approvals" className="text-xs text-terang-accent underline">
            Lihat detail
          </Link>
        </div>
        <div className="card">
          <p className="text-white/50 text-sm">Anomali Belum Ditinjau</p>
          <p className="text-2xl font-bold mt-1">{openAnomalies?.length ?? 0}</p>
          <Link href="/anomalies" className="text-xs text-terang-accent underline">
            Lihat detail
          </Link>
        </div>
      </section>

      <section className="flex gap-3">
        {isPengurus && (
          <Link href="/transactions/new" className="btn-primary">
            + Catat Transaksi
          </Link>
        )}
        <Link href="/transactions" className="btn-secondary">
          Lihat Semua Transaksi & Audit Trail
        </Link>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-3">Aktivitas Terbaru</h2>
        <div className="divide-y divide-white/10">
          {recentTx?.map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-xs text-white/40">
                  {new Date(tx.created_at).toLocaleString("id-ID")} · {tx.category ?? "Tanpa kategori"}
                </p>
              </div>
              <div className="text-right">
                <p className={tx.type === "masuk" ? "text-green-400" : "text-red-400"}>
                  {tx.type === "masuk" ? "+" : "-"}
                  {formatIDR(tx.amount)}
                </p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
          {(!recentTx || recentTx.length === 0) && (
            <p className="text-white/40 text-sm py-4">Belum ada transaksi tercatat.</p>
          )}
        </div>
      </section>
    </div>
  );
}
