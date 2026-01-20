-- Fix: Atualizar trigger set_contract_end_date para usar guarantee_payment_date
-- A data base do contrato deve ser a data inserida manualmente no modal de validação de pagamento

CREATE OR REPLACE FUNCTION public.set_contract_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guarantee_payment_date DATE;
  v_payments_validated_at TIMESTAMPTZ;
BEGIN
  -- Se status mudou para 'ativo' e data_fim_contrato está nulo
  IF NEW.status = 'ativo' AND (OLD.status IS NULL OR OLD.status != 'ativo') AND NEW.data_fim_contrato IS NULL THEN
    -- Buscar datas da análise (priorizar guarantee_payment_date - data inserida manualmente)
    SELECT guarantee_payment_date, payments_validated_at 
    INTO v_guarantee_payment_date, v_payments_validated_at
    FROM public.analyses WHERE id = NEW.analysis_id;
    
    -- Usar guarantee_payment_date se disponível (campo manual do modal)
    IF v_guarantee_payment_date IS NOT NULL THEN
      NEW.data_fim_contrato := (v_guarantee_payment_date + INTERVAL '12 months')::DATE;
    ELSIF v_payments_validated_at IS NOT NULL THEN
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

-- Backfill: Corrigir data_fim_contrato para contratos ativos existentes
-- Usar guarantee_payment_date como base (data inserida no modal de validação)
UPDATE contracts c
SET data_fim_contrato = (
  COALESCE(
    a.guarantee_payment_date::DATE,
    a.payments_validated_at::DATE,
    c.activated_at::DATE,
    c.created_at::DATE
  ) + INTERVAL '12 months'
)::DATE
FROM analyses a
WHERE c.analysis_id = a.id
AND c.status = 'ativo';