"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROLE_LABEL, PENGURUS_ROLES, type UserRole } from "@/lib/types";
import { BrandMark } from "@/components/BrandMark";
import { AccessibilityToggle } from "@/components/AccessibilityToggle";
import { SignOutButton } from "@/components/SignOutButton";

type Props = {
  profile: {
    full_name: string;
    role: UserRole;
    koperasi: { nama: string; wilayah: string } | null;
  };
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
  const isPengurus = PENGURUS_ROLES.includes(profile.role);

  return (
    <header className="sticky top-0 z-40 border-b border-kem-border bg-white/85 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <BrandMark className="h-8 w-8" />
            <span className="font-display font-extrabold text-lg leading-none text-kem-ink">
              Koperasi <span className="text-kem-teal">Terang</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? "text-kem-teal bg-kem-tealSoft" : "text-kem-muted hover:text-kem-ink hover:bg-kem-bg"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isPengurus && (
              <Link href="/transactions/new" className="btn-primary hidden sm:inline-flex text-sm px-3 py-1.5">
                + Catat
              </Link>
            )}
            <AccessibilityToggle />
            <Link href="/profile" className="hidden sm:flex flex-col items-end leading-tight group">
              <span className="text-sm font-semibold text-kem-ink group-hover:text-kem-teal transition-colors">
                {profile.full_name}
              </span>
              <span className="text-[11px] text-kem-teal font-semibold uppercase tracking-wide">
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </Link>
            <div className="hidden sm:block">
              <SignOutButton />
            </div>

            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden grid h-9 w-9 place-items-center rounded-lg border border-kem-border text-kem-ink"
              aria-label="Menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 rounded-lg text-base font-medium ${
                    active ? "text-kem-teal bg-kem-tealSoft" : "text-kem-muted hover:bg-kem-bg"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-kem-muted hover:bg-kem-bg"
            >
              Profil Saya
            </Link>
            <div className="mt-2 flex items-center justify-between border-t border-kem-border pt-3">
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-kem-ink">{profile.full_name}</span>
                <span className="text-[11px] text-kem-teal font-semibold uppercase">
                  {ROLE_LABEL[profile.role] ?? profile.role}
                  {profile.koperasi ? `, ${profile.koperasi.nama}` : ""}
                </span>
              </div>
              <SignOutButton variant="secondary" />
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
