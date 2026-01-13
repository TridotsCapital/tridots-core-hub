-- 1. Adicionar colunas para o Contrato Administrativo
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_name TEXT,
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_path TEXT,
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS doc_contrato_administrativo_feedback TEXT;

-- 2. Atualizar trigger de verificação de ativação para incluir 4 documentos
CREATE OR REPLACE FUNCTION public.check_contract_activation_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if all 4 documents are approved and contract is still pending
  IF NEW.status = 'documentacao_pendente' 
     AND NEW.doc_contrato_locacao_status = 'aprovado'
     AND NEW.doc_vistoria_inicial_status = 'aprovado'
     AND NEW.doc_seguro_incendio_status = 'aprovado'
     AND NEW.doc_contrato_administrativo_status = 'aprovado'
     AND (OLD.activation_pending IS NULL OR OLD.activation_pending = false)
  THEN
    NEW.activation_pending := true;
    NEW.activation_pending_since := now();
  END IF;
  
  -- Reset activation_pending when contract is activated
  IF NEW.status = 'ativo' AND OLD.status = 'documentacao_pendente' THEN
    NEW.activation_pending := false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Atualizar trigger de notificação de upload de documento para incluir Contrato Administrativo
CREATE OR REPLACE FUNCTION public.notify_contract_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  doc_type TEXT;
  tenant_name TEXT;
  agency_name TEXT;
  master_record RECORD;
BEGIN
  -- Check if any document was updated to 'enviado' status
  doc_type := NULL;
  
  IF (NEW.doc_contrato_locacao_status = 'enviado' AND (OLD.doc_contrato_locacao_status IS DISTINCT FROM 'enviado')) THEN
    doc_type := 'Contrato de Locação';
  ELSIF (NEW.doc_vistoria_inicial_status = 'enviado' AND (OLD.doc_vistoria_inicial_status IS DISTINCT FROM 'enviado')) THEN
    doc_type := 'Vistoria Inicial';
  ELSIF (NEW.doc_seguro_incendio_status = 'enviado' AND (OLD.doc_seguro_incendio_status IS DISTINCT FROM 'enviado')) THEN
    doc_type := 'Seguro Incêndio';
  ELSIF (NEW.doc_contrato_administrativo_status = 'enviado' AND (OLD.doc_contrato_administrativo_status IS DISTINCT FROM 'enviado')) THEN
    doc_type := 'Contrato Administrativo';
  END IF;
  
  -- Only proceed if a document was uploaded
  IF doc_type IS NOT NULL THEN
    -- Get tenant name and agency name
    SELECT a.inquilino_nome, ag.nome_fantasia 
    INTO tenant_name, agency_name
    FROM public.analyses a
    JOIN public.agencies ag ON ag.id = a.agency_id
    WHERE a.id = NEW.analysis_id;
    
    -- Notify all masters
    FOR master_record IN 
      SELECT user_id FROM public.user_roles WHERE role = 'master'
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        master_record.user_id,
        'contract_document',
        'contratos',
        NEW.id,
        'Novo documento enviado',
        'Documento "' || doc_type || '" enviado para o contrato de ' || COALESCE(tenant_name, 'Inquilino'),
        jsonb_build_object(
          'contract_id', NEW.id,
          'tenant_name', tenant_name,
          'agency_name', agency_name,
          'doc_type', doc_type
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Atualizar trigger de notificação de documento rejeitado para incluir Contrato Administrativo
CREATE OR REPLACE FUNCTION public.notify_agency_document_rejected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  doc_type TEXT;
  doc_label TEXT;
  doc_feedback TEXT;
  agency_user RECORD;
  analysis_record RECORD;
BEGIN
  -- Identificar qual documento foi rejeitado
  IF NEW.doc_contrato_locacao_status = 'rejeitado' AND 
     (OLD.doc_contrato_locacao_status IS DISTINCT FROM 'rejeitado') THEN
    doc_type := 'contrato_locacao';
    doc_label := 'Contrato de Locação';
    doc_feedback := NEW.doc_contrato_locacao_feedback;
  ELSIF NEW.doc_vistoria_inicial_status = 'rejeitado' AND 
        (OLD.doc_vistoria_inicial_status IS DISTINCT FROM 'rejeitado') THEN
    doc_type := 'vistoria_inicial';
    doc_label := 'Vistoria Inicial';
    doc_feedback := NEW.doc_vistoria_inicial_feedback;
  ELSIF NEW.doc_seguro_incendio_status = 'rejeitado' AND 
        (OLD.doc_seguro_incendio_status IS DISTINCT FROM 'rejeitado') THEN
    doc_type := 'seguro_incendio';
    doc_label := 'Seguro Incêndio';
    doc_feedback := NEW.doc_seguro_incendio_feedback;
  ELSIF NEW.doc_contrato_administrativo_status = 'rejeitado' AND 
        (OLD.doc_contrato_administrativo_status IS DISTINCT FROM 'rejeitado') THEN
    doc_type := 'contrato_administrativo';
    doc_label := 'Contrato Administrativo';
    doc_feedback := NEW.doc_contrato_administrativo_feedback;
  ELSE
    RETURN NEW;
  END IF;

  -- Buscar dados da análise
  SELECT inquilino_nome INTO analysis_record
  FROM public.analyses WHERE id = NEW.analysis_id;

  -- Notificar todos os colaboradores da imobiliária
  FOR agency_user IN 
    SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
  LOOP
    INSERT INTO public.notifications (
      user_id, type, source, reference_id, title, message, metadata
    ) VALUES (
      agency_user.user_id,
      'contract_document_rejected',
      'contratos',
      NEW.id,
      'Documento rejeitado - ação necessária',
      'O documento "' || doc_label || '" do contrato de ' || 
        COALESCE(analysis_record.inquilino_nome, 'inquilino') || ' foi rejeitado.',
      jsonb_build_object(
        'contract_id', NEW.id,
        'doc_type', doc_type,
        'doc_label', doc_label,
        'tenant_name', analysis_record.inquilino_nome,
        'feedback', doc_feedback
      )
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 5. Criar trigger para notificar novo cadastro de imobiliária
CREATE OR REPLACE FUNCTION public.notify_new_agency_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  master_record RECORD;
BEGIN
  -- Notificar todos os masters quando nova agência é criada com active = false
  IF NEW.active = false THEN
    FOR master_record IN 
      SELECT user_id FROM public.user_roles WHERE role = 'master'
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        master_record.user_id,
        'agency_registration',
        'imobiliarias',
        NEW.id,
        'Nova imobiliária cadastrada',
        'A imobiliária "' || COALESCE(NEW.nome_fantasia, NEW.razao_social) || '" aguarda ativação',
        jsonb_build_object(
          'agency_id', NEW.id,
          'agency_name', COALESCE(NEW.nome_fantasia, NEW.razao_social),
          'cnpj', NEW.cnpj,
          'email', NEW.email
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

-- Criar o trigger para novos cadastros de imobiliária
DROP TRIGGER IF EXISTS on_new_agency_created ON public.agencies;
CREATE TRIGGER on_new_agency_created
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_agency_registration();