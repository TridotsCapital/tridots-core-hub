-- 1. Remover triggers duplicados (manter apenas os notification_*)
DROP TRIGGER IF EXISTS on_ticket_message_created ON public.ticket_messages;
DROP TRIGGER IF EXISTS on_ticket_status_changed ON public.tickets;
DROP TRIGGER IF EXISTS on_analysis_status_changed ON public.analyses;
DROP TRIGGER IF EXISTS on_analysis_chat_message ON public.internal_chat;

-- 2. Atualizar função create_analysis_status_notification para suportar contratos
CREATE OR REPLACE FUNCTION public.create_analysis_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  agency_user_record RECORD;
  status_text TEXT;
  notification_source TEXT;
  notification_type TEXT;
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
    
    -- Definir source e type baseado no status
    IF NEW.status IN ('aguardando_pagamento', 'ativo') THEN
      notification_source := 'contratos';
      notification_type := 'contract_status';
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
$function$;