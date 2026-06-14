-- ============================================================
-- CLEAR ALL DEVELOPMENT DATA
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Hapus semua bids
DELETE FROM bids;

-- 2. Hapus semua notifikasi
DELETE FROM notifications;

-- 3. Hapus semua reports
DELETE FROM reports;

-- 4. Hapus semua auctions (bids, notif, reports sudah dihapus duluan)
DELETE FROM auctions;
