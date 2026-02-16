
-- Fix notify_agency_new_ticket: read role from user_roles instead of profiles
CREATE OR REPLACE FUNCTION public.notify_agency_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _direction TEXT;
  _user_role TEXT;
BEGIN
  SELECT role INTO _user_role
  FROM public.user_roles
  WHERE user_id = NEW.created_by
  LIMIT 1;

  IF _user_role IN ('master', 'analyst') THEN
    _direction := 'tridots_to_agency';
  ELSE
    _direction := 'agency_to_tridots';
  END IF;

  PERFORM net.http_post(
    url := (SELECT COALESCE(value, '') FROM public.system_settings WHERE key = 'supabase_url') || '/functions/v1/send-ticket-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT COALESCE(value, '') FROM public.system_settings WHERE key = 'service_role_key')
    ),
    body := jsonb_build_object(
      'ticket_id', NEW.id,
      'event_type', 'new_ticket',
      'direction', _direction
    )
  );

  RETURN NEW;
END;
$$;

-- Fix notify_agency_new_ticket_message: read role from user_roles instead of profiles
CREATE OR REPLACE FUNCTION public.notify_agency_new_ticket_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _direction TEXT;
  _user_role TEXT;
BEGIN
  SELECT role INTO _user_role
  FROM public.user_roles
  WHERE user_id = NEW.sender_id
  LIMIT 1;

  IF _user_role IN ('master', 'analyst') THEN
    _direction := 'tridots_to_agency';
  ELSE
    _direction := 'agency_to_tridots';
  END IF;

  PERFORM net.http_post(
    url := (SELECT COALESCE(value, '') FROM public.system_settings WHERE key = 'supabase_url') || '/functions/v1/send-ticket-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT COALESCE(value, '') FROM public.system_settings WHERE key = 'service_role_key')
    ),
    body := jsonb_build_object(
      'ticket_id', NEW.ticket_id,
      'message_id', NEW.id,
      'event_type', 'new_reply',
      'direction', _direction
    )
  );

  RETURN NEW;
END;
$$;
