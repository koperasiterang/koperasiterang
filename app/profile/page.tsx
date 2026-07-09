export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type UserRole } from "@/lib/types";
import { ProfileNameForm } from "@/components/ProfileNameForm";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, koperasi(nama, wilayah)")
    .eq("id", user?.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  const kop = (profile as any)?.koperasi;

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in-up">
      <Link href="/dashboard" className="btn-ghost text-sm">
        ← Kembali
      </Link>
      <div className="card">
        <p className="eyebrow mb-1.5">Profil Saya</p>
        <h1 className="text-xl font-extrabold mb-4">Pengaturan Akun</h1>

        <ProfileNameForm currentName={profile?.full_name ?? ""} />

        <div className="mt-6 pt-4 border-t border-kem-border text-sm space-y-1">
          <p>
            <span className="text-kem-muted">Peran: </span>
            <span className="font-medium text-kem-ink">{role ? ROLE_LABEL[role] : "-"}</span>
          </p>
          <p>
            <span className="text-kem-muted">Koperasi: </span>
            <span className="font-medium text-kem-ink">
              {kop?.nama ?? "-"}
              {kop?.wilayah ? `, ${kop.wilayah}` : ""}
            </span>
          </p>
          <p className="text-xs text-kem-muted mt-2">
            Peran dan koperasi hanya dapat diubah oleh pengurus melalui basis data (bukan dari
            aplikasi), demi keamanan.
          </p>
        </div>
      </div>
    </div>
  );
}
