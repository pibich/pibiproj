-- ============================================================
-- CLEAR DATA LELANG (USER TETAP UTUH)
-- Hapus semua data lelang/transaksi/bid/notifikasi, TANPA menghapus user.
-- Jalankan di Supabase Dashboard → SQL Editor.
--
-- Untuk reset TOTAL (termasuk semua user + akun login), gunakan
-- file `reset-all-data.sql`.
-- ============================================================

BEGIN;

-- Urutan penting: hapus tabel anak yang mereferensikan auctions lebih dulu.
DELETE FROM transactions;     -- escrow middleman (ref: auctions)
DELETE FROM buyer_warnings;   -- peringatan pembeli (ref: auctions)
DELETE FROM bids;             -- penawaran (ref: auctions)
DELETE FROM notifications;    -- notifikasi (ref: auctions)
DELETE FROM reports;          -- laporan (ref: auctions)
DELETE FROM watchlist;        -- watchlist (ref: auctions)

-- Terakhir: lelang itu sendiri.
DELETE FROM auctions;

COMMIT;
