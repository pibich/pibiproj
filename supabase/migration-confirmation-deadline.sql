-- ─────────────────────────────────────────────────────────────
-- 1. Tambah confirmation_deadline ke tabel auctions
-- ─────────────────────────────────────────────────────────────
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- 2. Buat tabel buyer_warnings (catatan per-warning dengan note)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buyer_warnings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auction_id   UUID        REFERENCES auctions(id) ON DELETE SET NULL,
  note         TEXT,
  auto_generated BOOLEAN   DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE buyer_warnings ENABLE ROW LEVEL SECURITY;

-- User hanya bisa melihat warning milik sendiri
DROP POLICY IF EXISTS "Users can view own warnings" ON buyer_warnings;
CREATE POLICY "Users can view own warnings"
  ON buyer_warnings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin bisa melihat semua
DROP POLICY IF EXISTS "Admin can view all warnings" ON buyer_warnings;
CREATE POLICY "Admin can view all warnings"
  ON buyer_warnings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Tambah tipe notifikasi baru ke CHECK constraint (jika ada)
-- ─────────────────────────────────────────────────────────────
-- Jika kolom type di notifications menggunakan CHECK constraint,
-- tambahkan nilai baru. Kalau menggunakan TEXT biasa, skip ini.
-- Jalankan query ini dulu untuk cek:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%notifications%type%';
-- Jika ada constraint, hapus dan buat ulang dengan nilai baru.

-- Contoh jika perlu:
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
-- ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
--   CHECK (type IN (
--     'auction_won','auction_ended','transaction_confirmed',
--     'awaiting_shipment','shipping_proof_submitted','delivery_confirmed',
--     'funds_released','confirmation_expired'
--   ));
