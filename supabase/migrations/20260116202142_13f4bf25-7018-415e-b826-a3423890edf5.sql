-- Add columns for Contrato Administrativo document
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_path text,
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_name text,
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_status text DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_feedback text,
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_uploaded_at timestamptz;