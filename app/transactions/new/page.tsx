export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createTransaction } from "@/lib/actions";
import { PENGURUS_ROLES, type UserRole } from "@/lib/types";
import { TransactionFields } from "@/components/TransactionFields";

export default async function NewTransactionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  // Hanya ketua & bendahara yang boleh mencatat. Cegah akses langsung via URL,
  // jangan sampai pengguna mengisi form panjang lalu baru ditolak saat submit.
  if (!role || !PENGURUS_ROLES.includes(role)) {
    redirect("/transactions");
  }

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in-up">
      <Link href="/transactions" className="btn-ghost text-sm">
        ← Kembali ke transaksi
      </Link>
      <div className="card">
        <p className="eyebrow mb-1.5">Input Transaksi</p>
        <h1 className="text-xl font-extrabold mb-1">Catat Transaksi</h1>
        <p className="text-sm text-kem-muted mb-5">
          Uang masuk langsung tercatat. Khusus uang keluar di atas Rp 5.000.000, transaksi masuk
          antrian persetujuan bersama (2 dari 3 pihak yang bukan penginput) sebelum dieksekusi.
        </p>

        <form action={createTransaction} className="space-y-4">
          <TransactionFields />
          <button type="submit" className="btn-primary w-full">
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}
