-- Trigger de validação: valor locatício total não pode exceder R$ 4.000
CREATE OR REPLACE FUNCTION public.check_analysis_rental_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.valor_aluguel + COALESCE(NEW.valor_condominio, 0) + COALESCE(NEW.valor_iptu, 0)) > 4000 THEN
    RAISE EXCEPTION 'Valor locatício total excede o limite de R$ 4.000,00. Valor informado: R$ %', 
      ROUND((NEW.valor_aluguel + COALESCE(NEW.valor_condominio, 0) + COALESCE(NEW.valor_iptu, 0))::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_analysis_rental_limit
  BEFORE INSERT OR UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_analysis_rental_limit();