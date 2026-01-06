-- Add activation pending tracking columns to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS activation_pending boolean DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS activation_pending_since timestamptz;

-- Create function to check and set activation pending when all docs are approved
CREATE OR REPLACE FUNCTION public.check_contract_activation_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if all 3 documents are approved and contract is still pending
  IF NEW.status = 'documentacao_pendente' 
     AND NEW.doc_contrato_locacao_status = 'aprovado'
     AND NEW.doc_vistoria_inicial_status = 'aprovado'
     AND NEW.doc_seguro_incendio_status = 'aprovado'
     AND (OLD.activation_pending IS NULL OR OLD.activation_pending = false)
  THEN
    NEW.activation_pending := true;
    NEW.activation_pending_since := now();
  END IF;
  
  -- Reset activation_pending when contract is activated
  IF NEW.status = 'ativo' AND OLD.status = 'documentacao_pendente' THEN
    NEW.activation_pending := false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for activation pending
DROP TRIGGER IF EXISTS check_activation_pending_trigger ON public.contracts;
CREATE TRIGGER check_activation_pending_trigger
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contract_activation_pending();