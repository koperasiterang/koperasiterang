import { createTransaction } from "@/lib/actions";
import Link from "next/link";

export default function NewTransactionPage() {
  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in-up">
      <Link href="/transactions" className="btn-ghost text-sm">
        ← Kembali ke transaksi
      </Link>
      <div className="card">
        <p className="eyebrow mb-2">Input Transaksi</p>
        <h1 className="text-xl font-display mb-1">Catat Transaksi</h1>
        <p className="text-sm text-terang-muted mb-5">
          Transaksi di atas Rp 5.000.000 otomatis masuk antrian persetujuan multi-signature. Di
          bawah itu langsung disetujui agar operasional harian tidak macet.
        </p>

        <form action={createTransaction} className="space-y-4">
          <div>
            <label className="label">Jenis</label>
            <select name="type" required className="input">
              <option value="masuk">Uang Masuk</option>
              <option value="keluar">Uang Keluar</option>
            </select>
          </div>
          <div>
            <label className="label">Jumlah (Rp)</label>
            <input
              type="number"
              name="amount"
              required
              min={1}
              step="0.01"
              className="input"
              placeholder="500000"
            />
          </div>
          <div>
            <label className="label">Kategori</label>
            <input
              type="text"
              name="category"
              className="input"
              placeholder="Simpanan / Pinjaman / Operasional"
            />
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
          <button type="submit" className="btn-primary w-full">
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}
