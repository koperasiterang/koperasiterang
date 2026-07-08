"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Berlangganan perubahan realtime Supabase pada tabel transaksi/approval/anomali,
 * lalu memanggil router.refresh() sehingga Server Components mengambil data terbaru
 * TANPA reload penuh. Inilah "update real-time tanpa refresh" yang dijanjikan di pitch deck.
 *
 * Catatan: aktifkan Realtime untuk tabel terkait di Supabase
 * (Database -> Replication / Publications -> supabase_realtime).
 */
export function RealtimeRefresher({ koperasiId }: { koperasiId?: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("koperasi-terang-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "approvals" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "anomaly_flags" }, () =>
        router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // koperasiId sengaja jadi dependency agar re-subscribe bila konteks berubah.
  }, [router, koperasiId]);

  return null;
}
