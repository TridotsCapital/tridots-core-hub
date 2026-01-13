-- 1. Add new ticket category for link requests
ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'solicitacao_link';

-- 2. Ensure updated_at column exists on analyses with auto-update trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE analyses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create or replace function for updated_at trigger
CREATE OR REPLACE FUNCTION update_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_analyses_updated_at ON analyses;
CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_analyses_updated_at();

-- 3. Storage policies for user-avatars bucket
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- 4. Storage policies for agency-logos bucket
DROP POLICY IF EXISTS "Agency users can upload logo" ON storage.objects;
CREATE POLICY "Agency users can upload logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agency-logos' AND
  EXISTS (
    SELECT 1 FROM agency_users au
    WHERE au.user_id = auth.uid()
    AND au.agency_id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Agency users can update logo" ON storage.objects;
CREATE POLICY "Agency users can update logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agency-logos' AND
  EXISTS (
    SELECT 1 FROM agency_users au
    WHERE au.user_id = auth.uid()
    AND au.agency_id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Agency users can delete logo" ON storage.objects;
CREATE POLICY "Agency users can delete logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agency-logos' AND
  EXISTS (
    SELECT 1 FROM agency_users au
    WHERE au.user_id = auth.uid()
    AND au.agency_id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agency-logos');