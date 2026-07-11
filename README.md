# Koperasi Terang

**Platform Transparansi & Akuntabilitas Radikal untuk Koperasi Desa**
Hackathon Digital Cooperatives Expo 2026 — Kementerian Koperasi RI

---

## Problem Statement

Koperasi desa sering kehilangan kepercayaan anggota karena minimnya transparansi
pengelolaan kas: transaksi tidak tercatat rapi, keputusan besar diambil sepihak,
dan anggota tidak punya cara mudah untuk mengawasi. Koperasi Terang menjawab ini
dengan tiga pilar teknis: **audit trail immutable**, **persetujuan multi-signature**,
dan **watchdog dashboard** yang bisa diakses semua anggota.

## Arsitektur

```
Next.js 14 (App Router) ──► Supabase (Postgres + Auth + Realtime + RLS)
        │                           │
        │                           ├─► Edge Function: hash-batch
        │                           │     (chaining SHA-256 antar transaksi,
        │                           │      memberi bukti kriptografis anti-tamper)
        │                           │
        │                           └─► Edge Function: anomaly-detect
        │                                 (memanggil Claude API untuk menilai
        │                                  transaksi baru vs pola historis)
        │
        └──► Row Level Security memastikan:
              - Semua anggota koperasi bisa MELIHAT semua transaksi (transparansi)
              - Hanya Ketua/Bendahara bisa MENCATAT transaksi baru
              - TIDAK ADA siapapun yang bisa UPDATE/DELETE transaksi (immutability
                ditegakkan di level database, bukan cuma di aplikasi)
```

### Kenapa immutable?
Tabel `transactions` sengaja tidak punya RLS policy untuk `UPDATE`/`DELETE` —
secara default Postgres RLS menolak semua operasi yang tidak ada policy-nya.
Koreksi kesalahan pencatatan dilakukan lewat **entri baru** yang mereferensikan
transaksi asal (`correction_of`), sehingga jejak sejarah aslinya tetap utuh dan
terlihat oleh semua anggota.

### Kenapa multi-signature?
Transaksi di atas Rp 5.000.000 butuh minimal 2 dari 3 persetujuan (Ketua,
Bendahara, Pengawas) sebelum berstatus `approved`. Ini mencegah keputusan
finansial besar diambil sepihak oleh satu orang pengurus.

### Kenapa ada AI anomaly detection?
Watchdog manual (anggota menandai transaksi mencurigakan) digabung dengan
deteksi otomatis: setiap transaksi baru dikirim ke Claude bersama 30 transaksi
historis koperasi tersebut, untuk menilai apakah nominal/kategori/frekuensinya
janggal dibanding kebiasaan. Ini membantu koperasi dengan pengawas yang tidak
selalu sempat memeriksa satu-per-satu.

## Instalasi

### 1. Clone & install dependencies
```bash
git clone <repo-url>
cd koperasi-terang
npm install
```

