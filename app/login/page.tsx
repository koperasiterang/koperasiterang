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
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold text-terang-accent mb-1">Koperasi Terang</h1>
        <p className="text-sm text-white/60 mb-6">
          Masuk untuk melihat kondisi keuangan koperasi Anda secara transparan.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-terang-accent"
              placeholder="nama@koperasi.id"
            />
          </div>
          <div>
            <label className="text-sm text-white/70">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-terang-accent"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-xs text-white/40 mt-6">
          Akun demo juri: lihat kredensial pada README / lampiran submission.
        </p>
      </div>
    </div>
  );
}
