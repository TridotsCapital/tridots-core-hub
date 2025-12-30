-- Add new status values to analysis_status enum
ALTER TYPE analysis_status ADD VALUE IF NOT EXISTS 'aguardando_pagamento';
ALTER TYPE analysis_status ADD VALUE IF NOT EXISTS 'ativo';

-- Enable realtime for analyses table
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;

-- Create analysis_documents table for file uploads
CREATE TABLE IF NOT EXISTS public.analysis_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analysis_documents
ALTER TABLE public.analysis_documents ENABLE ROW LEVEL SECURITY;

-- Team members can view documents
CREATE POLICY "Team members can view documents"
ON public.analysis_documents
FOR SELECT
USING (has_any_role(auth.uid()));

-- Team members can upload documents
CREATE POLICY "Team members can upload documents"
ON public.analysis_documents
FOR INSERT
WITH CHECK (has_any_role(auth.uid()) AND uploaded_by = auth.uid());

-- Masters can delete documents
CREATE POLICY "Masters can delete documents"
ON public.analysis_documents
FOR DELETE
USING (is_master(auth.uid()));

-- Create storage bucket for analysis documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-documents', 'analysis-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for analysis-documents bucket
CREATE POLICY "Team members can view analysis documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'analysis-documents' AND has_any_role(auth.uid()));

CREATE POLICY "Team members can upload analysis documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'analysis-documents' AND has_any_role(auth.uid()));

CREATE POLICY "Masters can delete analysis documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'analysis-documents' AND is_master(auth.uid()));