### 2. Setup Supabase
1. Buat project baru di [supabase.com](https://supabase.com)
2. Jalankan migrasi schema (URUTAN PENTING):
   ```bash
   npx supabase db push
   # atau paste berurutan ke SQL Editor Supabase:
   #   supabase/migrations/0001_schema.sql      (tabel, RLS, view saldo)
   #   supabase/migrations/0004_governance.sql  (RPC + tata kelola v2 — WAJIB)
   #
   # Catatan: 0004 sudah mencakup & menyempurnakan 0003 (RPC set_transaction_status),
   # jadi untuk DB baru cukup jalankan 0001 lalu 0004. Kalau DB lama Anda sudah
   # menjalankan 0003, cukup jalankan 0004 saja untuk meng-upgrade.
   ```
   > **Penting:** `0004_governance.sql` membuat RPC `set_transaction_status` &
   > `review_anomaly` (SECURITY DEFINER + `grant execute ... to authenticated`),
   > menambah peran `sekretaris`, status `cancelled`, dan kebijakan separation of
   > duties (penginput tidak bisa menyetujui / menandai anomali transaksinya sendiri).
   > Tanpa migrasi ini, perubahan status gagal diam-diam karena tabel `transactions`
   > sengaja tidak punya policy UPDATE (immutability by omission).
2b. Aktifkan Realtime agar dashboard update tanpa refresh:
   Supabase Dashboard → Database → Replication → publication `supabase_realtime`,
   centang tabel `transactions`, `approvals`, dan `anomaly_flags`.
3. Deploy edge functions:
   ```bash
   npx supabase functions deploy hash-batch
   npx supabase functions deploy anomaly-detect
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```
4. Buat user demo lewat Supabase Dashboard → Authentication → Add User.
   Untuk mendemokan multi-sig separation of duties, buat minimal 5 akun:
   `ketua`, `bendahara`, `sekretaris` (pengurus), `pengawas`, `anggota`,
   dan opsional satu `dinas` untuk juri.
5. Isi `supabase/migrations/0002_seed_template.sql` dengan UUID user yang baru
   dibuat, lalu jalankan di SQL Editor.

### 3. Environment variables
```bash
cp .env.local.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
# dari Supabase Dashboard → Project Settings → API
```

### 4. Jalankan
```bash
npm run dev
```
Buka `http://localhost:3000` — akan redirect ke halaman login.

## Kredensial Demo untuk Juri

_Isi setelah seed data dibuat:_
- Ketua: `ketua@koperasiterang.demo` 
- Bendahara: `bendahara@koperasiterang.demo`
- Sekretaris: `sekretaris@koperasiterang.demo`
- Pengawas: `pengawas@koperasiterang.demo`
- Anggota: `anggota@koperasiterang.demo`
- Peninjau (role dinas): `juri@koperasiterang.demo`

Semua akun menggunakan password `Demo123!`

**Alur demo separation of duties:** login sebagai *bendahara* → catat pengeluaran
> Rp 5.000.000 (masuk antrian). Lalu *ketua* + *sekretaris* (atau *pengawas*)
menyetujui, bendahara sebagai penginput sengaja tidak bisa ikut menyetujui.
Setelah 2 setuju, transaksi otomatis "Disetujui", hilang dari antrian, dan saldo
dashboard ter-update.

## Skalabilitas & Dampak

Target pembeli utama adalah **Dinas Koperasi Kabupaten/Kota**, bukan koperasi
individual. Mereka bisa memantau kesehatan seluruh koperasi binaan dalam satu
dashboard (role `dinas` sudah punya akses lintas-koperasi via RLS policy). Model
ini bisa diintegrasikan sebagai modul tambahan di atas SIMKOPDES yang sudah ada,
tanpa menggantikan sistem eksisting.

## Deklarasi Penggunaan AI (sesuai Aturan Penggunaan AI/IP TOR)

Kami terbuka soal ini. Ide, konsep, dan seluruh keputusan tata kelola Koperasi
Terang murni hasil pemikiran tim, bukan dihasilkan oleh AI. Yang kami putuskan
sendiri antara lain:

- Konsep inti "transparansi radikal" dan tiga pilar: audit trail immutable,
  persetujuan bersama (multi-signature), dan anggota sebagai watchdog.
- Aturan tata kelola: hanya ketua dan bendahara yang boleh mencatat, penginput
  tidak boleh menyetujui transaksinya sendiri, satu penolakan langsung
  membatalkan, uang masuk tidak butuh persetujuan tetapi yang besar ditandai
  untuk ditinjau pengawas, dan pembatalan tetap terekam di audit log.
- Model bisnis: pembeli utamanya Dinas Koperasi Kabupaten/Kota, bukan koperasi
  satu per satu.

Kami memakai beberapa alat bantu AI, sesuai yang diizinkan TOR, dengan peran
masing-masing yang kami sebutkan secara terbuka:

- **Kiro AI** (agen pemrograman berbantuan AI): tempat sebagian besar kode
  ditulis, di-debug, dan di-deploy. Riwayat commit di repositori ini
  memperlihatkan proses membangun bersama tersebut secara transparan.
- **Claude (Anthropic)**: model yang menggerakkan agen pemrograman di atas,
  sekaligus dipakai sebagai mesin deteksi anomali di dalam aplikasi (edge
  function `anomaly-detect`).
- **Gemini (Google)**: dipakai untuk diskusi, review, dan kritik, misalnya
  menemukan isu kualitas data demo dan kejanggalan saldo.

Cakupan bantuan AI: menulis dan merapikan kode (Next.js, SQL/RLS Supabase,
komponen UI), debugging (mis. memperbaiki bug status persetujuan dan kegagalan
build), penyusunan dokumentasi teknis, serta diskusi dan pengujian ide.

Setiap keluaran AI kami tinjau, uji, dan sesuaikan dengan kebutuhan koperasi
desa. Tidak ada gagasan inti yang kami ambil mentah-mentah dari AI. Kami siap
mempertanggungjawabkan seluruh keputusan desain pada sesi tanya jawab dan live
defense.
