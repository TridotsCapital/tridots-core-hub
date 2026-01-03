
-- =====================================================
-- FASE 2: Migração para Jornada do Inquilino
-- =====================================================

-- 2.1 Novos campos na tabela analyses para controle do fluxo
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS rate_adjusted_by_tridots BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_taxa_garantia_percentual NUMERIC,
ADD COLUMN IF NOT EXISTS acceptance_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS acceptance_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS acceptance_token_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payer_name TEXT,
ADD COLUMN IF NOT EXISTS payer_cpf TEXT,
ADD COLUMN IF NOT EXISTS payer_email TEXT,
ADD COLUMN IF NOT EXISTS payer_phone TEXT,
ADD COLUMN IF NOT EXISTS payer_address TEXT,
ADD COLUMN IF NOT EXISTS payer_number TEXT,
ADD COLUMN IF NOT EXISTS payer_complement TEXT,
ADD COLUMN IF NOT EXISTS payer_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS payer_city TEXT,
ADD COLUMN IF NOT EXISTS payer_state TEXT,
ADD COLUMN IF NOT EXISTS payer_cep TEXT,
ADD COLUMN IF NOT EXISTS payer_is_tenant BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS identity_photo_path TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS setup_fee_exempt BOOLEAN DEFAULT false;

-- 2.2 Criar tabela analysis_timeline para registro de eventos
CREATE TABLE IF NOT EXISTS public.analysis_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela analysis_timeline
ALTER TABLE public.analysis_timeline ENABLE ROW LEVEL SECURITY;

-- Políticas para analysis_timeline
CREATE POLICY "Team members can view all timeline" 
ON public.analysis_timeline 
FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can insert timeline events" 
ON public.analysis_timeline 
FOR INSERT 
WITH CHECK (has_any_role(auth.uid()));

CREATE POLICY "Agency users can view their analysis timeline" 
ON public.analysis_timeline 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.analyses a 
  WHERE a.id = analysis_timeline.analysis_id 
  AND a.agency_id = get_user_agency_id(auth.uid())
));

CREATE POLICY "System can insert timeline events" 
ON public.analysis_timeline 
FOR INSERT 
WITH CHECK (true);

-- 2.3 Criar enum para status do contrato
DO $$ BEGIN
  CREATE TYPE public.contract_status AS ENUM ('documentacao_pendente', 'ativo', 'cancelado', 'encerrado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2.4 Criar tabela contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL UNIQUE REFERENCES public.analyses(id) ON DELETE RESTRICT,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
  status public.contract_status DEFAULT 'documentacao_pendente' NOT NULL,
  doc_contrato_locacao_path TEXT,
  doc_contrato_locacao_name TEXT,
  doc_contrato_locacao_uploaded_at TIMESTAMPTZ,
  doc_vistoria_inicial_path TEXT,
  doc_vistoria_inicial_name TEXT,
  doc_vistoria_inicial_uploaded_at TIMESTAMPTZ,
  doc_seguro_incendio_path TEXT,
  doc_seguro_incendio_name TEXT,
  doc_seguro_incendio_uploaded_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES public.profiles(id),
  canceled_at TIMESTAMPTZ,
  canceled_by UUID REFERENCES public.profiles(id),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Políticas para contracts
CREATE POLICY "Team members can view all contracts" 
ON public.contracts 
FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can update contracts" 
ON public.contracts 
FOR UPDATE 
USING (has_any_role(auth.uid()));

CREATE POLICY "System can insert contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Agency users can view their contracts" 
ON public.contracts 
FOR SELECT 
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Agency users can update their contracts docs" 
ON public.contracts 
FOR UPDATE 
USING (agency_id = get_user_agency_id(auth.uid()) AND status = 'documentacao_pendente');

-- 2.5 Trigger para atualizar updated_at em contracts
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2.6 Criar bucket para fotos de identidade (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-verification', 'identity-verification', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para identity-verification
CREATE POLICY "Team members can view identity photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'identity-verification' AND has_any_role(auth.uid()));

CREATE POLICY "Anyone can upload identity photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'identity-verification');

CREATE POLICY "Masters can delete identity photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'identity-verification' AND is_master(auth.uid()));

-- 2.7 Criar bucket para documentos de contratos (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para contract-documents
CREATE POLICY "Team members can view contract docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-documents' AND has_any_role(auth.uid()));

CREATE POLICY "Agency users can view their contract docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-documents' 
  AND is_agency_user(auth.uid())
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::TEXT FROM public.contracts c WHERE c.agency_id = get_user_agency_id(auth.uid())
  )
);

CREATE POLICY "Team members can upload contract docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-documents' AND has_any_role(auth.uid()));

CREATE POLICY "Agency users can upload contract docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contract-documents' 
  AND is_agency_user(auth.uid())
);

