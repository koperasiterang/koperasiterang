"use client";

import { useState } from "react";
import { formatNumberID } from "@/lib/types";

/**
 * Input jumlah dengan pemisah ribuan (mis. "5.000.000") untuk keterbacaan,
 * namun mengirim angka mentah lewat hidden input `name` ke server action.
 * Hint persetujuan hanya muncul untuk UANG KELUAR (uang masuk tidak butuh approval).
 */
export function AmountInput({
  name = "amount",
  type,
}: {
  name?: string;
  type?: "masuk" | "keluar";
}) {
  const [raw, setRaw] = useState<number | "">("");
  const display = raw === "" ? "" : formatNumberID(raw);

  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-kem-muted text-sm">Rp</span>
        <input
          inputMode="numeric"
          value={display}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setRaw(digits === "" ? "" : Number(digits));
          }}
          className="input pl-9"
          placeholder="5.000.000"
          aria-label="Jumlah rupiah"
        />
      </div>
      <input type="hidden" name={name} value={raw === "" ? "" : String(raw)} />
      {type === "keluar" && raw !== "" && raw > 5000000 && (
        <p className="text-xs text-kem-amber mt-1.5">
          Pengeluaran di atas Rp 5.000.000 akan masuk antrian persetujuan bersama (butuh 2 dari 3 pihak
          yang bukan penginput).
        </p>
      )}
      {type === "masuk" && raw !== "" && raw > 5000000 && (
        <p className="text-xs text-kem-muted mt-1.5">
          Pemasukan langsung tercatat, namun akan ditandai untuk ditinjau pengawas (memastikan asal dana
          jelas).
        </p>
      )}
    </div>
  );
}
