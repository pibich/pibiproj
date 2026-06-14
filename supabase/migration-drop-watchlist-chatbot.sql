-- ============================================================
-- DROP UNUSED TABLES: watchlist & chatbot_usage
-- Fitur watchlist dan chatbot sudah dihapus dari aplikasi.
-- Jalankan di Supabase SQL Editor.
-- PERINGATAN: ini menghapus tabel beserta seluruh datanya secara permanen.
-- ============================================================

DROP TABLE IF EXISTS public.chatbot_usage;
DROP TABLE IF EXISTS public.watchlist;
