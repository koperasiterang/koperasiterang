"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatIDR } from "@/lib/types";

type Tone = "info" | "warn" | "alert";
type Toast = { id: number; text: string; tone: Tone };

/**
 * Notifikasi realtime bertingkat:
 *  - SEMUA perubahan memicu router.refresh() (badge & angka update tanpa reload) = pasif.
 *  - Hanya EVENT PENTING (transaksi besar, item Watchdog baru) yang memunculkan toast singkat,
 *    supaya tidak jadi spam untuk transaksi rutin kecil.
 * Dipasang sekali di layout agar berlaku di seluruh halaman.
 */
export function RealtimeNotifier() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Tone) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("kt-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, (payload: any) => {
        router.refresh();
        if (payload.eventType === "INSERT") {
          const n = payload.new;
          const amount = Number(n?.amount ?? 0);
          if (n?.type === "keluar" && amount > 5000000) {
            push(`Pengeluaran besar dicatat (${formatIDR(amount)}). Perlu persetujuan bersama.`, "warn");
          } else if (n?.type === "masuk" && amount > 5000000) {
            push(`Pemasukan besar dicatat (${formatIDR(amount)}).`, "info");
          }
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "anomaly_flags" }, () => {
        router.refresh();
        push("Ada item baru di Watchdog untuk ditinjau.", "alert");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "approvals" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, push]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast border-l-4 ${
            t.tone === "alert"
              ? "border-l-kem-danger"
              : t.tone === "warn"
              ? "border-l-kem-amber"
              : "border-l-kem-teal"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
