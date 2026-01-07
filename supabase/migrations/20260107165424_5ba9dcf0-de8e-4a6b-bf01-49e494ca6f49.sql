-- Fix the audit log function to handle text record_id properly
CREATE OR REPLACE FUNCTION public.log_audit_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_ip text;
  v_user_agent text;
  v_record_id text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get record id as text
  v_record_id := COALESCE(NEW.id, OLD.id)::text;
  
  -- Try to get IP and user agent from request headers
  BEGIN
    v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
    v_user_agent := NULL;
  END;

  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    v_user_id,
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_ip::inet,
    v_user_agent,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;