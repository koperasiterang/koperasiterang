export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";

export default async function AnomaliesPage() {
  const supabase = createClient();

  const { data: flags } = await supabase
    .from("anomaly_flags")
    .select("*, transactions(description, amount, type, created_at)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Watchdog Dashboard — Anomali</h1>
        <Link href="/dashboard" className="text-sm text-white/50">
          ← Dashboard
        </Link>
      </div>
      <p className="text-sm text-white/50">
        Anomali bisa ditandai manual oleh anggota, atau otomatis oleh sistem AI berdasarkan pola
        transaksi historis koperasi.
      </p>

      <div className="space-y-3">
        {flags?.map((f: any) => (
          <div key={f.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{f.transactions?.description}</p>
                <p className="text-xs text-white/40 mt-1">
                  {formatIDR(f.transactions?.amount ?? 0)} ·{" "}
                  {new Date(f.transactions?.created_at).toLocaleString("id-ID")}
                </p>
                <p className="text-sm mt-2 text-yellow-300">{f.reason}</p>
              </div>
              <span
                className={
                  f.source === "ai"
                    ? "badge-pending text-purple-300 bg-purple-500/20"
                    : "badge-pending"
                }
              >
                {f.source === "ai" ? "Terdeteksi AI" : "Dilaporkan Anggota"}
              </span>
            </div>
            {f.reviewed ? (
              <p className="text-xs text-green-400 mt-2">✓ Sudah ditinjau pengawas</p>
            ) : (
              <p className="text-xs text-white/40 mt-2">Menunggu peninjauan pengawas</p>
            )}
          </div>
        ))}
        {(!flags || flags.length === 0) && (
          <p className="text-white/40 text-sm">Belum ada anomali yang tercatat. Koperasi bersih ✓</p>
        )}
      </div>
    </div>
  );
}
