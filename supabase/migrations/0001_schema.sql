-- ============================================================
-- KOPERASI TERANG — Core Schema
-- Platform Akuntabilitas Koperasi Desa Berbasis Transparansi Radikal
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. ROLES & PROFILES
-- ------------------------------------------------------------
-- Roles: pengurus (ketua/bendahara), anggota, pengawas, dinas
create type user_role as enum ('ketua', 'bendahara', 'anggota', 'pengawas', 'dinas');

create table koperasi (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  wilayah text not null,          -- kabupaten/kota, dipakai Dinas untuk filter
  nik_ketua text,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  koperasi_id uuid references koperasi(id) on delete cascade,
  full_name text not null,
  role user_role not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. TRANSAKSI + AUDIT TRAIL IMMUTABLE
-- ------------------------------------------------------------
-- Transaksi TIDAK PERNAH di-UPDATE atau DELETE.
-- Koreksi = insert baris baru berreferensi ke transaksi asal (correction_of).
create table transactions (
  id uuid primary key default gen_random_uuid(),
  koperasi_id uuid references koperasi(id) not null,
  type text not null check (type in ('masuk', 'keluar')),
  amount numeric(15,2) not null check (amount > 0),
  description text not null,
  category text,
  created_by uuid references profiles(id) not null,
  correction_of uuid references transactions(id),   -- null jika bukan koreksi
  correction_reason text,                           -- wajib diisi jika correction_of tidak null
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approval_threshold_hit boolean generated always as (amount > 5000000) stored, -- threshold contoh: Rp 5jt
  created_at timestamptz default now(),
  batch_hash text                                    -- diisi oleh edge function hash-batch
);

-- Audit log terpisah: setiap event (create, approve, reject, flag) tercatat di sini,
-- baris ini juga tidak pernah di-update/delete.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) not null,
  actor_id uuid references profiles(id) not null,
  action text not null check (action in ('create', 'approve', 'reject', 'flag_anomaly', 'correction')),
  note text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. MULTI-SIGNATURE APPROVAL
-- ------------------------------------------------------------
-- Untuk transaksi > threshold, butuh 2 dari 3 approval:
-- Ketua, Bendahara, Perwakilan Anggota (rotasi/pengawas).
create table approvals (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) not null,
  approver_id uuid references profiles(id) not null,
  decision text not null check (decision in ('approve', 'reject')),
  created_at timestamptz default now(),
  unique (transaction_id, approver_id)  -- satu approver hanya bisa vote sekali per transaksi
);

-- ------------------------------------------------------------
-- 4. ANOMALY FLAGS (watchdog anggota + AI)
-- ------------------------------------------------------------
create table anomaly_flags (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) not null,
  flagged_by uuid references profiles(id),          -- null jika oleh AI system
  source text not null check (source in ('anggota', 'ai')),
  reason text not null,
  reviewed boolean default false,
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 5. HELPER VIEW: saldo kas realtime per koperasi
-- ------------------------------------------------------------
create view koperasi_balance as
select
  koperasi_id,
  coalesce(sum(case when type = 'masuk' and status = 'approved' then amount else 0 end), 0)
  - coalesce(sum(case when type = 'keluar' and status = 'approved' then amount else 0 end), 0) as saldo
from transactions
group by koperasi_id;

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table koperasi enable row level security;
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table audit_log enable row level security;
alter table approvals enable row level security;
alter table anomaly_flags enable row level security;

-- Helper: current user's koperasi_id + role
create or replace function my_koperasi_id() returns uuid as $$
  select koperasi_id from profiles where id = auth.uid()
$$ language sql stable security definer;

create or replace function my_role() returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql stable security definer;

-- PROFILES: user sees own profile + others in same koperasi
create policy "profiles_select_same_koperasi" on profiles
  for select using (koperasi_id = my_koperasi_id());

-- KOPERASI: members see their own koperasi; dinas sees all in their wilayah (app-level filter)
create policy "koperasi_select_member" on koperasi
  for select using (id = my_koperasi_id() or my_role() = 'dinas');

-- TRANSACTIONS: everyone in koperasi can READ (this is the whole point — transparency).
-- Only ketua/bendahara can INSERT. Nobody can UPDATE/DELETE (immutability enforced by omission of policy).
create policy "tx_select_same_koperasi" on transactions
  for select using (koperasi_id = my_koperasi_id() or my_role() = 'dinas');

create policy "tx_insert_pengurus" on transactions
  for insert with check (
    koperasi_id = my_koperasi_id()
    and my_role() in ('ketua', 'bendahara')
    and created_by = auth.uid()
  );
-- Intentionally NO update/delete policy → immutable by default (RLS denies by default).

-- AUDIT LOG: read-only for koperasi members, insert by any authenticated member action
create policy "audit_select_same_koperasi" on audit_log
  for select using (
    exists (select 1 from transactions t where t.id = transaction_id and t.koperasi_id = my_koperasi_id())
    or my_role() = 'dinas'
  );

create policy "audit_insert_any_member" on audit_log
  for insert with check (actor_id = auth.uid());

-- APPROVALS: ketua/bendahara/pengawas can approve; everyone in koperasi can read
create policy "approvals_select_same_koperasi" on approvals
  for select using (
    exists (select 1 from transactions t where t.id = transaction_id and t.koperasi_id = my_koperasi_id())
  );

create policy "approvals_insert_authorized" on approvals
  for insert with check (
    approver_id = auth.uid()
    and my_role() in ('ketua', 'bendahara', 'pengawas')
  );

-- ANOMALY FLAGS: any member can flag (read+insert), pengawas can mark reviewed
create policy "anomaly_select_same_koperasi" on anomaly_flags
  for select using (
    exists (select 1 from transactions t where t.id = transaction_id and t.koperasi_id = my_koperasi_id())
  );

create policy "anomaly_insert_member" on anomaly_flags
  for insert with check (
    exists (select 1 from transactions t where t.id = transaction_id and t.koperasi_id = my_koperasi_id())
  );
