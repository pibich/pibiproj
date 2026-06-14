-- =============================================================
-- MIGRATION: Ulasan Pembeli untuk Penjual (Seller Reviews)
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabel reviews
--    Satu ulasan per transaksi yang sudah selesai (buyer → seller).
--    receipt_photo_url di-snapshot dari transaksi saat insert agar bisa
--    ditampilkan publik tanpa bergantung pada RLS tabel transactions.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID        NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  auction_id        UUID        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  seller_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating            INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  receipt_photo_url TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Satu ulasan per transaksi
  UNIQUE (transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews (seller_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Ulasan bersifat publik (reputasi penjual) — siapapun bisa membaca
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (true);

-- INSERT hanya oleh buyer dari transaksi yang berstatus 'completed'
DROP POLICY IF EXISTS "reviews_insert_buyer_completed" ON reviews;
CREATE POLICY "reviews_insert_buyer_completed"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id
        AND t.buyer_id = auth.uid()
        AND t.status = 'completed'
    )
  );

-- UPDATE hanya pemilik ulasan (buyer), mis. untuk memperbaiki teks
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE
  USING (auth.uid() = buyer_id);
