-- Jalankan file ini di Supabase Dashboard → SQL Editor

-- Upload: user hanya bisa upload ke folder /{uid}/...
CREATE POLICY "Users can upload their own auction images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'auction-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: user hanya bisa hapus file miliknya sendiri
CREATE POLICY "Users can delete their own auction images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'auction-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
