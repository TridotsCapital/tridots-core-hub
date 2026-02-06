-- Create storage bucket for invoice files (boletos, PDFs, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload to invoices bucket
CREATE POLICY "Allow authenticated uploads to invoices" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Policy: Allow public read access to invoice files
CREATE POLICY "Allow public read access to invoices" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices');

-- Policy: Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to invoices" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'invoices');

-- Policy: Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes from invoices" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'invoices');