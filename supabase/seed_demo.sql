-- ============================================================
-- SEED DEMO KOPERASI TERANG (untuk live demo / pitching)
-- ============================================================
-- Jalankan MANUAL di Supabase SQL Editor (bukan bagian migrasi otomatis).
-- Prasyarat: migrasi 0001, 0004, 0005 sudah dijalankan, dan sudah ada akun
-- profiles dengan role 'ketua' dan 'bendahara' di koperasi.
--
-- Menghasilkan data realistis: saldo sehat (~Rp57 juta), transaksi bervariasi,
-- 2 pengeluaran > Rp5jt yang MENUNGGU persetujuan (untuk demo multi-sig),
-- dan 1 anomali AI yang belum ditinjau (untuk demo Watchdog).
--
-- Catatan: jika trigger pg_net aktif, insert ini akan memicu edge function
-- (hash-batch & anomaly-detect) per baris. Itu tidak masalah. Kalau ingin data
-- 100% terkontrol, nonaktifkan trigger sementara saat menjalankan seed ini.

truncate table anomaly_flags, approvals, audit_log, transactions restart identity cascade;

do $$
declare
  v_kop uuid; v_ketua uuid; v_bendahara uuid; v_tx uuid;
begin
  select id into v_kop from koperasi order by created_at limit 1;
  select id into v_ketua     from profiles where koperasi_id = v_kop and role = 'ketua'     limit 1;
  select id into v_bendahara from profiles where koperasi_id = v_kop and role = 'bendahara' limit 1;
  if v_ketua is null or v_bendahara is null then
    raise exception 'Buat dulu akun ketua & bendahara di tabel profiles sebelum menjalankan seed.';
  end if;

  -- PEMASUKAN (disetujui)
  insert into transactions (koperasi_id, type, amount, description, category, created_by, status, created_at, batch_hash) values
   (v_kop,'masuk',40000000,'Modal awal & simpanan pokok pendirian koperasi','Simpanan',v_bendahara,'approved', now()-interval '38 days', encode(digest('kt1','sha256'),'hex')),
   (v_kop,'masuk', 6250000,'Simpanan wajib anggota, periode Mei 2026','Simpanan',v_bendahara,'approved', now()-interval '30 days', encode(digest('kt2','sha256'),'hex')),
   (v_kop,'masuk', 2750000,'Simpanan sukarela, Ibu Sri Wahyuni','Simpanan',v_bendahara,'approved', now()-interval '27 days', encode(digest('kt3','sha256'),'hex')),
   (v_kop,'masuk', 4680000,'Pendapatan penjualan pupuk unit tani','Operasional',v_ketua,'approved', now()-interval '24 days', encode(digest('kt4','sha256'),'hex')),
   (v_kop,'masuk', 6400000,'Simpanan wajib anggota, periode Juni 2026','Simpanan',v_bendahara,'approved', now()-interval '20 days', encode(digest('kt5','sha256'),'hex')),
   (v_kop,'masuk', 1850000,'Pendapatan sewa hand tractor koperasi','Operasional',v_bendahara,'approved', now()-interval '16 days', encode(digest('kt6','sha256'),'hex')),
   (v_kop,'masuk', 2300000,'Angsuran pinjaman masuk, Pak Darto','Pinjaman',v_bendahara,'approved', now()-interval '12 days', encode(digest('kt7','sha256'),'hex')),
   (v_kop,'masuk', 6550000,'Simpanan wajib anggota, periode Juli 2026','Simpanan',v_bendahara,'approved', now()-interval '6 days', encode(digest('kt8','sha256'),'hex')),
   (v_kop,'masuk', 3420000,'Pendapatan penjualan sembako unit toko','Operasional',v_ketua,'approved', now()-interval '3 days', encode(digest('kt9','sha256'),'hex'));

  -- PENGELUARAN kecil (< Rp5jt, disetujui otomatis)
  insert into transactions (koperasi_id, type, amount, description, category, created_by, status, created_at, batch_hash) values
   (v_kop,'keluar',4500000,'Pinjaman modal warung, Ibu Ani','Pinjaman',v_bendahara,'approved', now()-interval '22 days', encode(digest('kt10','sha256'),'hex')),
   (v_kop,'keluar', 385000,'Pembelian ATK & buku administrasi','Operasional',v_bendahara,'approved', now()-interval '19 days', encode(digest('kt11','sha256'),'hex')),
   (v_kop,'keluar',3000000,'Pinjaman biaya tani, Pak Joko','Pinjaman',v_ketua,'approved', now()-interval '15 days', encode(digest('kt12','sha256'),'hex')),
   (v_kop,'keluar', 465000,'Pembayaran listrik & internet kantor','Operasional',v_bendahara,'approved', now()-interval '10 days', encode(digest('kt13','sha256'),'hex')),
   (v_kop,'keluar',4200000,'Pembelian stok pupuk untuk dijual kembali','Operasional',v_bendahara,'approved', now()-interval '8 days', encode(digest('kt14','sha256'),'hex')),
   (v_kop,'keluar',2500000,'Pinjaman pendidikan anak, Bu Rina','Pinjaman',v_bendahara,'approved', now()-interval '5 days', encode(digest('kt15','sha256'),'hex')),
   (v_kop,'keluar',1750000,'Pinjaman darurat kesehatan, Pak Umar','Pinjaman',v_ketua,'approved', now()-interval '2 days', encode(digest('kt16','sha256'),'hex'));

  -- PENGELUARAN besar (> Rp5jt) → MENUNGGU persetujuan multi-sig
  insert into transactions (koperasi_id, type, amount, description, category, created_by, status, created_at, batch_hash) values
   (v_kop,'keluar', 8500000,'Pembelian mesin penggiling padi (unit usaha baru)','Operasional',v_bendahara,'pending', now()-interval '1 days', encode(digest('kt17','sha256'),'hex')),
   (v_kop,'keluar',12750000,'Renovasi & perluasan kios koperasi','Operasional',v_bendahara,'pending', now()-interval '4 hours', encode(digest('kt18','sha256'),'hex'));

  -- ANOMALI untuk Watchdog (belum ditinjau)
  select id into v_tx from transactions
    where koperasi_id = v_kop and description = 'Pembelian stok pupuk untuk dijual kembali' limit 1;
  insert into anomaly_flags (transaction_id, flagged_by, source, reason, reviewed) values
   (v_tx, null, 'ai', 'Nominal pembelian stok 3x lebih tinggi dari rata-rata pengeluaran operasional 3 bulan terakhir. Perlu verifikasi nota pembelian.', false);

  raise notice 'Seed demo selesai. Saldo perkiraan +Rp57.400.000, 2 transaksi menunggu persetujuan, 1 anomali.';
end $$;
