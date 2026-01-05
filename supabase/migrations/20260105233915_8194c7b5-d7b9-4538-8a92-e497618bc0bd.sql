-- Create function to notify masters when agency uploads contract documents
CREATE OR REPLACE FUNCTION public.notify_contract_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_contract_document_upload ON public.contracts;
CREATE TRIGGER on_contract_document_upload
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contract_document_upload();

-- Update create_analysis_status_notification to only notify about contracts if contract exists
CREATE OR REPLACE FUNCTION public.create_analysis_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  agency_user_record RECORD;
  status_text TEXT;
  notification_source TEXT;
  notification_type TEXT;
  contract_exists BOOLEAN;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    status_text := CASE NEW.status
      WHEN 'pendente' THEN 'Pendente'
      WHEN 'em_analise' THEN 'Em Análise'
      WHEN 'aprovada' THEN 'Aprovada'
      WHEN 'reprovada' THEN 'Reprovada'
      WHEN 'cancelada' THEN 'Cancelada'
      WHEN 'aguardando_pagamento' THEN 'Aguardando Pagamento'
      WHEN 'ativo' THEN 'Contrato Ativo'
    END;
    
    -- Define source and type based on status
    IF NEW.status IN ('aguardando_pagamento', 'ativo') THEN
      -- Check if contract exists before sending contract notifications
      SELECT EXISTS (SELECT 1 FROM public.contracts WHERE analysis_id = NEW.id) INTO contract_exists;
      
      IF contract_exists THEN
        notification_source := 'contratos';
        notification_type := 'contract_status';
      ELSE
        notification_source := 'analises';
        notification_type := 'analysis_status';
      END IF;
    ELSE
      notification_source := 'analises';
      notification_type := 'analysis_status';
    END IF;
    
    FOR agency_user_record IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user_record.user_id,
        notification_type,
        notification_source,
        NEW.id,
        CASE 
          WHEN notification_source = 'contratos' THEN 'Atualização no contrato'
          ELSE 'Status da análise atualizado'
        END,
        'A análise de ' || NEW.inquilino_nome || ' foi alterada para ' || status_text,
        jsonb_build_object(
          'tenant_name', NEW.inquilino_nome,
          'old_status', OLD.status::TEXT,
          'new_status', NEW.status::TEXT
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;