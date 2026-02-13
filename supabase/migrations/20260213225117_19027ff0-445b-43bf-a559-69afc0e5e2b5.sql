-- Make chat-attachments bucket public so getPublicUrl() works
UPDATE storage.buckets SET public = true WHERE id = 'chat-attachments';

-- Ensure agency users can SELECT from chat-attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Agency users can view chat attachments'
  ) THEN
    CREATE POLICY "Agency users can view chat attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-attachments');
  END IF;
END $$;