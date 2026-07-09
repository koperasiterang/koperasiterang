export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, type UserRole } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { AnomalyReviewButtons } from "@/components/AnomalyReviewButtons";

export default async function AnomaliesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const { data: flags } = await supabase
    .from("anomaly_flags")
    .select("*, transactions(description, amount, type, created_at, status)")
    .order("created_at", { ascending: false });

  const role = profile?.role as UserRole | undefined;
  const canReview = role === "pengawas" || role === "ketua";
  const openCount = flags?.filter((f: any) => !f.reviewed).length ?? 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <header>
        <p className="eyebrow mb-1.5">Watchdog Dashboard</p>
        <h1 className="text-2xl font-extrabold">Watchdog & Tinjauan</h1>
        <p className="text-kem-muted mt-1 text-sm max-w-2xl">
          Ditandai oleh anggota (bukan penginput transaksinya sendiri), otomatis oleh AI, atau oleh
          sistem (mis. pemasukan besar). Pengawas menindaklanjuti atau menutupnya, begitu ditinjau
          item keluar dari antrian.
          {openCount > 0 ? ` Saat ini ${openCount} menunggu peninjauan.` : ""}
        </p>
      </header>

      <div className="space-y-3">
        {flags?.map((f: any) => (
          <div key={f.id} className={`card ${f.reviewed ? "opacity-70" : ""}`}>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-kem-ink">{f.transactions?.description ?? "Transaksi"}</p>
                <p className="text-xs text-kem-muted mt-1">
                  {formatIDR(f.transactions?.amount ?? 0)}
                  {f.transactions?.created_at
                    ? ` · ${new Date(f.transactions.created_at).toLocaleString("id-ID")}`
                    : ""}
                </p>
                <p className="text-sm mt-2 text-kem-ink bg-kem-amberSoft/60 rounded-lg px-3 py-2">
                  {f.reason}
                </p>
                {f.transactions?.status && (
                  <div className="mt-2">
                    <StatusBadge status={f.transactions.status} />
                  </div>
                )}
              </div>
              <span
                className={
                  f.source === "ai"
                    ? "badge bg-kem-tealSoft text-kem-teal shrink-0"
                    : f.source === "sistem"
                    ? "badge bg-kem-amberSoft text-kem-amber shrink-0"
                    : "badge bg-kem-dangerSoft text-kem-danger shrink-0"
                }
              >
                {f.source === "ai"
                  ? "✦ Terdeteksi AI"
                  : f.source === "sistem"
                  ? "◔ Tinjauan Sistem"
                  : "⚑ Dilaporkan Anggota"}
              </span>
            </div>

            <div className="mt-3 border-t border-kem-border pt-3">
              {f.reviewed ? (
                <p className="text-xs text-kem-green font-medium">✓ Sudah ditinjau pengawas</p>
              ) : canReview ? (
                <AnomalyReviewButtons flagId={f.id} />
              ) : (
                <p className="text-xs text-kem-muted">● Menunggu peninjauan pengawas</p>
              )}
            </div>
          </div>
        ))}
        {(!flags || flags.length === 0) && (
          <div className="card text-center py-8">
            <p className="text-kem-muted text-sm">Belum ada anomali tercatat. Koperasi bersih ✓</p>
          </div>
        )}
      </div>
    </div>
  );
}
