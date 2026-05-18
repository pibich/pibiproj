-- =============================================================
-- MIGRATION: Notifications + Positive Ratings + Transaction Confirm
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tambah kolom positive rating ke profiles
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS successful_purchases INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_sales     INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 2. Tambah kolom transaction confirmation ke auctions
-- ─────────────────────────────────────────────────────────────
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS transaction_confirmed BOOLEAN NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- 3. Buat tabel notifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
                CHECK (type IN ('auction_won','auction_ended','transaction_confirmed')),
  auction_id  UUID REFERENCES auctions(id) ON DELETE CASCADE,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, type, auction_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read)
  WHERE is_read = false;

-- ─────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_authenticated"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 5. Enable Realtime (jalankan TERPISAH, bukan dalam transaksi)
-- ─────────────────────────────────────────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- Atau aktifkan via: Dashboard → Database → Replication → Tables
