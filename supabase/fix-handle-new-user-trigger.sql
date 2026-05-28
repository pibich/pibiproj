-- =============================================================
-- FIX: Recreate handle_new_user trigger tanpa referensi ke
--      check_blacklist_on_signup (fungsi tersebut sudah dihapus).
--
-- Error yang diperbaiki: "Database error saving new user"
-- saat registrasi akun baru.
--
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

-- Pastikan trigger terpasang (drop dulu jika sudah ada)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