CREATE POLICY "Masters can delete contract docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'contract-documents' AND is_master(auth.uid()));

-- 2.8 Função para registrar eventos na timeline
CREATE OR REPLACE FUNCTION public.log_analysis_timeline_event(
  _analysis_id UUID,
  _event_type TEXT,
  _description TEXT,
  _metadata JSONB DEFAULT '{}',
  _created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id UUID;
BEGIN
  INSERT INTO public.analysis_timeline (analysis_id, event_type, description, metadata, created_by)
  VALUES (_analysis_id, _event_type, _description, _metadata, _created_by)
  RETURNING id INTO _event_id;
  
  RETURN _event_id;
END;
$$;

-- 2.9 Trigger para registrar mudanças de status na timeline
CREATE OR REPLACE FUNCTION public.log_analysis_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_analysis_timeline_event(
      NEW.id,
      'status_changed',
      'Status alterado de ' || OLD.status::TEXT || ' para ' || NEW.status::TEXT,
      jsonb_build_object('old_status', OLD.status::TEXT, 'new_status', NEW.status::TEXT),
      auth.uid()
    );
  END IF;
  
  -- Registrar reajuste de taxa
  IF NEW.rate_adjusted_by_tridots = true AND OLD.rate_adjusted_by_tridots = false THEN
    PERFORM public.log_analysis_timeline_event(
      NEW.id,
      'rate_adjusted',
      'Taxa de garantia reajustada de ' || COALESCE(NEW.original_taxa_garantia_percentual, OLD.taxa_garantia_percentual)::TEXT || '% para ' || NEW.taxa_garantia_percentual::TEXT || '%',
      jsonb_build_object(
        'original_rate', COALESCE(NEW.original_taxa_garantia_percentual, OLD.taxa_garantia_percentual),
        'new_rate', NEW.taxa_garantia_percentual
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_analysis_status_change_trigger
AFTER UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.log_analysis_status_change();

-- 2.10 Função para criar contrato após pagamento
CREATE OR REPLACE FUNCTION public.create_contract_from_analysis(_analysis_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _analysis RECORD;
  _contract_id UUID;
BEGIN
  SELECT * INTO _analysis FROM public.analyses WHERE id = _analysis_id;
  
  IF _analysis IS NULL THEN
    RAISE EXCEPTION 'Análise não encontrada';
  END IF;
  
  INSERT INTO public.contracts (analysis_id, agency_id, status)
  VALUES (_analysis.id, _analysis.agency_id, 'documentacao_pendente')
  RETURNING id INTO _contract_id;
  
  -- Registrar na timeline
  PERFORM public.log_analysis_timeline_event(
    _analysis_id,
    'contract_created',
    'Contrato criado com status Documentação Pendente',
    jsonb_build_object('contract_id', _contract_id),
    NULL
  );
  
  RETURN _contract_id;
END;
$$;

-- 2.11 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_analyses_acceptance_token ON public.analyses(acceptance_token) WHERE acceptance_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_stripe_customer_id ON public.analyses(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analysis_timeline_analysis_id ON public.analysis_timeline(analysis_id);
CREATE INDEX IF NOT EXISTS idx_contracts_analysis_id ON public.contracts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_contracts_agency_id ON public.contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- 2.12 Habilitar realtime para contracts
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_timeline;
