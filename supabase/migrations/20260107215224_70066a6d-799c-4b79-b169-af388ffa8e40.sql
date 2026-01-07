-- Trigger function to notify agency users when contract status changes to encerrado or cancelado
CREATE OR REPLACE FUNCTION public.notify_contract_status_change()
RETURNS TRIGGER AS $$
DECLARE
  agency_user RECORD;
  analysis_record RECORD;
  status_label TEXT;
BEGIN
  -- Only trigger when status changes to encerrado or cancelado
  IF NEW.status IN ('encerrado', 'cancelado') AND 
     (OLD.status IS NULL OR OLD.status IS DISTINCT FROM NEW.status) THEN
    
    status_label := CASE NEW.status
      WHEN 'encerrado' THEN 'Encerrado'
      WHEN 'cancelado' THEN 'Cancelado'
    END;
    
    -- Fetch tenant name from the analysis
    SELECT inquilino_nome INTO analysis_record
    FROM public.analyses WHERE id = NEW.analysis_id;
    
    -- Notify all collaborators of the agency
    FOR agency_user IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (
        user_id, type, source, reference_id, title, message, metadata
      ) VALUES (
        agency_user.user_id,
        'contract_status_changed',
        'contratos',
        NEW.id,
        'Contrato ' || status_label,
        'O contrato de ' || COALESCE(analysis_record.inquilino_nome, 'inquilino') || 
          ' foi ' || LOWER(status_label) || '.',
        jsonb_build_object(
          'contract_id', NEW.id,
          'analysis_id', NEW.analysis_id,
          'tenant_name', analysis_record.inquilino_nome,
          'old_status', OLD.status::TEXT,
          'new_status', NEW.status::TEXT,
          'reason', NEW.cancellation_reason
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_contract_status_change ON public.contracts;
CREATE TRIGGER on_contract_status_change
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contract_status_change();