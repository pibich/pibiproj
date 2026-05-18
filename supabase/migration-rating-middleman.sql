-- =============================================================
-- MIGRATION: Sistem Rating + Middleman (Pengganti Blacklist)
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PANDUAN: Membuat akun admin pertama
-- Jalankan dua query di bawah ini secara terpisah
-- ─────────────────────────────────────────────────────────────

-- Langkah 1: Cari UUID akun Anda
-- SELECT p.id, p.username, u.email
-- FROM profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE u.email = 'email-anda@contoh.com';

-- Langkah 2: Set role admin (ganti nilai id dengan UUID dari langkah 1)
-- UPDATE profiles SET role = 'admin' WHERE id = 'uuid-dari-langkah-1';

-- Setelah logout dan login kembali, link "Admin Panel" akan muncul di navbar.
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- FASE 1A — Tambah kolom baru ke profiles
-- (Aman dijalankan kapanpun, kolom baru punya DEFAULT)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS buyer_warning_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_timeout_until  TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS is_middleman         BOOLEAN NOT NULL DEFAULT false;

-- (Seed dari violation_count dihapus — kolom tersebut sudah tidak ada)


-- ─────────────────────────────────────────────────────────────
-- FASE 1B — Hapus sisa sistem blacklist
-- JALANKAN HANYA SETELAH kode baru sudah di-deploy dan berjalan
-- ─────────────────────────────────────────────────────────────

-- Hapus tabel blacklist
DROP TABLE IF EXISTS blacklist;

-- Hapus fungsi lama (dipakai saat signup)
DROP FUNCTION IF EXISTS check_blacklist_on_signup(p_email text, p_phone text);

-- Hapus trigger yang bergantung pada violation_count (jika ada)
DROP TRIGGER IF EXISTS on_violation_count_change ON profiles;

-- Hapus kolom lama dari profiles
ALTER TABLE profiles
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS violation_count CASCADE;
