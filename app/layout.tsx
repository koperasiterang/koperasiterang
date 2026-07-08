import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Koperasi Terang — Transparansi Radikal untuk Koperasi Desa",
  description:
    "Platform akuntabilitas koperasi desa: audit trail immutable, persetujuan multi-signature, dan watchdog anggota real-time.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string; role: string; koperasi: { nama: string; wilayah: string } | null } | null =
    null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, koperasi(nama, wilayah)")
      .eq("id", user.id)
      .single();
    profile = data as any;
  }

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {profile && <NavBar profile={profile} />}
        <main className={profile ? "max-w-5xl mx-auto px-4 py-8" : ""}>{children}</main>
      </body>
    </html>
  );
}
