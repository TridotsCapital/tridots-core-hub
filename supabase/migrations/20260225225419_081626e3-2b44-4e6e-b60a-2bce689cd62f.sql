
-- Trigger para sincronizar contracts.payment_method quando analyses.forma_pagamento_preferida muda para boleto_imobiliaria
CREATE OR REPLACE FUNCTION public.sync_boleto_payment_method()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só age se forma_pagamento_preferida mudou para boleto_imobiliaria
  IF NEW.forma_pagamento_preferida = 'boleto_imobiliaria' 
     AND (OLD.forma_pagamento_preferida IS DISTINCT FROM 'boleto_imobiliaria') THEN
    
    -- Sincroniza contracts.payment_method para boleto_imobiliaria
    UPDATE public.contracts
    SET payment_method = 'boleto_imobiliaria',
        updated_at = now()
    WHERE analysis_id = NEW.id
      AND payment_method IS DISTINCT FROM 'boleto_imobiliaria';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_sync_boleto_payment_method ON public.analyses;
CREATE TRIGGER trg_sync_boleto_payment_method
  AFTER UPDATE OF forma_pagamento_preferida ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_boleto_payment_method();
