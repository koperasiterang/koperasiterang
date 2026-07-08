export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

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
  const kop = (profile as any)?.koperasi;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <RealtimeRefresher koperasiId={profile?.koperasi_id} />

      {/* Hero */}
      <header>
        <p className="eyebrow mb-2">Dashboard Transparansi</p>
        <h1 className="text-3xl font-display leading-tight">
          {kop?.nama ?? "Koperasi Terang"}
        </h1>
        <p className="text-terang-muted mt-1">
          {kop?.wilayah ? `${kop.wilayah} · ` : ""}Semua angka di halaman ini terlihat oleh setiap
          anggota — bukan hanya pengurus.
        </p>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-terang-accent/10" />
          <p className="text-terang-muted text-sm">Saldo Kas Koperasi</p>
          <p className="text-3xl font-display mt-2 text-terang-accent">
            {formatIDR(balanceRow?.saldo ?? 0)}
          </p>
          <p className="text-xs text-terang-muted mt-2">Dihitung realtime dari transaksi disetujui</p>
        </div>

        <Link href="/approvals" className="card card-hover">
          <p className="text-terang-muted text-sm">Menunggu Persetujuan</p>
          <p className="text-3xl font-display mt-2">{pendingApprovals?.length ?? 0}</p>
          <p className="text-xs text-terang-teal mt-2 font-medium">Antrian multi-signature →</p>
        </Link>

        <Link href="/anomalies" className="card card-hover">
          <p className="text-terang-muted text-sm">Anomali Belum Ditinjau</p>
          <p className="text-3xl font-display mt-2">{openAnomalies?.length ?? 0}</p>
          <p className="text-xs text-terang-teal mt-2 font-medium">Watchdog dashboard →</p>
        </Link>
      </section>

      {/* Tiga lapisan pertahanan (dari pitch deck) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            n: "01",
            t: "Audit Trail Immutable",
            d: "Transaksi tak bisa dihapus — koreksi lewat entri baru + chaining hash SHA-256.",
          },
          {
            n: "02",
            t: "Multi-Signature",
            d: "Pengeluaran besar wajib disetujui 2 dari 3 pihak. Tak ada otorisasi sepihak.",
          },
          {
            n: "03",
            t: "Anggota Watchdog",
            d: "Dashboard real-time + tandai anomali, diperkuat deteksi AI otomatis.",
          },
        ].map((l) => (
          <div key={l.n} className="rounded-2xl border border-terang-border/70 bg-terang-surface/50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-terang-accent">{l.n}</span>
              <span className="font-semibold text-sm">{l.t}</span>
            </div>
            <p className="text-xs text-terang-muted mt-2 leading-relaxed">{l.d}</p>
          </div>
        ))}
      </section>

      {/* Actions */}
      <section className="flex flex-wrap gap-3">
        {isPengurus && (
          <Link href="/transactions/new" className="btn-primary">
            + Catat Transaksi
          </Link>
        )}
        <Link href="/transactions" className="btn-secondary">
          Lihat Semua Transaksi & Audit Trail
        </Link>
      </section>

      {/* Recent activity */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Aktivitas Terbaru</h2>
          <Link href="/transactions" className="text-xs text-terang-teal font-medium">
            Lihat semua →
          </Link>
        </div>
        <div className="divide-y divide-terang-border/60">
          {recentTx?.map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{tx.description}</p>
                <p className="text-xs text-terang-muted mt-0.5">
                  {new Date(tx.created_at).toLocaleString("id-ID")} · {tx.category ?? "Tanpa kategori"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={tx.type === "masuk" ? "text-terang-safe font-semibold" : "text-terang-danger font-semibold"}>
                  {tx.type === "masuk" ? "+" : "−"}
                  {formatIDR(tx.amount)}
                </p>
                <div className="mt-1">
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            </div>
          ))}
          {(!recentTx || recentTx.length === 0) && (
            <p className="text-terang-muted text-sm py-6 text-center">Belum ada transaksi tercatat.</p>
          )}
        </div>
      </section>
    </div>
  );
}
