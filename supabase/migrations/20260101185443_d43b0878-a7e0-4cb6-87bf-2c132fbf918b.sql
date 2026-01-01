-- 1. Recriar função create_ticket_message_notification com lógica corrigida
CREATE OR REPLACE FUNCTION public.create_ticket_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ticket_record RECORD;
  sender_name TEXT;
  is_internal_sender BOOLEAN;
BEGIN
  -- Buscar dados do ticket
  SELECT t.*, ag.nome_fantasia as agency_name
  INTO ticket_record 
  FROM public.tickets t
  JOIN public.agencies ag ON ag.id = t.agency_id
  WHERE t.id = NEW.ticket_id;
  
  -- Buscar nome do remetente
  SELECT full_name INTO sender_name 
  FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Verificar se o remetente é da equipe interna (master ou analyst, NÃO agency_user)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.sender_id 
    AND role IN ('master', 'analyst')
  ) INTO is_internal_sender;
  
  IF is_internal_sender THEN
    -- Equipe interna enviou -> notificar APENAS o criador do ticket (imobiliária)
    INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
    VALUES (
      ticket_record.created_by,
      'ticket_message',
      'chamados',
      NEW.ticket_id,
      'Nova resposta no seu chamado',
      LEFT(NEW.message, 100),
      jsonb_build_object(
        'sender_name', sender_name,
        'ticket_subject', ticket_record.subject,
        'category', ticket_record.category::TEXT
      )
    );
  ELSE
    -- Imobiliária enviou -> notificar assigned_to OU masters (mas nunca o remetente)
    IF ticket_record.assigned_to IS NOT NULL THEN
      -- Notificar apenas o responsável atribuído
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        ticket_record.assigned_to,
        'ticket_message',
        'chamados',
        NEW.ticket_id,
        'Nova mensagem em chamado',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'ticket_subject', ticket_record.subject,
          'agency_name', ticket_record.agency_name,
          'category', ticket_record.category::TEXT
        )
      );
    ELSE
      -- Sem responsável -> notificar todos os masters (exceto o remetente)
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      SELECT 
        ur.user_id,
        'ticket_message',
        'chamados',
        NEW.ticket_id,
        'Nova mensagem em chamado',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'ticket_subject', ticket_record.subject,
          'agency_name', ticket_record.agency_name,
          'category', ticket_record.category::TEXT
        )
      FROM public.user_roles ur
      WHERE ur.role = 'master'
      AND ur.user_id != NEW.sender_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Recriar função create_ticket_status_notification com lógica corrigida
CREATE OR REPLACE FUNCTION public.create_ticket_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notificar APENAS o criador do ticket (imobiliária)
    INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
    VALUES (
      NEW.created_by,
      'ticket_status',
      'chamados',
      NEW.id,
      'Status do chamado atualizado',
      'O status do seu chamado foi alterado para ' || 
      CASE NEW.status
        WHEN 'aberto' THEN 'Aberto'
        WHEN 'em_atendimento' THEN 'Em Atendimento'
        WHEN 'aguardando_cliente' THEN 'Aguardando Resposta'
        WHEN 'resolvido' THEN 'Resolvido'
      END,
      jsonb_build_object(
        'ticket_subject', NEW.subject,
        'old_status', OLD.status::TEXT,
        'new_status', NEW.status::TEXT,
        'category', NEW.category::TEXT
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Limpar notificações duplicadas existentes (mantém apenas a mais recente)
DELETE FROM public.notifications n1
WHERE EXISTS (
  SELECT 1 FROM public.notifications n2
  WHERE n2.user_id = n1.user_id
  AND n2.reference_id = n1.reference_id
  AND n2.type = n1.type
  AND COALESCE(n2.message, '') = COALESCE(n1.message, '')
  AND n2.created_at > n1.created_at
);