-- Função para notificar a imobiliária quando documento é rejeitado
CREATE OR REPLACE FUNCTION public.notify_agency_document_rejected()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar o trigger
DROP TRIGGER IF EXISTS on_contract_document_rejected ON public.contracts;
CREATE TRIGGER on_contract_document_rejected
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_agency_document_rejected();