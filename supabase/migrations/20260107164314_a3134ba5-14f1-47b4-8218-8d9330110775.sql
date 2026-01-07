-- Add data_fim_contrato column to contracts table
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS data_fim_contrato DATE;

-- Create function to set data_fim_contrato (12 months from activated_at)
CREATE OR REPLACE FUNCTION public.set_contract_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- When contract becomes 'ativo', set end date to 12 months from activated_at
  IF NEW.status = 'ativo' AND NEW.activated_at IS NOT NULL AND (OLD.status IS NULL OR OLD.status <> 'ativo') THEN
    NEW.data_fim_contrato := (NEW.activated_at::date + INTERVAL '12 months')::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contract end date
DROP TRIGGER IF EXISTS trigger_set_contract_end_date ON public.contracts;
CREATE TRIGGER trigger_set_contract_end_date
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contract_end_date();

-- Also handle INSERT if contract is created directly as 'ativo'
DROP TRIGGER IF EXISTS trigger_set_contract_end_date_insert ON public.contracts;
CREATE TRIGGER trigger_set_contract_end_date_insert
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contract_end_date();

-- Create generic audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_ip text;
  v_user_agent text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
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
    COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_ip::inet,
    v_user_agent,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit triggers for all main tables
-- agencies
DROP TRIGGER IF EXISTS audit_agencies ON public.agencies;
CREATE TRIGGER audit_agencies AFTER INSERT OR UPDATE OR DELETE ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- agency_users
DROP TRIGGER IF EXISTS audit_agency_users ON public.agency_users;
CREATE TRIGGER audit_agency_users AFTER INSERT OR UPDATE OR DELETE ON public.agency_users
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- analyses
DROP TRIGGER IF EXISTS audit_analyses ON public.analyses;
CREATE TRIGGER audit_analyses AFTER INSERT OR UPDATE OR DELETE ON public.analyses
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- analysis_documents
DROP TRIGGER IF EXISTS audit_analysis_documents ON public.analysis_documents;
CREATE TRIGGER audit_analysis_documents AFTER INSERT OR UPDATE OR DELETE ON public.analysis_documents
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- analysis_timeline
DROP TRIGGER IF EXISTS audit_analysis_timeline ON public.analysis_timeline;
CREATE TRIGGER audit_analysis_timeline AFTER INSERT OR UPDATE OR DELETE ON public.analysis_timeline
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- claim_files
DROP TRIGGER IF EXISTS audit_claim_files ON public.claim_files;
CREATE TRIGGER audit_claim_files AFTER INSERT OR UPDATE OR DELETE ON public.claim_files
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- claim_items
DROP TRIGGER IF EXISTS audit_claim_items ON public.claim_items;
CREATE TRIGGER audit_claim_items AFTER INSERT OR UPDATE OR DELETE ON public.claim_items
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- claim_notes
DROP TRIGGER IF EXISTS audit_claim_notes ON public.claim_notes;
CREATE TRIGGER audit_claim_notes AFTER INSERT OR UPDATE OR DELETE ON public.claim_notes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- claim_status_history
DROP TRIGGER IF EXISTS audit_claim_status_history ON public.claim_status_history;
CREATE TRIGGER audit_claim_status_history AFTER INSERT OR UPDATE OR DELETE ON public.claim_status_history
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- claim_timeline
DROP TRIGGER IF EXISTS audit_claim_timeline ON public.claim_timeline;
CREATE TRIGGER audit_claim_timeline AFTER INSERT OR UPDATE OR DELETE ON public.claim_timeline
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- claims
DROP TRIGGER IF EXISTS audit_claims ON public.claims;
CREATE TRIGGER audit_claims AFTER INSERT OR UPDATE OR DELETE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- commissions
DROP TRIGGER IF EXISTS audit_commissions ON public.commissions;
CREATE TRIGGER audit_commissions AFTER INSERT OR UPDATE OR DELETE ON public.commissions
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- contracts
DROP TRIGGER IF EXISTS audit_contracts ON public.contracts;
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- digital_acceptances
DROP TRIGGER IF EXISTS audit_digital_acceptances ON public.digital_acceptances;
CREATE TRIGGER audit_digital_acceptances AFTER INSERT OR UPDATE OR DELETE ON public.digital_acceptances
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- internal_chat
DROP TRIGGER IF EXISTS audit_internal_chat ON public.internal_chat;
CREATE TRIGGER audit_internal_chat AFTER INSERT OR UPDATE OR DELETE ON public.internal_chat
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- notifications
DROP TRIGGER IF EXISTS audit_notifications ON public.notifications;
CREATE TRIGGER audit_notifications AFTER INSERT OR UPDATE OR DELETE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- profiles
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- satisfaction_surveys
DROP TRIGGER IF EXISTS audit_satisfaction_surveys ON public.satisfaction_surveys;
CREATE TRIGGER audit_satisfaction_surveys AFTER INSERT OR UPDATE OR DELETE ON public.satisfaction_surveys
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- term_templates
DROP TRIGGER IF EXISTS audit_term_templates ON public.term_templates;
CREATE TRIGGER audit_term_templates AFTER INSERT OR UPDATE OR DELETE ON public.term_templates
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ticket_analyst_history
DROP TRIGGER IF EXISTS audit_ticket_analyst_history ON public.ticket_analyst_history;
CREATE TRIGGER audit_ticket_analyst_history AFTER INSERT OR UPDATE OR DELETE ON public.ticket_analyst_history
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ticket_messages
DROP TRIGGER IF EXISTS audit_ticket_messages ON public.ticket_messages;
CREATE TRIGGER audit_ticket_messages AFTER INSERT OR UPDATE OR DELETE ON public.ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ticket_notifications
DROP TRIGGER IF EXISTS audit_ticket_notifications ON public.ticket_notifications;
CREATE TRIGGER audit_ticket_notifications AFTER INSERT OR UPDATE OR DELETE ON public.ticket_notifications
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ticket_quick_replies
DROP TRIGGER IF EXISTS audit_ticket_quick_replies ON public.ticket_quick_replies;
CREATE TRIGGER audit_ticket_quick_replies AFTER INSERT OR UPDATE OR DELETE ON public.ticket_quick_replies
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ticket_typing_indicators
DROP TRIGGER IF EXISTS audit_ticket_typing_indicators ON public.ticket_typing_indicators;
CREATE TRIGGER audit_ticket_typing_indicators AFTER INSERT OR UPDATE OR DELETE ON public.ticket_typing_indicators
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- tickets
DROP TRIGGER IF EXISTS audit_tickets ON public.tickets;
CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- user_roles
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();