-- ============================================================
-- KOPERASI TERANG — RPC Functions
-- ============================================================
-- Perubahan status transaksi (pending -> approved/rejected) HARUS lewat RPC ini.
-- Tabel `transactions` sengaja tidak punya RLS policy UPDATE (immutability by omission),
-- jadi UPDATE langsung dari klien akan selalu ditolak. Fungsi SECURITY DEFINER ini
-- dimiliki oleh role pembuat migrasi (postgres/superuser) sehingga UPDATE-nya
-- melewati RLS, TAPI hanya untuk kolom `status` dan hanya jika caller punya peran sah.
--
-- Catatan penting yang sebelumnya menyebabkan bug "status tidak berubah":
--   1. Fungsi ini tidak pernah ada di migrasi mana pun -> panggilan rpc gagal silent.
--   2. GRANT EXECUTE ke role `authenticated` wajib, kalau tidak PostgREST menolak.
--   3. `set search_path` wajib untuk fungsi SECURITY DEFINER (keamanan + agar
--      referensi tabel `transactions`/`profiles` selalu ditemukan).

create or replace function public.set_transaction_status(tx_id uuid, new_status text)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role user_role;
  caller_koperasi uuid;
  tx public.transactions;
  updated public.transactions;
begin
  -- Validasi nilai status
  if new_status not in ('approved', 'rejected') then
    raise exception 'Status tidak valid: %. Hanya approved/rejected yang diizinkan.', new_status
      using errcode = '22023';
  end if;

  -- Ambil peran & koperasi caller dari profil
  select role, koperasi_id into caller_role, caller_koperasi
  from public.profiles
  where id = auth.uid();

  if caller_role is null then
    raise exception 'Profil caller tidak ditemukan / tidak terautentikasi.'
      using errcode = '42501';
  end if;

  -- Hanya pengurus/pengawas yang boleh mengubah status
  if caller_role not in ('ketua', 'bendahara', 'pengawas') then
    raise exception 'Peran % tidak berwenang mengubah status transaksi.', caller_role
      using errcode = '42501';
  end if;

  -- Pastikan transaksi ada dan berada di koperasi yang sama dengan caller
  select * into tx from public.transactions where id = tx_id;
  if tx.id is null then
    raise exception 'Transaksi % tidak ditemukan.', tx_id using errcode = 'P0002';
  end if;
  if tx.koperasi_id <> caller_koperasi then
    raise exception 'Transaksi berada di koperasi lain.' using errcode = '42501';
  end if;

  -- Hanya transaksi berstatus pending yang bisa difinalisasi (idempoten & aman)
  if tx.status <> 'pending' then
    return tx; -- sudah final, tidak melakukan apa-apa
  end if;

  update public.transactions
    set status = new_status
    where id = tx_id
    returning * into updated;

  return updated;
end;
$$;

-- WAJIB: tanpa grant ini, panggilan supabase.rpc(...) dari klien akan gagal (403/404).
grant execute on function public.set_transaction_status(uuid, text) to authenticated;

-- Cabut akses publik anon untuk keamanan (opsional tapi disarankan).
revoke execute on function public.set_transaction_status(uuid, text) from anon;
