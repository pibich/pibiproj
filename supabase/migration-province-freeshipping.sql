-- =============================================================
-- MIGRATION: Provinsi user + opsi Gratis Ongkir pada lelang
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. profiles.province
--    Provinsi (Indonesia) tempat user berada. Membantu buyer &
--    seller memperkirakan ongkir sebelum bid.
--    Nullable agar baris lama tetap valid; wajib diisi saat
--    registrasi (divalidasi di sisi aplikasi).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS province TEXT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. auctions.free_shipping
--    Apakah seller menanggung ongkir (gratis ongkir).
--    Default false (tidak gratis ongkir).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;
