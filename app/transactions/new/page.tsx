import { createTransaction } from "@/lib/actions";
import { AmountInput } from "@/components/AmountInput";
import { CategorySelect } from "@/components/CategorySelect";
import Link from "next/link";

export default function NewTransactionPage() {
  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in-up">
      <Link href="/transactions" className="btn-ghost text-sm">
        ← Kembali ke transaksi
      </Link>
      <div className="card">
        <p className="eyebrow mb-1.5">Input Transaksi</p>
        <h1 className="text-xl font-extrabold mb-1">Catat Transaksi</h1>
        <p className="text-sm text-kem-muted mb-5">
          Transaksi di atas Rp 5.000.000 otomatis masuk antrian persetujuan multi-signature (butuh 2
          dari 3 pihak yang bukan penginput). Di bawah itu langsung disetujui.
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
            <label className="label">Jumlah</label>
            <AmountInput />
          </div>
          <div>
            <label className="label">Kategori</label>
            <CategorySelect />
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
