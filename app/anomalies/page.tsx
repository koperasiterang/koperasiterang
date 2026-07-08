export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function AnomaliesPage() {
  const supabase = createClient();

  const { data: flags } = await supabase
    .from("anomaly_flags")
    .select("*, transactions(description, amount, type, created_at)")
    .order("created_at", { ascending: false });

  const openCount = flags?.filter((f: any) => !f.reviewed).length ?? 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <RealtimeRefresher />

      <header>
        <p className="eyebrow mb-2">Watchdog Dashboard</p>
        <h1 className="text-2xl font-display">Deteksi Anomali</h1>
        <p className="text-terang-muted mt-1 text-sm max-w-2xl">
          Anomali ditandai manual oleh anggota, atau otomatis oleh AI (Claude) berdasarkan pola
          transaksi historis koperasi. {openCount > 0 ? `${openCount} anomali menunggu peninjauan.` : ""}
        </p>
      </header>

      <div className="space-y-3">
        {flags?.map((f: any) => (
          <div key={f.id} className="card">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="font-medium">{f.transactions?.description ?? "Transaksi"}</p>
                <p className="text-xs text-terang-muted mt-1">
                  {formatIDR(f.transactions?.amount ?? 0)}
                  {f.transactions?.created_at
                    ? ` · ${new Date(f.transactions.created_at).toLocaleString("id-ID")}`
                    : ""}
                </p>
                <p className="text-sm mt-2 text-terang-warn">{f.reason}</p>
              </div>
              <span
                className={
                  f.source === "ai"
                    ? "inline-flex items-center gap-1 bg-terang-teal/15 text-terang-teal px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                    : "inline-flex items-center gap-1 bg-terang-danger/15 text-terang-danger px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                }
              >
                {f.source === "ai" ? "✦ Terdeteksi AI" : "⚑ Dilaporkan Anggota"}
              </span>
            </div>
            <div className="mt-3 border-t border-terang-border/50 pt-2">
              {f.reviewed ? (
                <p className="text-xs text-terang-safe">✓ Sudah ditinjau pengawas</p>
              ) : (
                <p className="text-xs text-terang-muted">● Menunggu peninjauan pengawas</p>
              )}
            </div>
          </div>
        ))}
        {(!flags || flags.length === 0) && (
          <div className="card text-center py-8">
            <p className="text-terang-muted text-sm">
              Belum ada anomali yang tercatat. Koperasi bersih ✓
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
