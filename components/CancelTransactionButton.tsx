"use client";

import { useState } from "react";
import { cancelTransaction } from "@/lib/actions";

export function CancelTransactionButton({ transactionId }: { transactionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-kem-muted hover:text-kem-danger">
        Batalkan transaksi
      </button>
    );
  }

  return (
    <div className="mt-1 space-y-2">
      <p className="text-xs text-kem-muted">
        Pembatalan tidak menghapus data — alasan Anda tercatat permanen di audit log.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Alasan pembatalan (wajib)"
        className="input text-sm"
        rows={2}
      />
      {error && <p className="text-xs text-kem-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={submitting || !reason.trim()}
          onClick={async () => {
            setSubmitting(true);
            setError(null);
            try {
              await cancelTransaction(transactionId, reason);
              setOpen(false);
              setReason("");
            } catch (e: any) {
              setError(e?.message ?? "Gagal membatalkan.");
            } finally {
              setSubmitting(false);
            }
          }}
          className="btn-danger text-xs px-3 py-1.5"
        >
          {submitting ? "Memproses…" : "Konfirmasi Batalkan"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary text-xs px-3 py-1.5">
          Tutup
        </button>
      </div>
    </div>
  );
}
