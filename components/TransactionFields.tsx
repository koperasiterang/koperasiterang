"use client";

import { useState } from "react";
import { AmountInput } from "@/components/AmountInput";
import { TX_CATEGORIES, CATEGORY_LABELS, CATEGORY_HELP, type TxCategory } from "@/lib/types";

/**
 * Field form transaksi yang interaktif: label & panduan kategori menyesuaikan
 * arah transaksi (masuk/keluar). Nilai yang dikirim tetap "Simpanan"/"Pinjaman"/"Operasional".
 */
export function TransactionFields() {
  const [type, setType] = useState<"masuk" | "keluar">("masuk");
  const [category, setCategory] = useState<TxCategory | "">("");

  return (
    <>
      <div>
        <label className="label">Jenis</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "masuk" | "keluar")}
          className="input"
        >
          <option value="masuk">Uang Masuk</option>
          <option value="keluar">Uang Keluar</option>
        </select>
      </div>

      <div>
        <label className="label">Jumlah</label>
        <AmountInput type={type} />
      </div>

      <div>
        <label className="label">Kategori</label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as TxCategory)}
          className="input"
        >
          <option value="" disabled>
            Pilih kategori...
          </option>
          {TX_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[type][c]}
            </option>
          ))}
        </select>
        {category && (
          <p className="text-xs text-kem-muted mt-1.5">{CATEGORY_HELP[type][category]}</p>
        )}
      </div>

      <div>
        <label className="label">Keterangan</label>
        <textarea
          name="description"
          required
          className="input"
          rows={3}
          placeholder="Jelaskan tujuan transaksi ini"
        />
      </div>
    </>
  );
}
