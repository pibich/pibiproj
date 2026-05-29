-- =============================================================
-- MIGRATION: Persetujuan Lelang (Auction Approval)
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Lelang baru kini berstatus 'pending_approval' dan harus
-- disetujui admin/middleman sebelum tampil publik (jadi 'active').
-- Penolakan menyimpan alasan di rejection_reason (status 'rejected').
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Kolom baru di auctions (audit + alasan tolak)
--    (Aman dijalankan kapanpun — kolom punya DEFAULT / NULL)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by      UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Tambah nilai status baru: 'pending_approval' & 'rejected'
--    auctions.status adalah TEXT dengan CHECK constraint.
--    Drop & buat ulang constraint dengan daftar lengkap.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_status_check;
ALTER TABLE auctions ADD CONSTRAINT auctions_status_check
  CHECK (status IN (
    'draft','active','closed','completed','cancelled',
    'pending_approval','rejected'
  ));

-- ─────────────────────────────────────────────────────────────
-- 3. Tambah tipe notifikasi baru ke notifications.type CHECK
--    (daftar lengkap = tipe lama + 3 tipe approval)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'auction_won','auction_ended','transaction_confirmed',
    'awaiting_shipment','shipping_proof_submitted','delivery_confirmed',
    'funds_released','confirmation_expired',
    'auction_pending_approval','auction_approved','auction_rejected'
  ));

-- ─────────────────────────────────────────────────────────────
-- 4. (Opsional) Index untuk antrian persetujuan
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auctions_pending_approval
  ON auctions (created_at)
  WHERE status = 'pending_approval';

-- ─────────────────────────────────────────────────────────────
-- Catatan RLS:
-- Update status lelang oleh approver dilakukan lewat service-role
-- (server action), jadi tidak perlu policy UPDATE tambahan.
-- Lelang 'pending_approval'/'rejected' disembunyikan dari listing &
-- halaman detail di level aplikasi (hanya seller + approver yang bisa lihat).
-- ─────────────────────────────────────────────────────────────
