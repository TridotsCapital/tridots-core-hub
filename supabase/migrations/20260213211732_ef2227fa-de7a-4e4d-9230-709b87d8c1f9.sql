
-- Create or replace trigger function for new tickets with bidirectional logic
CREATE OR REPLACE FUNCTION public.notify_agency_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  _direction TEXT;
  _user_role TEXT;
BEGIN
  -- Get the role of the user who created the ticket
  SELECT role INTO _user_role
  FROM public.profiles
  WHERE id = NEW.created_by
  LIMIT 1;

  -- Determine direction based on role
  -- If user is master/analyst, notify agency (tridots_to_agency)
  -- Otherwise (agency user), notify tridots team (agency_to_tridots)
  IF _user_role IN ('master', 'analyst') THEN
    _direction := 'tridots_to_agency';
  ELSE
    _direction := 'agency_to_tridots';
  END IF;

  -- Call edge function with direction parameter
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
$$ LANGUAGE plpgsql;

-- Create or replace trigger function for new ticket messages with bidirectional logic
CREATE OR REPLACE FUNCTION public.notify_agency_new_ticket_message()
RETURNS TRIGGER AS $$
DECLARE
  _direction TEXT;
  _user_role TEXT;
BEGIN
  -- Get the role of the user who sent the message
  SELECT role INTO _user_role
  FROM public.profiles
  WHERE id = NEW.sender_id
  LIMIT 1;

  -- Determine direction based on role
  IF _user_role IN ('master', 'analyst') THEN
    _direction := 'tridots_to_agency';
  ELSE
    _direction := 'agency_to_tridots';
  END IF;

  -- Call edge function with direction parameter
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
$$ LANGUAGE plpgsql;
