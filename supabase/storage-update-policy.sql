-- Jalankan di Supabase Dashboard → SQL Editor
-- Tambah UPDATE policy agar user bisa overwrite/upsert file miliknya sendiri

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
