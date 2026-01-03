-- Função para criar notificação quando uma nova análise é criada
CREATE OR REPLACE FUNCTION public.create_new_analysis_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  agency_name TEXT;
  master_record RECORD;
BEGIN
  -- Apenas notificar quando análise é criada (status pendente)
  IF NEW.status != 'pendente' THEN
    RETURN NEW;
  END IF;

  -- Buscar nome da imobiliária
  SELECT nome_fantasia INTO agency_name 
  FROM public.agencies WHERE id = NEW.agency_id;
  
  -- Notificar todos os masters sobre nova análise
  FOR master_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'master'
  LOOP
    INSERT INTO public.notifications (
      user_id, 
      type, 
      source, 
      reference_id, 
      title, 
      message, 
      metadata
    )
    VALUES (
      master_record.user_id,
      'analysis_new',
      'analises',
      NEW.id,
      'Nova análise recebida',
      format('Análise de %s - %s', NEW.inquilino_nome, COALESCE(agency_name, 'Imobiliária')),
      jsonb_build_object(
        'tenant_name', NEW.inquilino_nome,
        'agency_name', agency_name,
        'valor_aluguel', NEW.valor_aluguel
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Trigger para nova análise
DROP TRIGGER IF EXISTS on_new_analysis_created ON public.analyses;
CREATE TRIGGER on_new_analysis_created
  AFTER INSERT ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_new_analysis_notification();