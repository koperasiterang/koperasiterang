export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, PENGURUS_ROLES, TX_CATEGORIES, type UserRole } from "@/lib/types";
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

  // Untuk rekap arus masuk/keluar per kategori — hanya transaksi disetujui yang dihitung.
  const { data: approvedTx } = await supabase
    .from("transactions")
    .select("type, amount, category")
    .eq("koperasi_id", profile?.koperasi_id)
    .eq("status", "approved");

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
    .select("id")
    .eq("reviewed", false);

  const role = profile?.role as UserRole | undefined;
  const isPengurus = role ? PENGURUS_ROLES.includes(role) : false;
  const kop = (profile as any)?.koperasi;

  const totalMasuk = (approvedTx ?? [])
    .filter((t) => t.type === "masuk")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalKeluar = (approvedTx ?? [])
    .filter((t) => t.type === "keluar")
    .reduce((s, t) => s + Number(t.amount), 0);

  const perCategory = TX_CATEGORIES.map((cat) => {
    const rows = (approvedTx ?? []).filter((t) => t.category === cat);
    return {
      cat,
      masuk: rows.filter((t) => t.type === "masuk").reduce((s, t) => s + Number(t.amount), 0),
      keluar: rows.filter((t) => t.type === "keluar").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <p className="eyebrow mb-1.5">Dashboard Transparansi</p>
        <h1 className="text-3xl font-extrabold">{kop?.nama ?? "Koperasi Terang"}</h1>
        <p className="text-kem-muted mt-1">
          {kop?.wilayah ? `${kop.wilayah} · ` : ""}Semua angka di sini terlihat oleh setiap anggota,
          bukan hanya pengurus.
        </p>
      </header>

      {/* Ringkasan utama */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-kem-teal">
          <p className="text-kem-muted text-sm">Saldo Kas Koperasi</p>
          <p className="text-3xl font-extrabold mt-2 text-kem-teal">{formatIDR(balanceRow?.saldo ?? 0)}</p>
          <p className="text-xs text-kem-muted mt-2">Realtime dari transaksi disetujui</p>
        </div>
        <div className="card">
          <p className="text-kem-muted text-sm">Total Uang Masuk</p>
          <p className="text-2xl font-bold mt-2 text-kem-green">+{formatIDR(totalMasuk)}</p>
          <p className="text-xs text-kem-muted mt-2">Akumulasi pemasukan disetujui</p>
        </div>
        <div className="card">
          <p className="text-kem-muted text-sm">Total Uang Keluar</p>
          <p className="text-2xl font-bold mt-2 text-kem-danger">−{formatIDR(totalKeluar)}</p>
          <p className="text-xs text-kem-muted mt-2">Akumulasi pengeluaran disetujui</p>
        </div>
      </section>

      {/* Antrian yang butuh tindakan */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/approvals" className="card card-hover flex items-center justify-between">
          <div>
            <p className="text-kem-muted text-sm">Menunggu Persetujuan</p>
            <p className="text-2xl font-bold mt-1 text-kem-ink">{pendingApprovals?.length ?? 0}</p>
          </div>
          <span className="text-sm text-kem-teal font-medium">Buka antrian →</span>
        </Link>
        <Link href="/anomalies" className="card card-hover flex items-center justify-between">
          <div>
            <p className="text-kem-muted text-sm">Anomali Belum Ditinjau</p>
            <p className="text-2xl font-bold mt-1 text-kem-ink">{openAnomalies?.length ?? 0}</p>
          </div>
          <span className="text-sm text-kem-teal font-medium">Watchdog →</span>
        </Link>
      </section>

      {/* Rekap per kategori */}
      <section className="card">
        <h2 className="font-bold text-lg mb-4">Rekap per Kategori</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {perCategory.map((c) => (
            <div key={c.cat} className="rounded-xl border border-kem-border p-4">
              <p className="font-semibold text-kem-ink">{c.cat}</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-kem-muted">Masuk</span>
                  <span className="text-kem-green font-medium">+{formatIDR(c.masuk)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-kem-muted">Keluar</span>
                  <span className="text-kem-danger font-medium">−{formatIDR(c.keluar)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aksi + aktivitas */}
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

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Aktivitas Terbaru</h2>
          <Link href="/transactions" className="text-xs text-kem-teal font-medium">
            Lihat semua →
          </Link>
        </div>
        <div className="divide-y divide-kem-border">
          {recentTx?.map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-kem-ink truncate">{tx.description}</p>
                <p className="text-xs text-kem-muted mt-0.5">
                  {new Date(tx.created_at).toLocaleString("id-ID")} · {tx.category ?? "Tanpa kategori"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={tx.type === "masuk" ? "text-kem-green font-semibold" : "text-kem-danger font-semibold"}>
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
            <p className="text-kem-muted text-sm py-6 text-center">Belum ada transaksi tercatat.</p>
          )}
        </div>
      </section>
    </div>
  );
}
