-- Habilitar extensões necessárias para cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função para chamar edge function de confirmação de pagamento
CREATE OR REPLACE FUNCTION public.trigger_payment_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só dispara quando payments_validated_at é preenchido pela primeira vez
  IF NEW.payments_validated_at IS NOT NULL AND OLD.payments_validated_at IS NULL THEN
    -- Chamar edge function via pg_net (fire and forget)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-payment-confirmation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('analysis_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Função para chamar edge function de contrato ativado
CREATE OR REPLACE FUNCTION public.trigger_contract_activated_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só dispara quando status muda para 'ativo'
  IF NEW.status = 'ativo' AND (OLD.status IS NULL OR OLD.status != 'ativo') THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-contract-activated',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('contract_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Função para chamar edge function de ativação de agência
CREATE OR REPLACE FUNCTION public.trigger_agency_activation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só dispara quando active muda de false para true
  IF NEW.active = true AND OLD.active = false THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-agency-activation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('agency_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Função para chamar edge function de nova agência pendente
CREATE OR REPLACE FUNCTION public.trigger_new_agency_pending_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só dispara para novas agências com active = false
  IF NEW.active = false THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-new-agency-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('agency_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Criar triggers
DROP TRIGGER IF EXISTS trg_payment_confirmation_email ON public.analyses;
CREATE TRIGGER trg_payment_confirmation_email
  AFTER UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_payment_confirmation_email();

DROP TRIGGER IF EXISTS trg_contract_activated_email ON public.contracts;
CREATE TRIGGER trg_contract_activated_email
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_contract_activated_email();

DROP TRIGGER IF EXISTS trg_agency_activation_email ON public.agencies;
CREATE TRIGGER trg_agency_activation_email
  AFTER UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_agency_activation_email();

DROP TRIGGER IF EXISTS trg_new_agency_pending_email ON public.agencies;
CREATE TRIGGER trg_new_agency_pending_email
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_agency_pending_email();