-- ============================================================
-- KOPERASI TERANG — Governance v2
-- ============================================================
-- Perubahan tata kelola sesuai masukan:
--   1. Tambah peran `sekretaris` (pengurus ke-3) → multi-sig lebih kuat.
--   2. Separation of duties: PENGINPUT transaksi TIDAK boleh menyetujui
--      transaksinya sendiri, dan TIDAK boleh menandai anomalinya sendiri.
--   3. Transaksi bisa DIBATALKAN (status 'cancelled') dengan alasan wajib,
--      tapi baris & audit log tetap utuh (immutability terjaga).
--   4. Pengawas bisa menindaklanjuti/mengabaikan anomali → keluar dari antrian.
--
-- CATATAN TEKNIS: nilai enum baru 'sekretaris' hanya dipakai sebagai LITERAL TEXT
-- (via ::text) di dalam fungsi/policy, sehingga migrasi ini aman dijalankan sekali
-- jalan tanpa error "unsafe use of new value".

-- ------------------------------------------------------------
-- 1. Tambah peran sekretaris
-- ------------------------------------------------------------
-- Jika muncul error "ALTER TYPE ... ADD VALUE cannot run inside a transaction block",
-- jalankan HANYA baris di bawah ini sendirian dulu (satu Run terpisah), lalu jalankan
-- sisa file ini. Di Supabase (PostgreSQL 15) umumnya aman dijalankan sekaligus.
alter type user_role add value if not exists 'sekretaris';

-- ------------------------------------------------------------
-- 2. Tambah status 'cancelled' pada transaksi
-- ------------------------------------------------------------
alter table transactions drop constraint if exists transactions_status_check;
alter table transactions add constraint transactions_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled'));

-- ------------------------------------------------------------
-- 3. Tambah aksi 'cancel' & 'review' pada audit log
-- ------------------------------------------------------------
alter table audit_log drop constraint if exists audit_log_action_check;
alter table audit_log add constraint audit_log_action_check
  check (action in ('create', 'approve', 'reject', 'flag_anomaly', 'correction', 'cancel', 'review'));

-- ------------------------------------------------------------
-- 4. RPC set_transaction_status (revisi)
--    - approved/rejected hanya dari 'pending'
--    - cancelled dari 'pending' atau 'approved' (membalik efek saldo)
--    - hanya pengurus/pengawas & satu koperasi
-- ------------------------------------------------------------
drop function if exists public.set_transaction_status(uuid, text);

create or replace function public.set_transaction_status(tx_id uuid, new_status text)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  caller_koperasi uuid;
  tx public.transactions;
  updated public.transactions;
begin
  if new_status not in ('approved', 'rejected', 'cancelled') then
    raise exception 'Status tidak valid: %', new_status using errcode = '22023';
  end if;

  select role::text, koperasi_id into caller_role, caller_koperasi
  from public.profiles where id = auth.uid();

  if caller_role is null then
    raise exception 'Profil caller tidak ditemukan / tidak terautentikasi.' using errcode = '42501';
  end if;

  if caller_role not in ('ketua', 'bendahara', 'sekretaris', 'pengawas') then
    raise exception 'Peran % tidak berwenang mengubah status transaksi.', caller_role using errcode = '42501';
  end if;

  select * into tx from public.transactions where id = tx_id;
  if tx.id is null then
    raise exception 'Transaksi % tidak ditemukan.', tx_id using errcode = 'P0002';
  end if;
  if tx.koperasi_id <> caller_koperasi then
    raise exception 'Transaksi berada di koperasi lain.' using errcode = '42501';
  end if;

  -- Aturan transisi status
  if new_status in ('approved', 'rejected') then
    if tx.status <> 'pending' then
      return tx; -- sudah final, idempoten
    end if;
  elsif new_status = 'cancelled' then
    if tx.status not in ('pending', 'approved') then
      return tx; -- rejected/cancelled tidak bisa dibatalkan lagi
    end if;
  end if;

  update public.transactions
    set status = new_status
    where id = tx_id
    returning * into updated;

  return updated;
end;
$$;

grant execute on function public.set_transaction_status(uuid, text) to authenticated;
revoke execute on function public.set_transaction_status(uuid, text) from anon;

