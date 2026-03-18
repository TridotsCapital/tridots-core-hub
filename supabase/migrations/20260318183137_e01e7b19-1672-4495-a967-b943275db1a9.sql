
-- 1. Add tracking column to claims
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS claim_deadline_alerts_sent jsonb DEFAULT '[]'::jsonb;

-- 2. Create the check function
CREATE OR REPLACE FUNCTION public.check_claim_deadline_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_claim RECORD;
  v_days_elapsed INTEGER;
  v_threshold INTEGER;
  v_thresholds INTEGER[] := ARRAY[20, 27, 29];
  v_days_remaining INTEGER;
  v_user RECORD;
  v_urgency_label TEXT;
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_alerts_sent jsonb;
BEGIN
  -- Get system settings for Edge Function call
  SELECT value INTO v_supabase_url FROM public.system_settings WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.system_settings WHERE key = 'service_role_key';

  -- Loop through active claims (not finalized)
  FOR v_claim IN
    SELECT id, created_at, claim_deadline_alerts_sent, agency_id, contract_id, total_claimed_value
    FROM public.claims
    WHERE public_status != 'finalizado'
  LOOP
    v_days_elapsed := EXTRACT(DAY FROM (now() - v_claim.created_at))::INTEGER;
    v_alerts_sent := COALESCE(v_claim.claim_deadline_alerts_sent, '[]'::jsonb);

    -- Check each threshold
    FOREACH v_threshold IN ARRAY v_thresholds LOOP
      IF v_days_elapsed >= v_threshold AND NOT (v_alerts_sent ? v_threshold::text) THEN
        v_days_remaining := 30 - v_days_elapsed;
        IF v_days_remaining < 0 THEN v_days_remaining := 0; END IF;

        v_urgency_label := CASE
          WHEN v_threshold = 20 THEN 'Informativo'
          WHEN v_threshold = 27 THEN 'Alerta'
          WHEN v_threshold = 29 THEN 'Urgente'
        END;

        -- Create in-app notifications for all masters and analysts
        FOR v_user IN
          SELECT ur.user_id
          FROM public.user_roles ur
          JOIN public.profiles p ON p.id = ur.user_id
          WHERE ur.role IN ('master', 'analyst') AND p.active = true
        LOOP
          INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
          VALUES (
            v_user.user_id,
            'claim_deadline_alert',
            'sinistros',
            v_claim.id,
            CASE
              WHEN v_days_remaining <= 1 THEN '🔴 URGENTE: Prazo de garantia expira amanhã!'
              WHEN v_days_remaining <= 3 THEN '🟠 ALERTA: Prazo de garantia expira em ' || v_days_remaining || ' dias'
              ELSE '🟡 Prazo de garantia: faltam ' || v_days_remaining || ' dias'
            END,
            'A garantia #' || LEFT(v_claim.id::text, 8) || ' foi aberta há ' || v_days_elapsed || ' dias. Restam ' || v_days_remaining || ' dias para o pagamento.',
            jsonb_build_object(
              'claim_id', v_claim.id,
              'days_elapsed', v_days_elapsed,
              'days_remaining', v_days_remaining,
              'threshold', v_threshold,
              'urgency', v_urgency_label
            )
          );
        END LOOP;

        -- Call Edge Function for email notifications
        IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
          PERFORM net.http_post(
            url := v_supabase_url || '/functions/v1/send-claim-deadline-alert',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || v_service_key
            ),
            body := jsonb_build_object(
              'claim_id', v_claim.id,
              'days_elapsed', v_days_elapsed,
              'days_remaining', v_days_remaining
            )
          );
        END IF;

        -- Mark this threshold as sent
        v_alerts_sent := v_alerts_sent || to_jsonb(v_threshold);
        UPDATE public.claims 
        SET claim_deadline_alerts_sent = v_alerts_sent 
        WHERE id = v_claim.id;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
