-- Create the contract renewals table
CREATE TABLE IF NOT EXISTS public.contract_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Who requested
  requested_by UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_source TEXT NOT NULL CHECK (request_source IN ('agency', 'tridots')),
  
  -- Proposed values
  new_valor_aluguel NUMERIC NOT NULL,
  new_valor_condominio NUMERIC DEFAULT 0,
  new_valor_iptu NUMERIC DEFAULT 0,
  new_valor_outros_encargos NUMERIC DEFAULT 0,
  new_taxa_garantia_percentual NUMERIC DEFAULT 8,
  
  -- Previous values snapshot
  old_valor_aluguel NUMERIC NOT NULL,
  old_valor_condominio NUMERIC,
  old_valor_iptu NUMERIC,
  old_valor_outros_encargos NUMERIC,
  old_taxa_garantia_percentual NUMERIC,
  old_data_fim_contrato DATE,
  
  -- Renewal status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'canceled')),
  
  -- Approval/Rejection
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Duration defined by Tridots (in months)
  renewal_duration_months INTEGER,
  
  -- New end date (calculated after approval)
  new_data_fim_contrato DATE,
  
  -- Digital acceptance by tenant
  acceptance_token TEXT,
  acceptance_token_expires_at TIMESTAMPTZ,
  acceptance_token_used_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  
  -- Renewed guarantee payment validation
  guarantee_payment_validated_at TIMESTAMPTZ,
  guarantee_payment_validated_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contract_renewals_contract ON public.contract_renewals(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_renewals_status ON public.contract_renewals(status);

-- Enable RLS
ALTER TABLE public.contract_renewals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agency users can view their renewals"
  ON public.contract_renewals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts c 
    WHERE c.id = contract_renewals.contract_id 
    AND c.agency_id = get_user_agency_id(auth.uid())
  ));

CREATE POLICY "Agency users can create renewals"
  ON public.contract_renewals FOR INSERT
  WITH CHECK (
    is_agency_user(auth.uid()) AND
    requested_by = auth.uid() AND
    request_source = 'agency'
  );

CREATE POLICY "Agency users can cancel their pending renewals"
  ON public.contract_renewals FOR UPDATE
  USING (
    is_agency_user(auth.uid()) AND
    request_source = 'agency' AND
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.contracts c 
      WHERE c.id = contract_renewals.contract_id 
      AND c.agency_id = get_user_agency_id(auth.uid())
    )
  )
  WITH CHECK (
    status = 'canceled'
  );

CREATE POLICY "Team members can view all renewals"
  ON public.contract_renewals FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can create renewals"
  ON public.contract_renewals FOR INSERT
  WITH CHECK (has_any_role(auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "Team members can update renewals"
  ON public.contract_renewals FOR UPDATE
  USING (has_any_role(auth.uid()));

-- Add helper columns to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_renewal_id UUID;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_contract_renewals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_contract_renewals_updated_at ON public.contract_renewals;
CREATE TRIGGER update_contract_renewals_updated_at
    BEFORE UPDATE ON public.contract_renewals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_contract_renewals_updated_at();

-- Notification trigger when renewal is requested by agency
CREATE OR REPLACE FUNCTION public.notify_renewal_requested()
RETURNS TRIGGER AS $$
DECLARE
  master_record RECORD;
  tenant_name TEXT;
  agency_name TEXT;
BEGIN
  -- Only notify for new agency-initiated renewals
  IF NEW.request_source = 'agency' THEN
    -- Get tenant and agency names
    SELECT a.inquilino_nome, ag.nome_fantasia 
    INTO tenant_name, agency_name
    FROM public.contracts c
    JOIN public.analyses a ON a.id = c.analysis_id
    JOIN public.agencies ag ON ag.id = c.agency_id
    WHERE c.id = NEW.contract_id;
    
    -- Notify all masters
    FOR master_record IN 
      SELECT user_id FROM public.user_roles WHERE role = 'master'
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        master_record.user_id,
        'renewal_requested',
        'contratos',
        NEW.contract_id,
        'Solicitação de renovação',
        'Renovação solicitada para contrato de ' || COALESCE(tenant_name, 'inquilino') || ' - ' || COALESCE(agency_name, 'Imobiliária'),
        jsonb_build_object(
          'renewal_id', NEW.id,
          'contract_id', NEW.contract_id,
          'tenant_name', tenant_name,
          'agency_name', agency_name,
          'new_valor_aluguel', NEW.new_valor_aluguel
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_renewal_requested ON public.contract_renewals;
CREATE TRIGGER on_renewal_requested
  AFTER INSERT ON public.contract_renewals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_renewal_requested();

-- Notification trigger when renewal is approved/rejected
CREATE OR REPLACE FUNCTION public.notify_renewal_reviewed()
RETURNS TRIGGER AS $$
DECLARE
  agency_user RECORD;
  tenant_name TEXT;
  status_label TEXT;
BEGIN
  -- Only notify when status changes from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    -- Get tenant name
    SELECT a.inquilino_nome INTO tenant_name
    FROM public.contracts c
    JOIN public.analyses a ON a.id = c.analysis_id
    WHERE c.id = NEW.contract_id;
    
    status_label := CASE NEW.status
      WHEN 'approved' THEN 'aprovada'
      WHEN 'rejected' THEN 'recusada'
    END;
    
    -- Notify all agency collaborators
    FOR agency_user IN 
      SELECT au.user_id 
      FROM public.agency_users au
      JOIN public.contracts c ON c.agency_id = au.agency_id
      WHERE c.id = NEW.contract_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user.user_id,
        'renewal_' || NEW.status,
        'contratos',
        NEW.contract_id,
        'Renovação ' || status_label,
        'A renovação do contrato de ' || COALESCE(tenant_name, 'inquilino') || ' foi ' || status_label,
        jsonb_build_object(
          'renewal_id', NEW.id,
          'contract_id', NEW.contract_id,
          'tenant_name', tenant_name,
          'rejection_reason', NEW.rejection_reason,
          'renewal_duration_months', NEW.renewal_duration_months
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;