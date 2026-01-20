-- 1. Fix notify_contract_document_rejected trigger function
-- The current function tries to check status = 'rejeitado' but contract_status enum doesn't have this value
-- We need to check doc_*_status fields instead which are TEXT

-- First, drop the incorrect trigger if it exists
DROP TRIGGER IF EXISTS on_contract_document_rejected ON public.contracts;

-- Now create/replace the function to work with contracts table
CREATE OR REPLACE FUNCTION public.notify_contract_document_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agency_user RECORD;
  doc_label TEXT;
  rejected_doc TEXT;
  feedback_text TEXT;
BEGIN
  -- Check which document was rejected
  rejected_doc := NULL;
  
  IF NEW.doc_contrato_locacao_status = 'rejeitado' 
     AND (OLD.doc_contrato_locacao_status IS DISTINCT FROM 'rejeitado') THEN
    rejected_doc := 'contrato_locacao';
    doc_label := 'Contrato de Locação';
    feedback_text := NEW.doc_contrato_locacao_feedback;
  ELSIF NEW.doc_vistoria_inicial_status = 'rejeitado' 
        AND (OLD.doc_vistoria_inicial_status IS DISTINCT FROM 'rejeitado') THEN
    rejected_doc := 'vistoria_inicial';
    doc_label := 'Vistoria Inicial';
    feedback_text := NEW.doc_vistoria_inicial_feedback;
  ELSIF NEW.doc_seguro_incendio_status = 'rejeitado' 
        AND (OLD.doc_seguro_incendio_status IS DISTINCT FROM 'rejeitado') THEN
    rejected_doc := 'seguro_incendio';
    doc_label := 'Seguro Incêndio';
    feedback_text := NEW.doc_seguro_incendio_feedback;
  ELSIF NEW.doc_contrato_administrativo_status = 'rejeitado' 
        AND (OLD.doc_contrato_administrativo_status IS DISTINCT FROM 'rejeitado') THEN
    rejected_doc := 'contrato_administrativo';
    doc_label := 'Contrato Administrativo';
    feedback_text := NEW.doc_contrato_administrativo_feedback;
  END IF;
  
  -- Only notify if a document was rejected
  IF rejected_doc IS NOT NULL THEN
    FOR agency_user IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user.user_id,
        'contract_document_rejected',
        'contratos',
        NEW.id,
        'Documento rejeitado - ação necessária',
        'O documento "' || doc_label || '" foi rejeitado. ' || COALESCE(feedback_text, ''),
        jsonb_build_object(
          'contract_id', NEW.id,
          'document_type', rejected_doc,
          'doc_label', doc_label,
          'feedback', feedback_text
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the correct trigger for contract document rejections
CREATE TRIGGER on_contract_document_rejected
AFTER UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.notify_contract_document_rejected();

-- 2. Update set_contract_end_date function to use payments_validated_at
CREATE OR REPLACE FUNCTION public.set_contract_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payments_validated_at TIMESTAMPTZ;
BEGIN
  -- If status changed to 'ativo' and data_fim_contrato is null
  IF NEW.status = 'ativo' AND (OLD.status IS NULL OR OLD.status != 'ativo') AND NEW.data_fim_contrato IS NULL THEN
    -- Get the payments_validated_at date from the analysis
    SELECT payments_validated_at INTO v_payments_validated_at
    FROM public.analyses WHERE id = NEW.analysis_id;
    
    -- Use payments_validated_at if available, otherwise use activated_at, otherwise use now()
    IF v_payments_validated_at IS NOT NULL THEN
      NEW.data_fim_contrato := (v_payments_validated_at + INTERVAL '12 months')::DATE;
    ELSIF NEW.activated_at IS NOT NULL THEN
      NEW.data_fim_contrato := (NEW.activated_at + INTERVAL '12 months')::DATE;
    ELSE
      NEW.data_fim_contrato := (NOW() + INTERVAL '12 months')::DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Add payer fields to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS payer_is_tenant BOOLEAN DEFAULT true,
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
ADD COLUMN IF NOT EXISTS payer_cep TEXT;

-- 4. Update create_contract_from_analysis function to copy payer data
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
  
  INSERT INTO public.contracts (
    analysis_id, agency_id, status,
    payer_is_tenant, payer_name, payer_cpf, payer_email, payer_phone,
    payer_address, payer_number, payer_complement, payer_neighborhood,
    payer_city, payer_state, payer_cep
  )
  VALUES (
    _analysis.id, _analysis.agency_id, 'documentacao_pendente',
    COALESCE(_analysis.payer_is_tenant, true), _analysis.payer_name, _analysis.payer_cpf, 
    _analysis.payer_email, _analysis.payer_phone, _analysis.payer_address,
    _analysis.payer_number, _analysis.payer_complement, _analysis.payer_neighborhood,
    _analysis.payer_city, _analysis.payer_state, _analysis.payer_cep
  )
  RETURNING id INTO _contract_id;
  
  -- Log to timeline
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

-- 5. Backfill payer data for existing contracts
UPDATE public.contracts c
SET 
  payer_is_tenant = COALESCE(a.payer_is_tenant, true),
  payer_name = a.payer_name,
  payer_cpf = a.payer_cpf,
  payer_email = a.payer_email,
  payer_phone = a.payer_phone,
  payer_address = a.payer_address,
  payer_number = a.payer_number,
  payer_complement = a.payer_complement,
  payer_neighborhood = a.payer_neighborhood,
  payer_city = a.payer_city,
  payer_state = a.payer_state,
  payer_cep = a.payer_cep
FROM public.analyses a
WHERE c.analysis_id = a.id
AND c.payer_is_tenant IS NULL;