
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
  agency_user_record RECORD;
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
  
  -- Verificar se o remetente é da equipe interna (master ou analyst)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.sender_id 
    AND role IN ('master', 'analyst')
  ) INTO is_internal_sender;
  
  IF is_internal_sender THEN
    -- Equipe interna enviou -> notificar TODOS os usuários da agência
    FOR agency_user_record IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = ticket_record.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user_record.user_id,
        'ticket_message',
        'chamados',
        NEW.ticket_id,
        'Nova resposta no chamado',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'ticket_subject', ticket_record.subject,
          'category', ticket_record.category::TEXT
        )
      );
    END LOOP;
  ELSE
    -- Imobiliária enviou -> notificar assigned_to OU masters (mas nunca o remetente)
    IF ticket_record.assigned_to IS NOT NULL THEN
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
