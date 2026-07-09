"use client";

import { useState } from "react";
import { updateMyName } from "@/lib/actions";

export function ProfileNameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      action={async (fd) => {
        setSaving(true);
        setMsg(null);
        setErr(null);
        try {
          await updateMyName(fd);
          setMsg("Nama berhasil diperbarui.");
        } catch (e: any) {
          setErr(e?.message ?? "Gagal memperbarui nama.");
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className="label">Nama Lengkap</label>
        <input
          name="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          required
          minLength={2}
          placeholder="Nama Anda"
        />
      </div>
      {msg && <p className="text-sm text-kem-green">{msg}</p>}
      {err && <p className="text-sm text-kem-danger">{err}</p>}
      <button disabled={saving} className="btn-primary">
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
