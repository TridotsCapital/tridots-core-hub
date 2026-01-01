-- Function for bidirectional ticket creation notifications
CREATE OR REPLACE FUNCTION public.create_new_ticket_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  agency_name TEXT;
  creator_name TEXT;
  is_internal_creator BOOLEAN;
  agency_user_record RECORD;
BEGIN
  -- Get agency name
  SELECT nome_fantasia INTO agency_name 
  FROM public.agencies WHERE id = NEW.agency_id;
  
  -- Get creator name
  SELECT full_name INTO creator_name 
  FROM public.profiles WHERE id = NEW.created_by;
  
  -- Check if creator is internal team (master or analyst)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.created_by 
    AND role IN ('master', 'analyst')
  ) INTO is_internal_creator;
  
  IF is_internal_creator THEN
    -- Internal team created ticket -> notify ALL agency users
    FOR agency_user_record IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user_record.user_id,
        'ticket_message',
        'chamados',
        NEW.id,
        'Novo chamado aberto pela equipe',
        COALESCE(LEFT(NEW.description, 100), NEW.subject),
        jsonb_build_object(
          'creator_name', creator_name,
          'ticket_subject', NEW.subject,
          'category', NEW.category::TEXT,
          'priority', NEW.priority::TEXT
        )
      );
    END LOOP;
  ELSE
    -- Agency user created ticket -> notify all masters
    INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
    SELECT 
      ur.user_id,
      'ticket_message',
      'chamados',
      NEW.id,
      'Novo chamado aberto',
      COALESCE(LEFT(NEW.description, 100), NEW.subject),
      jsonb_build_object(
        'creator_name', creator_name,
        'agency_name', agency_name,
        'ticket_subject', NEW.subject,
        'category', NEW.category::TEXT,
        'priority', NEW.priority::TEXT
      )
    FROM public.user_roles ur
    WHERE ur.role = 'master';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS notification_new_ticket ON public.tickets;
CREATE TRIGGER notification_new_ticket
AFTER INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.create_new_ticket_notification();