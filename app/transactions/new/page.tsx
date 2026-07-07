import { createTransaction } from "@/lib/actions";
import Link from "next/link";

export default function NewTransactionPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <Link href="/dashboard" className="text-sm text-white/50">
        ← Kembali
      </Link>
      <div className="card">
        <h1 className="text-lg font-bold mb-1">Catat Transaksi</h1>
        <p className="text-sm text-white/50 mb-4">
          Transaksi di atas Rp 5.000.000 otomatis masuk antrian persetujuan multi-signature.
        </p>

        <form action={createTransaction} className="space-y-4">
          <div>
            <label className="text-sm text-white/70">Jenis</label>
            <select
              name="type"
              required
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
            >
              <option value="masuk">Uang Masuk</option>
              <option value="keluar">Uang Keluar</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-white/70">Jumlah (Rp)</label>
            <input
              type="number"
              name="amount"
              required
              min={1}
              step="0.01"
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
              placeholder="500000"
            />
          </div>
          <div>
            <label className="text-sm text-white/70">Kategori</label>
            <input
              type="text"
              name="category"
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
              placeholder="Simpanan / Pinjaman / Operasional"
            />
          </div>
          <div>
            <label className="text-sm text-white/70">Keterangan</label>
            <textarea
              name="description"
              required
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
              rows={3}
              placeholder="Jelaskan tujuan transaksi ini"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}
