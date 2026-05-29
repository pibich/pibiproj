-- ============================================================
-- RESET TOTAL: HAPUS SEMUA LELANG + SEMUA USER
-- ============================================================
--  PERINGATAN: Operasi ini PERMANEN dan TIDAK BISA DIBATALKAN.
--  Jalankan HANYA di environment development / testing.
--
--  Cara pakai:
--    Supabase Dashboard → SQL Editor → tempel seluruh isi file ini → Run.
--    (SQL Editor berjalan sebagai service role, jadi bisa menghapus auth.users.)
--
--  Yang DIPERTAHANKAN: tabel `categories` (data referensi kategori lelang).
--  Yang DIHAPUS      : semua data transaksi/lelang/user + akun login.
--
--  Setelah ini, hapus juga file di Storage secara manual bila perlu
--  (bucket: auction-images, avatars, transaction-proofs) — lihat bagian akhir.
-- ============================================================

BEGIN;

-- 1) Tabel anak yang mereferensikan auctions / profiles — hapus lebih dulu
DELETE FROM transactions;     -- escrow middleman (ref: auctions, profiles)
DELETE FROM buyer_warnings;   -- peringatan pembeli (ref: profiles, auctions)
DELETE FROM bids;             -- penawaran (ref: auctions, profiles)
DELETE FROM notifications;    -- notifikasi (ref: profiles, auctions)
DELETE FROM reports;          -- laporan pengguna (ref: profiles, auctions)
DELETE FROM watchlist;        -- watchlist (ref: profiles, auctions)
DELETE FROM chatbot_usage;    -- kuota chatbot per user (ref: profiles)

-- 2) Lelang
DELETE FROM auctions;

-- 3) Daftar blacklist (mereferensikan/menyimpan user yang akan dihapus)
DELETE FROM blacklist;

-- 4) Profil publik
DELETE FROM profiles;

-- 5) Akun login — menghapus auth.users akan ikut menghapus
--    auth.identities / auth.sessions via cascade internal Supabase.
DELETE FROM auth.users;

COMMIT;

-- ============================================================
-- (OPSIONAL) Bersihkan file di Storage
-- ------------------------------------------------------------
-- Jalankan TERPISAH bila ingin menghapus gambar lelang, avatar,
-- dan bukti transaksi. Mengosongkan metadata objek:
--
--   DELETE FROM storage.objects
--   WHERE bucket_id IN ('auction-images', 'avatars', 'transaction-proofs');
--
-- Catatan: ini menghapus catatan objek; file fisik akan ikut hilang.
-- Sesuaikan nama bucket dengan yang ada di proyek Anda.
-- ============================================================
