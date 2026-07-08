"use client";

import { useState } from "react";
import { reviewAnomaly } from "@/lib/actions";

export function AnomalyReviewButtons({ flagId }: { flagId: string }) {
  const [submitting, setSubmitting] = useState<"cancel_tx" | "dismiss" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "cancel_tx" | "dismiss") {
    setSubmitting(action);
    setError(null);
    try {
      await reviewAnomaly(flagId, action);
    } catch (e: any) {
      setError(e?.message ?? "Gagal meninjau.");
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          disabled={submitting !== null}
          onClick={() => run("cancel_tx")}
          className="btn-danger text-xs px-3 py-1.5"
        >
          {submitting === "cancel_tx" ? "Memproses…" : "Tindak lanjut — batalkan transaksi"}
        </button>
        <button
          disabled={submitting !== null}
          onClick={() => run("dismiss")}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          {submitting === "dismiss" ? "Memproses…" : "Bukan anomali"}
        </button>
      </div>
      {error && <p className="text-xs text-kem-danger">{error}</p>}
    </div>
  );
}
