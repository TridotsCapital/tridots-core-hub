-- Criar enum para tipos de documentos da agência
CREATE TYPE public.agency_document_type AS ENUM (
  'cartao_cnpj',
  'certidao_creci',
  'documento_socio',
  'contrato_social',
  'termo_aceite_assinado'
);

-- Criar enum para status de documentos da agência (mesmo padrão de contratos)
CREATE TYPE public.agency_document_status AS ENUM (
  'pendente',
  'enviado',
  'aprovado',
  'rejeitado'
);

-- Criar tabela agency_documents
CREATE TABLE public.agency_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  document_type public.agency_document_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  status public.agency_document_status NOT NULL DEFAULT 'enviado',
  feedback TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_agency_document_type UNIQUE (agency_id, document_type)
);

-- Adicionar novos campos na tabela agencies
ALTER TABLE public.agencies 
ADD COLUMN creci_numero TEXT,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Habilitar RLS
ALTER TABLE public.agency_documents ENABLE ROW LEVEL SECURITY;

-- Política para usuários da agência visualizarem seus documentos
CREATE POLICY "Agency users can view their documents" 
ON public.agency_documents 
FOR SELECT 
USING (
  agency_id IN (SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'analyst')
);

-- Política para usuários da agência inserirem documentos
CREATE POLICY "Agency users can insert their documents" 
ON public.agency_documents 
FOR INSERT 
WITH CHECK (
  agency_id IN (SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid())
);

-- Política para usuários da agência atualizarem seus documentos (reenvio)
CREATE POLICY "Agency users can update their documents" 
ON public.agency_documents 
FOR UPDATE 
USING (
  agency_id IN (SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid())
);

-- Política para masters/analysts revisarem documentos
CREATE POLICY "Masters can manage all agency documents" 
ON public.agency_documents 
FOR ALL 
USING (
  public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'analyst')
);

-- Política para masters/analysts deletarem documentos
CREATE POLICY "Agency users can delete their documents" 
ON public.agency_documents 
FOR DELETE 
USING (
  agency_id IN (SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'master')
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agency_documents_updated_at
BEFORE UPDATE ON public.agency_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para documentos de agência
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency-documents',
  'agency-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Políticas de storage para o bucket agency-documents
CREATE POLICY "Agency users can upload their documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'agency-documents' 
  AND (
    (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.agency_users WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'master')
  )
);

CREATE POLICY "Agency users can view their documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'agency-documents' 
  AND (
    (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.agency_users WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'master')
    OR public.has_role(auth.uid(), 'analyst')
  )
);

CREATE POLICY "Agency users can update their documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'agency-documents' 
  AND (
    (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.agency_users WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'master')
  )
);

CREATE POLICY "Agency users can delete their documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'agency-documents' 
  AND (
    (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.agency_users WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'master')
  )
);

-- Função para notificar quando documento de agência é enviado
CREATE OR REPLACE FUNCTION public.notify_agency_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  master_record RECORD;
  agency_name TEXT;
  doc_label TEXT;
BEGIN
  -- Buscar nome da agência
  SELECT COALESCE(nome_fantasia, razao_social) INTO agency_name
  FROM public.agencies WHERE id = NEW.agency_id;
  
  -- Traduzir tipo do documento
  doc_label := CASE NEW.document_type
    WHEN 'cartao_cnpj' THEN 'Cartão CNPJ'
    WHEN 'certidao_creci' THEN 'Certidão do CRECI'
    WHEN 'documento_socio' THEN 'Documento do Sócio'
    WHEN 'contrato_social' THEN 'Contrato Social'
    WHEN 'termo_aceite_assinado' THEN 'Termo de Aceite Assinado'
  END;
  
  -- Notificar todos os masters
  FOR master_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'master'
  LOOP
    INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
    VALUES (
      master_record.user_id,
      'agency_document',
      'imobiliarias',
      NEW.agency_id,
      'Novo documento enviado',
      'A imobiliária "' || agency_name || '" enviou: ' || doc_label,
      jsonb_build_object(
        'agency_id', NEW.agency_id,
        'document_type', NEW.document_type::TEXT,
        'doc_label', doc_label,
        'agency_name', agency_name
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar upload de documentos
CREATE TRIGGER notify_agency_document_upload_trigger
AFTER INSERT ON public.agency_documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_agency_document_upload();

-- Função para notificar imobiliária sobre rejeição de documento
CREATE OR REPLACE FUNCTION public.notify_agency_document_rejected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  agency_user RECORD;
  doc_label TEXT;
BEGIN
  -- Só notifica se status mudou para rejeitado
  IF NEW.status = 'rejeitado' AND (OLD.status IS NULL OR OLD.status != 'rejeitado') THEN
    doc_label := CASE NEW.document_type
      WHEN 'cartao_cnpj' THEN 'Cartão CNPJ'
      WHEN 'certidao_creci' THEN 'Certidão do CRECI'
      WHEN 'documento_socio' THEN 'Documento do Sócio'
      WHEN 'contrato_social' THEN 'Contrato Social'
      WHEN 'termo_aceite_assinado' THEN 'Termo de Aceite Assinado'
    END;
    
    -- Notificar todos os usuários da agência
    FOR agency_user IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user.user_id,
        'agency_document_rejected',
        'imobiliarias',
        NEW.agency_id,
        'Documento rejeitado - ação necessária',
        'O documento "' || doc_label || '" foi rejeitado. ' || COALESCE(NEW.feedback, ''),
        jsonb_build_object(
          'agency_id', NEW.agency_id,
          'document_type', NEW.document_type::TEXT,
          'doc_label', doc_label,
          'feedback', NEW.feedback
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar rejeição
CREATE TRIGGER notify_agency_document_rejected_trigger
AFTER UPDATE ON public.agency_documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_agency_document_rejected();