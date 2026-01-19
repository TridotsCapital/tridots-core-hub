-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert Supabase configuration values
INSERT INTO public.system_settings (key, value) VALUES 
  ('supabase_url', 'https://hsyjtujcedwafcviourl.supabase.co'),
  ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeWp0dWpjZWR3YWZjdmlvdXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzExNjQyMywiZXhwIjoyMDgyNjkyNDIzfQ.RVuTPrQl-7q9p0LNLjOGNVgmZBxUBSFzrDCjKXUO8cM')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- RLS for system_settings (only accessible via service role)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- No public policies - only accessible via SECURITY DEFINER functions

-- Update trigger_new_agency_pending_email to use system_settings
CREATE OR REPLACE FUNCTION public.trigger_new_agency_pending_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only trigger for new agencies with active = false
  IF NEW.active = false THEN
    -- Get settings from system_settings table
    SELECT value INTO v_supabase_url FROM public.system_settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_key FROM public.system_settings WHERE key = 'service_role_key';
    
    -- Only proceed if we have the settings
    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-new-agency-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object('agency_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update trigger_agency_activation_email to use system_settings
CREATE OR REPLACE FUNCTION public.trigger_agency_activation_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only trigger when active changes from false to true
  IF NEW.active = true AND OLD.active = false THEN
    -- Get settings from system_settings table
    SELECT value INTO v_supabase_url FROM public.system_settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_key FROM public.system_settings WHERE key = 'service_role_key';
    
    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-agency-activation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object('agency_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update trigger_payment_confirmation_email to use system_settings
CREATE OR REPLACE FUNCTION public.trigger_payment_confirmation_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only trigger when payments_validated_at is set for the first time
  IF NEW.payments_validated_at IS NOT NULL AND OLD.payments_validated_at IS NULL THEN
    -- Get settings from system_settings table
    SELECT value INTO v_supabase_url FROM public.system_settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_key FROM public.system_settings WHERE key = 'service_role_key';
    
    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-payment-confirmation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object('analysis_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update trigger_contract_activated_email to use system_settings
CREATE OR REPLACE FUNCTION public.trigger_contract_activated_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only trigger when status changes to 'ativo'
  IF NEW.status = 'ativo' AND (OLD.status IS NULL OR OLD.status != 'ativo') THEN
    -- Get settings from system_settings table
    SELECT value INTO v_supabase_url FROM public.system_settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_key FROM public.system_settings WHERE key = 'service_role_key';
    
    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-contract-activated',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object('contract_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;