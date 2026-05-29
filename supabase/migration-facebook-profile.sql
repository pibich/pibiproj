-- =============================================================
-- MIGRATION: Nama Facebook di Profil Publik
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Tambah kolom baru ke profiles
-- (Aman dijalankan kapanpun, kolom baru punya DEFAULT)
--
-- facebook_name   : nama tampilan Facebook user (diisi saat akun
--                   Facebook dihubungkan lewat halaman Pengaturan).
-- facebook_public : apakah nama Facebook tampil di profil publik.
--                   Default true; user dapat menyembunyikannya.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS facebook_name   TEXT NULL,
  ADD COLUMN IF NOT EXISTS facebook_public BOOLEAN NOT NULL DEFAULT true;
