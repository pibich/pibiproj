-- Jalankan di Supabase Dashboard → SQL Editor
-- Memastikan semua 3 policy storage sudah ada (INSERT, DELETE, UPDATE)

-- DROP dulu agar tidak conflict jika sebagian sudah ada
DROP POLICY IF EXISTS "Users can upload their own auction images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own auction images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

-- INSERT: user hanya bisa upload ke folder /{uid}/...
CREATE POLICY "Users can upload their own auction images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'auction-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: user hanya bisa hapus file miliknya sendiri
CREATE POLICY "Users can delete their own auction images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'auction-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: diperlukan agar upsert (overwrite) bisa bekerja
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'auction-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'auction-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