-- ------------------------------------------------------------
-- 5. RPC review_anomaly (pengawas menindaklanjuti/mengabaikan)
--    action = 'cancel_tx' → tandai reviewed + batalkan transaksi terkait
--    action = 'dismiss'   → tandai reviewed saja (bukan anomali)
--    Keduanya mengeluarkan anomali dari antrian "belum ditinjau".
-- ------------------------------------------------------------
drop function if exists public.review_anomaly(uuid, text);

create or replace function public.review_anomaly(flag_id uuid, action text)
returns public.anomaly_flags
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  caller_koperasi uuid;
  fl public.anomaly_flags;
  tx public.transactions;
  updated public.anomaly_flags;
begin
  if action not in ('cancel_tx', 'dismiss') then
    raise exception 'Aksi tidak valid: %', action using errcode = '22023';
  end if;

  select role::text, koperasi_id into caller_role, caller_koperasi
  from public.profiles where id = auth.uid();

  -- Hanya pengawas / ketua yang boleh menutup anomali
  if caller_role not in ('pengawas', 'ketua') then
    raise exception 'Hanya pengawas/ketua yang boleh meninjau anomali.' using errcode = '42501';
  end if;

  select * into fl from public.anomaly_flags where id = flag_id;
  if fl.id is null then
    raise exception 'Anomali tidak ditemukan.' using errcode = 'P0002';
  end if;

  select * into tx from public.transactions where id = fl.transaction_id;
  if tx.koperasi_id <> caller_koperasi then
    raise exception 'Anomali berada di koperasi lain.' using errcode = '42501';
  end if;

  update public.anomaly_flags
    set reviewed = true, reviewed_by = auth.uid()
    where id = flag_id
    returning * into updated;

  -- Jika ditindaklanjuti, batalkan transaksi (kalau masih pending/approved)
  if action = 'cancel_tx' and tx.status in ('pending', 'approved') then
    update public.transactions set status = 'cancelled' where id = tx.id;
    insert into public.audit_log (transaction_id, actor_id, action, note)
    values (tx.id, auth.uid(), 'cancel', 'Dibatalkan karena tindak lanjut anomali');
  end if;

  insert into public.audit_log (transaction_id, actor_id, action, note)
  values (fl.transaction_id, auth.uid(),
          'review',
          case when action = 'cancel_tx' then 'Anomali ditindaklanjuti (transaksi dibatalkan)'
               else 'Anomali ditinjau: bukan pelanggaran' end);

  return updated;
end;
$$;

grant execute on function public.review_anomaly(uuid, text) to authenticated;
revoke execute on function public.review_anomaly(uuid, text) from anon;

-- ------------------------------------------------------------
-- 6. Policy: sekretaris boleh input transaksi
-- ------------------------------------------------------------
drop policy if exists "tx_insert_pengurus" on transactions;
create policy "tx_insert_pengurus" on transactions
  for insert with check (
    koperasi_id = my_koperasi_id()
    and my_role()::text in ('ketua', 'bendahara', 'sekretaris')
    and created_by = auth.uid()
  );

-- ------------------------------------------------------------
-- 7. Policy: separation of duties pada approval
--    Penyetuju harus pengurus/pengawas DAN bukan penginput transaksi.
-- ------------------------------------------------------------
drop policy if exists "approvals_insert_authorized" on approvals;
create policy "approvals_insert_authorized" on approvals
  for insert with check (
    approver_id = auth.uid()
    and my_role()::text in ('ketua', 'bendahara', 'sekretaris', 'pengawas')
    and not exists (
      select 1 from transactions t
      where t.id = transaction_id and t.created_by = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 8. Policy: penginput tidak boleh menandai anomali transaksinya sendiri
-- ------------------------------------------------------------
drop policy if exists "anomaly_insert_member" on anomaly_flags;
create policy "anomaly_insert_member" on anomaly_flags
  for insert with check (
    flagged_by = auth.uid()
    and exists (
      select 1 from transactions t
      where t.id = transaction_id and t.koperasi_id = my_koperasi_id()
    )
    and not exists (
      select 1 from transactions t
      where t.id = transaction_id and t.created_by = auth.uid()
    )
  );
