-- =============================================================
-- MIGRATION: Admin Auction Approval Workflow
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tambah status baru ke kolom status auctions
--    status disimpan sebagai TEXT dengan CHECK constraint
-- ─────────────────────────────────────────────────────────────

ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_status_check;
ALTER TABLE auctions ADD CONSTRAINT auctions_status_check CHECK (
  status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'active'::text, 'closed'::text, 'completed'::text, 'cancelled'::text, 'rejected'::text])
);

-- ─────────────────────────────────────────────────────────────
-- 2. Tambah kolom admin_note untuk alasan penolakan
-- ─────────────────────────────────────────────────────────────
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS admin_note TEXT DEFAULT NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. Tambah tipe notifikasi baru untuk approval/rejection
--    Sesuaikan nama constraint jika berbeda di database Anda
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'auction_won',
    'auction_ended',
    'transaction_confirmed',
    'awaiting_shipment',
    'shipping_proof_submitted',
    'delivery_confirmed',
    'funds_released',
    'confirmation_expired',
    'auction_approved',
    'auction_rejected'
  )
);
