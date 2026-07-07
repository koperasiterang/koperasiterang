-- ============================================================
-- SEED DATA — untuk demo ke juri
-- Jalankan SETELAH membuat user via Supabase Auth (email/password),
-- lalu isi UUID user tersebut ke variabel di bawah.
-- ============================================================

-- 1. Buat koperasi contoh
insert into koperasi (id, nama, wilayah, nik_ketua) values
  ('00000000-0000-0000-0000-000000000001', 'Koperasi Desa Makmur Jaya', 'Kab. Bogor', '3201xxxxxxxxxxxx');

-- 2. Hubungkan profile ke user yang sudah dibuat lewat Supabase Auth Dashboard.
--    Ganti 'AUTH_USER_UUID_KETUA' dkk dengan UUID asli dari auth.users setelah signup.
--
-- insert into profiles (id, koperasi_id, full_name, role) values
--   ('AUTH_USER_UUID_KETUA', '00000000-0000-0000-0000-000000000001', 'Budi Santoso', 'ketua'),
--   ('AUTH_USER_UUID_BENDAHARA', '00000000-0000-0000-0000-000000000001', 'Siti Aminah', 'bendahara'),
--   ('AUTH_USER_UUID_ANGGOTA', '00000000-0000-0000-0000-000000000001', 'Joko Wijaya', 'anggota'),
--   ('AUTH_USER_UUID_JURI', '00000000-0000-0000-0000-000000000001', 'Dewan Juri', 'dinas');

-- 3. Transaksi contoh (jalankan setelah profiles terisi, sesuaikan created_by)
-- insert into transactions (koperasi_id, type, amount, description, category, created_by, status) values
--   ('00000000-0000-0000-0000-000000000001', 'masuk', 2500000, 'Simpanan wajib anggota bulan Juli', 'Simpanan', 'AUTH_USER_UUID_BENDAHARA', 'approved'),
--   ('00000000-0000-0000-0000-000000000001', 'keluar', 8000000, 'Pembelian pupuk untuk unit usaha pertanian', 'Operasional', 'AUTH_USER_UUID_KETUA', 'pending');
