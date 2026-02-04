-- Função para disparar notificação de novo ticket
CREATE OR REPLACE FUNCTION notify_agency_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
  v_sender_role TEXT;
BEGIN
  -- Verificar se o ticket pertence a uma imobiliária
  IF NEW.agency_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o criador é um usuário Tridots (master ou analyst)
  SELECT role INTO v_sender_role FROM profiles WHERE id = NEW.created_by;
  IF v_sender_role NOT IN ('master', 'analyst') THEN
    RETURN NEW;
  END IF;
  
  -- Buscar credenciais
  SELECT value INTO v_url FROM system_settings WHERE key = 'supabase_url';
  SELECT value INTO v_key FROM system_settings WHERE key = 'service_role_key';
  
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'System settings not configured for ticket notification';
    RETURN NEW;
  END IF;
  
  -- Chamar Edge Function
  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-ticket-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'ticket_id', NEW.id,
      'event_type', 'new_ticket'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos tickets
DROP TRIGGER IF EXISTS trigger_notify_agency_new_ticket ON tickets;
CREATE TRIGGER trigger_notify_agency_new_ticket
AFTER INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION notify_agency_new_ticket();

-- Função para disparar notificação de nova mensagem
CREATE OR REPLACE FUNCTION notify_agency_new_ticket_message()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket RECORD;
  v_sender_role TEXT;
  v_url TEXT;
  v_key TEXT;
BEGIN
  -- Buscar o ticket
  SELECT id, agency_id INTO v_ticket
  FROM tickets
  WHERE id = NEW.ticket_id;
  
  -- Verificar se o ticket pertence a uma imobiliária
  IF v_ticket.agency_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se a mensagem foi enviada por um usuário Tridots (master ou analyst)
  SELECT role INTO v_sender_role FROM profiles WHERE id = NEW.sender_id;
  IF v_sender_role NOT IN ('master', 'analyst') THEN
    RETURN NEW;
  END IF;
  
  -- Buscar credenciais
  SELECT value INTO v_url FROM system_settings WHERE key = 'supabase_url';
  SELECT value INTO v_key FROM system_settings WHERE key = 'service_role_key';
  
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'System settings not configured for ticket message notification';
    RETURN NEW;
  END IF;
  
  -- Chamar Edge Function
  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-ticket-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'ticket_id', NEW.ticket_id,
      'message_id', NEW.id,
      'event_type', 'new_reply'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novas mensagens em tickets
DROP TRIGGER IF EXISTS trigger_notify_agency_new_ticket_message ON ticket_messages;
CREATE TRIGGER trigger_notify_agency_new_ticket_message
AFTER INSERT ON ticket_messages
FOR EACH ROW
EXECUTE FUNCTION notify_agency_new_ticket_message();