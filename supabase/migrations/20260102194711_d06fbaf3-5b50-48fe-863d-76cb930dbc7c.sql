-- Add logo_url column to agencies table
ALTER TABLE public.agencies 
ADD COLUMN logo_url TEXT DEFAULT NULL;

-- Create storage bucket for agency logos (public for viewing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true);

-- RLS Policies for agency-logos bucket

-- Anyone can view agency logos (public bucket)
CREATE POLICY "Agency logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'agency-logos');

-- Agency users can upload their own agency logo
CREATE POLICY "Agency users can upload their agency logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'agency-logos' 
  AND auth.uid() IS NOT NULL
  AND is_agency_user(auth.uid())
  AND (storage.foldername(name))[1] = get_user_agency_id(auth.uid())::text
);

-- Agency users can update their own agency logo
CREATE POLICY "Agency users can update their agency logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'agency-logos' 
  AND auth.uid() IS NOT NULL
  AND is_agency_user(auth.uid())
  AND (storage.foldername(name))[1] = get_user_agency_id(auth.uid())::text
);

-- Agency users can delete their own agency logo
CREATE POLICY "Agency users can delete their agency logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'agency-logos' 
  AND auth.uid() IS NOT NULL
  AND is_agency_user(auth.uid())
  AND (storage.foldername(name))[1] = get_user_agency_id(auth.uid())::text
);

-- Masters can manage all agency logos
CREATE POLICY "Masters can manage all agency logos"
ON storage.objects
FOR ALL
USING (bucket_id = 'agency-logos' AND is_master(auth.uid()));