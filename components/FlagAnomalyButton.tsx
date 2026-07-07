"use client";

import { useState } from "react";
import { flagAnomaly } from "@/lib/actions";

export function FlagAnomalyButton({ transactionId }: { transactionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-terang-danger underline">
        Tandai Anomali
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Kenapa transaksi ini mencurigakan?"
        className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-2 py-1"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          disabled={submitting || !reason}
          onClick={async () => {
            setSubmitting(true);
            await flagAnomaly(transactionId, reason);
            setSubmitting(false);
            setOpen(false);
            setReason("");
          }}
          className="btn-primary text-xs px-3 py-1"
        >
          Kirim
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary text-xs px-3 py-1">
          Batal
        </button>
      </div>
    </div>
  );
}
