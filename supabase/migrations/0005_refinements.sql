-- ============================================================
-- KOPERASI TERANG — Refinements v3
-- ============================================================
-- 1. Uang MASUK tidak perlu persetujuan (approval_threshold_hit hanya untuk keluar > 5jt).
-- 2. Hanya ketua & bendahara yang boleh mencatat transaksi (sekretaris jadi penyetuju murni).
-- 3. Tambah sumber anomali 'sistem' (mis. tinjauan pasif pemasukan besar).
-- 4. RPC update_my_name: anggota bisa ganti nama sendiri dari aplikasi (hanya kolom full_name).
-- 5. RPC flag_income_review: tandai pemasukan besar untuk tinjauan pasif pengawas.

-- ------------------------------------------------------------
-- 1. approval_threshold_hit -> hanya berlaku untuk uang keluar > Rp 5.000.000
-- ------------------------------------------------------------
alter table transactions drop column if exists approval_threshold_hit;
alter table transactions add column approval_threshold_hit boolean
  generated always as (type = 'keluar' and amount > 5000000) stored;

-- ------------------------------------------------------------
-- 2. Hanya ketua & bendahara yang boleh input transaksi
-- ------------------------------------------------------------
drop policy if exists "tx_insert_pengurus" on transactions;
create policy "tx_insert_pengurus" on transactions
  for insert with check (
    koperasi_id = my_koperasi_id()
    and my_role()::text in ('ketua', 'bendahara')
    and created_by = auth.uid()
  );

-- ------------------------------------------------------------
-- 3. Tambah sumber 'sistem' pada anomaly_flags
-- ------------------------------------------------------------
alter table anomaly_flags drop constraint if exists anomaly_flags_source_check;
alter table anomaly_flags add constraint anomaly_flags_source_check
  check (source in ('anggota', 'ai', 'sistem'));

-- ------------------------------------------------------------
-- 4. RPC ganti nama profil sendiri (hanya full_name, kolom lain tidak tersentuh)
-- ------------------------------------------------------------
create or replace function public.update_my_name(new_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles;
begin
  if length(trim(coalesce(new_name, ''))) < 2 then
    raise exception 'Nama minimal 2 karakter.' using errcode = '22023';
  end if;

  update public.profiles
    set full_name = trim(new_name)
    where id = auth.uid()
    returning * into updated;

  if updated.id is null then
    raise exception 'Profil tidak ditemukan.' using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

grant execute on function public.update_my_name(text) to authenticated;
revoke execute on function public.update_my_name(text) from anon;

-- ------------------------------------------------------------
-- 5. RPC tandai pemasukan besar untuk tinjauan pasif pengawas
--    (uang masuk auto-approve, tapi > 5jt tetap dicatat untuk diperiksa asal dananya)
-- ------------------------------------------------------------
create or replace function public.flag_income_review(tx_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_koperasi uuid;
  tx public.transactions;
begin
  select koperasi_id into caller_koperasi from public.profiles where id = auth.uid();
  select * into tx from public.transactions where id = tx_id;

  if tx.id is null then
    raise exception 'Transaksi tidak ditemukan.' using errcode = 'P0002';
  end if;
  if tx.koperasi_id <> caller_koperasi then
    raise exception 'Transaksi berada di koperasi lain.' using errcode = '42501';
  end if;

  insert into public.anomaly_flags (transaction_id, flagged_by, source, reason)
  values (tx_id, null, 'sistem',
    'Pemasukan besar (di atas Rp 5.000.000). Mohon pengawas memverifikasi asal dana ini.');

  insert into public.audit_log (transaction_id, actor_id, action, note)
  values (tx_id, auth.uid(), 'flag_anomaly', 'Sistem menandai pemasukan besar untuk tinjauan pengawas');
end;
$$;

grant execute on function public.flag_income_review(uuid) to authenticated;
revoke execute on function public.flag_income_review(uuid) from anon;
