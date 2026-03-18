-- Trigger: enviar e-mail quando nova garantia é criada
CREATE OR REPLACE FUNCTION public.notify_claim_created_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  SELECT value INTO v_supabase_url FROM public.system_settings WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.system_settings WHERE key = 'service_role_key';

  IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-claim-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'claim_id', NEW.id,
        'event_type', 'new_claim'
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_claim_created_email
  AFTER INSERT ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_claim_created_email();

-- Trigger: enviar e-mail quando status público da garantia muda
CREATE OR REPLACE FUNCTION public.notify_claim_status_changed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  IF OLD.public_status IS DISTINCT FROM NEW.public_status THEN
    SELECT value INTO v_supabase_url FROM public.system_settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_key FROM public.system_settings WHERE key = 'service_role_key';

    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-claim-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object(
          'claim_id', NEW.id,
          'event_type', 'status_changed',
          'old_status', OLD.public_status::TEXT,
          'new_status', NEW.public_status::TEXT
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_claim_status_changed_email
  AFTER UPDATE ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_claim_status_changed_email();