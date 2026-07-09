"use client";

import { useEffect, useState } from "react";

/**
 * Mode "Ramah Lansia": memperbesar seluruh tampilan (font & jarak) dengan menaikkan
 * ukuran font root, sehingga skala rem Tailwind ikut membesar proporsional.
 * Default OFF supaya pengguna muda tidak terganggu tampilan besar. Disimpan di localStorage.
 */
export function AccessibilityToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(document.documentElement.classList.contains("senior"));
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    document.documentElement.classList.toggle("senior", next);
    try {
      localStorage.setItem("kt-senior", next ? "1" : "0");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title="Mode ramah lansia (perbesar tampilan)"
      className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold leading-none transition-colors ${
        on
          ? "bg-kem-tealSoft border-kem-teal text-kem-teal"
          : "border-kem-border text-kem-muted hover:text-kem-ink"
      }`}
    >
      A+
    </button>
  );
}
