-- =============================================================
-- FIX: Drop stale database triggers/functions that reference
--      the old 'violation_count' column (already removed from
--      the profiles table).  Running this script stops the
--      "column violation_count does not exist" error that appears
--      when an admin approves a report.
--
-- Safe to run multiple times (all DROPs use IF EXISTS).
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Drop all triggers on the 'reports' table.
--    Any trigger whose function body references violation_count
--    will cause the approval PATCH to fail.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table   = 'reports'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON reports', r.trigger_name);
    RAISE NOTICE 'Dropped trigger % on reports', r.trigger_name;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Drop any public functions whose body still references
--    violation_count (covers trigger functions for profiles too).
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      p.proname                                          AS fname,
      pg_get_function_identity_arguments(p.oid)         AS fargs
    FROM pg_proc      p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind  = 'f'   -- regular functions only; excludes aggregates (a), procedures (p), window fns (w)
      AND pg_get_functiondef(p.oid) ILIKE '%violation_count%'
  LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
      r.fname, r.fargs
    );
    RAISE NOTICE 'Dropped function %(%)', r.fname, r.fargs;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Drop the named trigger from the earlier migration (idempotent).
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_violation_count_change ON profiles;

-- ─────────────────────────────────────────────────────────────
-- 4. Ensure violation_count is fully removed from profiles.
--    CASCADE handles dependent views/constraints.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles DROP COLUMN IF EXISTS violation_count CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 5. Verify warning system columns exist (add if missing).
--    These should already be present from migration-rating-middleman.sql
--    but we guard with IF NOT EXISTS for safety.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS buyer_warning_count INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_timeout_until TIMESTAMPTZ          NULL,
  ADD COLUMN IF NOT EXISTS is_middleman        BOOLEAN     NOT NULL DEFAULT false;
