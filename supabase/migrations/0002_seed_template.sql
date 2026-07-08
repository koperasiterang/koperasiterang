-- ============================================================
-- SEED DATA — untuk demo ke juri
-- Jalankan SETELAH 0001 + 0004, dan setelah membuat user via Supabase Auth
-- (Authentication → Add User). Ganti UUID di bawah dengan User UID asli.
-- ============================================================

-- 1. Buat koperasi contoh
insert into koperasi (id, nama, wilayah, nik_ketua) values
  ('00000000-0000-0000-0000-000000000001', 'Koperasi Desa Makmur Jaya', 'Kab. Bogor', '3201xxxxxxxxxxxx')
on conflict (id) do nothing;

-- 2. Hubungkan profile ke user Auth. Ambil UID dari Authentication → Users.
--    Peran: pengurus (ketua/bendahara/sekretaris) boleh input & menyetujui,
--    pengawas menyetujui + meninjau anomali, anggota read + tandai anomali,
--    dinas read lintas koperasi.
-- insert into profiles (id, koperasi_id, full_name, role) values
--   ('AUTH_UID_KETUA',      '00000000-0000-0000-0000-000000000001', 'Budi Santoso',  'ketua'),
--   ('AUTH_UID_BENDAHARA',  '00000000-0000-0000-0000-000000000001', 'Siti Aminah',   'bendahara'),
--   ('AUTH_UID_SEKRETARIS', '00000000-0000-0000-0000-000000000001', 'Rahmat Hidayat','sekretaris'),
--   ('AUTH_UID_PENGAWAS',   '00000000-0000-0000-0000-000000000001', 'Dewi Lestari',  'pengawas'),
--   ('AUTH_UID_ANGGOTA',    '00000000-0000-0000-0000-000000000001', 'Joko Wijaya',   'anggota'),
--   ('AUTH_UID_JURI',       '00000000-0000-0000-0000-000000000001', 'Dewan Juri',    'dinas')
-- on conflict (id) do nothing;

-- 3. Transaksi contoh (kategori: Simpanan / Pinjaman / Operasional).
--    Sesuaikan created_by dengan UID pengurus.
-- insert into transactions (koperasi_id, type, amount, description, category, created_by, status) values
--   ('00000000-0000-0000-0000-000000000001', 'masuk', 2500000, 'Simpanan wajib anggota bulan Juli', 'Simpanan', 'AUTH_UID_BENDAHARA', 'approved'),
--   ('00000000-0000-0000-0000-000000000001', 'keluar', 8000000, 'Pembelian pupuk unit usaha tani', 'Operasional', 'AUTH_UID_KETUA', 'pending');
