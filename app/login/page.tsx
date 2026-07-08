"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-kem-bg">
      {/* Panel brand */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-kem-teal text-white overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute right-16 top-28 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <BrandMark className="h-11 w-11 !bg-white/15 !ring-white/25" />
          <span className="font-extrabold text-xl">Koperasi Terang</span>
        </div>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
            Hackathon Digital Cooperatives Expo 2026
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white">
            Akuntabilitas koperasi desa berbasis transparansi radikal.
          </h1>
          <p className="mt-4 text-white/80 max-w-md">
            Audit trail immutable, persetujuan multi-signature, dan pengawasan anggota real-time —
            dalam satu platform.
          </p>
        </div>
        <p className="relative text-white/70 text-sm">
          &ldquo;Koperasi yang sehat dimulai dari anggota yang bisa melihat.&rdquo;
        </p>
      </div>

      {/* Panel form */}
      <div className="flex items-center justify-center p-6">
        <div className="card w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-5 lg:hidden">
            <BrandMark className="h-9 w-9" />
            <span className="font-extrabold text-lg text-kem-ink">
              Koperasi <span className="text-kem-teal">Terang</span>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mb-1">Masuk</h2>
          <p className="text-sm text-kem-muted mb-6">Lihat kondisi keuangan koperasi Anda secara transparan.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="nama@koperasi.id"
              />
            </div>
            <div>
              <label className="label">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-kem-danger">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-xs text-kem-muted/80 mt-6">
            Akun demo juri: lihat kredensial pada README / lampiran submission.
          </p>
        </div>
      </div>
    </div>
  );
}
