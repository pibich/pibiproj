-- =============================================================
-- MIGRATION: Sistem Transaksi Middleman dengan Bukti Pengiriman
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Update constraint tipe notifikasi (tambah 4 tipe baru)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'auction_won',
    'auction_ended',
    'transaction_confirmed',
    'awaiting_shipment',
    'shipping_proof_submitted',
    'delivery_confirmed',
    'funds_released'
  ));

-- ─────────────────────────────────────────────────────────────
-- 2. Tabel transactions
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id                UUID        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  seller_id                 UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id                  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  middleman_id              UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  amount                    NUMERIC     NOT NULL,
  tax_bearer                TEXT        NOT NULL DEFAULT 'Buyer'
                              CHECK (tax_bearer IN ('Buyer', 'Seller', 'Buyer & Seller')),
  status                    TEXT        NOT NULL DEFAULT 'awaiting_payment'
                              CHECK (status IN (
                                'awaiting_payment',
                                'awaiting_shipment',
                                'shipped',
                                'delivery_confirmed',
                                'completed',
                                'cancelled'
                              )),
  -- Bukti pengiriman (diisi oleh seller)
  shipping_photo_url        TEXT,
  shipping_tracking_number  TEXT,
  shipping_notes            TEXT,
  shipping_submitted_at     TIMESTAMPTZ,
  -- Bukti penerimaan (diisi oleh buyer)
  receipt_photo_url         TEXT,
  receipt_notes             TEXT,
  receipt_submitted_at      TIMESTAMPTZ,
  -- Channel chat terkait
  stream_channel_id         TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Satu transaksi per lelang
  UNIQUE (auction_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_seller    ON transactions (seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer     ON transactions (buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_middleman ON transactions (middleman_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON transactions (status);

-- ─────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Semua pihak dalam transaksi bisa SELECT
DROP POLICY IF EXISTS "transactions_select_parties" ON transactions;
CREATE POLICY "transactions_select_parties"
  ON transactions FOR SELECT
  USING (
    auth.uid() = seller_id
    OR auth.uid() = buyer_id
    OR auth.uid() = middleman_id
  );

-- Siapapun yang login bisa INSERT (validasi dilakukan di API)
DROP POLICY IF EXISTS "transactions_insert_authenticated" ON transactions;
CREATE POLICY "transactions_insert_authenticated"
  ON transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE hanya oleh pihak yang terlibat (validasi status dilakukan di API)
DROP POLICY IF EXISTS "transactions_update_parties" ON transactions;
CREATE POLICY "transactions_update_parties"
  ON transactions FOR UPDATE
  USING (
    auth.uid() = seller_id
    OR auth.uid() = buyer_id
    OR auth.uid() = middleman_id
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Storage bucket untuk bukti transaksi
-- ─────────────────────────────────────────────────────────────
-- Buat bucket 'transaction-proofs' via Dashboard → Storage → New Bucket
-- PENTING: set Public = TRUE (agar getPublicUrl bekerja)
-- file size limit: 5MB, allowed MIME types: image/*
--
-- Jika bucket sudah dibuat sebagai private, jalankan ini untuk mengubahnya:
--   UPDATE storage.buckets SET public = true WHERE id = 'transaction-proofs';
--
-- Lalu jalankan policy berikut:

-- INSERT: user hanya bisa upload ke folder /{transaction_id}/{uid}/
DROP POLICY IF EXISTS "Users can upload transaction proofs" ON storage.objects;
CREATE POLICY "Users can upload transaction proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transaction-proofs'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- SELECT: allow authenticated reads for transaction-proofs bucket
DROP POLICY IF EXISTS "Authenticated users can view transaction proofs" ON storage.objects;
CREATE POLICY "Authenticated users can view transaction proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'transaction-proofs');

-- DELETE: user hanya bisa hapus file miliknya
DROP POLICY IF EXISTS "Users can delete their own transaction proofs" ON storage.objects;
CREATE POLICY "Users can delete their own transaction proofs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'transaction-proofs'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ─────────────────────────────────────────────────────────────
-- 5. Enable Realtime (jalankan TERPISAH, bukan dalam transaksi)
-- ─────────────────────────────────────────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
-- Atau aktifkan via: Dashboard → Database → Replication → Tables
