"use client";

import { useState } from "react";

/**
 * Tombol Keluar: berubah merah saat di-hover, dan meminta konfirmasi lewat dialog
 * kecil supaya tidak keluar karena klik tak sengaja (penting untuk pengguna awam).
 */
export function SignOutButton({ variant = "ghost" }: { variant?: "ghost" | "secondary" }) {
  const [open, setOpen] = useState(false);

  const triggerClass =
    variant === "secondary"
      ? "btn-secondary text-sm py-1.5 hover:text-kem-danger hover:border-kem-danger/40"
      : "btn-ghost text-sm hover:text-kem-danger";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass} title="Keluar">
        Keluar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div className="card max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Keluar dari akun?</h3>
            <p className="text-sm text-kem-muted mt-1">
              Anda perlu masuk kembali untuk mengakses koperasi.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="btn-secondary text-sm">
                Batal
              </button>
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn-danger text-sm">
                  Ya, keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
