"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel (kiri) */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-terang-accent/10" />
        <div className="absolute right-10 top-24 h-64 w-64 rounded-full bg-terang-teal/10" />
        <div className="relative">
          <p className="eyebrow">Hackathon Digital Cooperatives Expo 2026</p>
          <h1 className="mt-6 font-display text-6xl leading-[0.95]">
            Koperasi
            <br />
            <span className="text-terang-accent">Terang</span>
          </h1>
          <p className="mt-6 text-lg text-terang-muted max-w-sm italic font-display">
            Platform Akuntabilitas Koperasi Desa Berbasis Transparansi Radikal
          </p>
        </div>
        <div className="relative">
          <blockquote className="font-display text-xl text-terang-ink/90 max-w-sm">
            “Koperasi yang sehat dimulai dari anggota yang bisa melihat.”
          </blockquote>
          <div className="mt-6 flex gap-6 text-xs text-terang-muted">
            <span>⛓ Audit trail immutable</span>
            <span>✍ Multi-signature</span>
            <span>✦ Watchdog AI</span>
          </div>
        </div>
      </div>

      {/* Form panel (kanan) */}
      <div className="flex items-center justify-center p-6">
        <div className="card w-full max-w-sm">
          <h2 className="text-2xl font-display mb-1">Masuk</h2>
          <p className="text-sm text-terang-muted mb-6">
            Lihat kondisi keuangan koperasi Anda secara transparan.
          </p>

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

            {error && <p className="text-sm text-terang-danger">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-xs text-terang-muted/70 mt-6">
            Akun demo juri: lihat kredensial pada README / lampiran submission.
          </p>
        </div>
      </div>
    </div>
  );
}
