"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  profile: {
    full_name: string;
    role: string;
    koperasi: { nama: string; wilayah: string } | null;
  };
};

const ROLE_LABEL: Record<string, string> = {
  ketua: "Ketua",
  bendahara: "Bendahara",
  pengawas: "Pengawas",
  anggota: "Anggota",
  dinas: "Dinas Koperasi",
};

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transaksi" },
  { href: "/approvals", label: "Persetujuan" },
  { href: "/anomalies", label: "Watchdog" },
];

export function NavBar({ profile }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isPengurus = profile.role === "ketua" || profile.role === "bendahara";

  return (
    <header className="sticky top-0 z-40 border-b border-terang-border/70 bg-terang-bg/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-terang-accent/15 ring-1 ring-terang-accent/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="4.5" fill="#12D6A0" />
                <g stroke="#12D6A0" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
                </g>
              </svg>
            </span>
            <span className="font-display text-lg leading-none">
              Koperasi <span className="text-terang-accent">Terang</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-terang-accent bg-terang-accent/10"
                      : "text-terang-muted hover:text-terang-ink hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isPengurus && (
              <Link href="/transactions/new" className="btn-primary hidden sm:inline-flex text-sm px-3 py-1.5">
                + Catat
              </Link>
            )}
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium">{profile.full_name}</span>
              <span className="text-[11px] text-terang-teal font-semibold uppercase tracking-wide">
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </div>
            <form action="/auth/signout" method="post" className="hidden sm:block">
              <button className="btn-ghost text-sm" title="Keluar">
                Keluar
              </button>
            </form>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden grid h-9 w-9 place-items-center rounded-lg border border-terang-border"
              aria-label="Menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? "text-terang-accent bg-terang-accent/10" : "text-terang-muted hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center justify-between border-t border-terang-border pt-3">
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{profile.full_name}</span>
                <span className="text-[11px] text-terang-teal font-semibold uppercase">
                  {ROLE_LABEL[profile.role] ?? profile.role}
                  {profile.koperasi ? ` · ${profile.koperasi.nama}` : ""}
                </span>
              </div>
              <form action="/auth/signout" method="post">
                <button className="btn-secondary text-sm py-1.5">Keluar</button>
              </form>
            </div>
            {isPengurus && (
              <Link href="/transactions/new" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
                + Catat Transaksi
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
