-- 1. Remover policies que dependem de analysis_id
DROP POLICY IF EXISTS "Agency users can create claims" ON public.claims;
DROP POLICY IF EXISTS "Team members can create claims" ON public.claims;

-- 2. Adicionar coluna contract_id (já foi adicionada na migração anterior parcial)
-- Se não existir, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'claims' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE public.claims ADD COLUMN contract_id uuid;
  END IF;
END $$;

-- 3. Migrar dados existentes (analysis_id -> contract_id via contracts)
UPDATE public.claims c
SET contract_id = co.id
FROM public.contracts co
WHERE co.analysis_id = c.analysis_id
AND c.contract_id IS NULL;

-- 4. Tornar contract_id NOT NULL e adicionar FK (se ainda não existe)
ALTER TABLE public.claims ALTER COLUMN contract_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'claims_contract_id_fkey'
  ) THEN
    ALTER TABLE public.claims 
    ADD CONSTRAINT claims_contract_id_fkey 
    FOREIGN KEY (contract_id) REFERENCES public.contracts(id);
  END IF;
END $$;

-- 5. Remover coluna analysis_id
ALTER TABLE public.claims DROP COLUMN IF EXISTS analysis_id;

-- 6. Recriar policies usando contract_id
CREATE POLICY "Agency users can create claims" ON public.claims
  FOR INSERT
  WITH CHECK (
    is_agency_user(auth.uid()) 
    AND agency_id = get_user_agency_id(auth.uid()) 
    AND created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = claims.contract_id 
      AND c.status IN ('ativo', 'documentacao_pendente')
    )
  );

CREATE POLICY "Team members can create claims" ON public.claims
  FOR INSERT
  WITH CHECK (
    has_any_role(auth.uid()) 
    AND created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = claims.contract_id 
      AND c.status IN ('ativo', 'documentacao_pendente')
    )
  );

-- 7. Atualizar função de notificação de novo claim para usar contract_id
CREATE OR REPLACE FUNCTION public.create_claim_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  agency_name TEXT;
  creator_name TEXT;
  is_internal_creator BOOLEAN;
  agency_user_record RECORD;
  tenant_name TEXT;
BEGIN
  -- Buscar dados via CONTRACT
  SELECT ag.nome_fantasia, a.inquilino_nome 
  INTO agency_name, tenant_name
  FROM public.agencies ag
  JOIN public.contracts c ON c.agency_id = ag.id
  JOIN public.analyses a ON a.id = c.analysis_id
  WHERE ag.id = NEW.agency_id AND c.id = NEW.contract_id;
  
  SELECT full_name INTO creator_name 
  FROM public.profiles WHERE id = NEW.created_by;
  
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.created_by AND role IN ('master', 'analyst')
  ) INTO is_internal_creator;
  
  IF is_internal_creator THEN
    FOR agency_user_record IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user_record.user_id,
        'new_claim',
        'sinistros',
        NEW.id,
        'Novo sinistro registrado',
        'Um sinistro foi aberto para o contrato de ' || tenant_name,
        jsonb_build_object(
          'creator_name', creator_name,
          'tenant_name', tenant_name,
          'total_value', NEW.total_claimed_value
        )
      );
    END LOOP;
  ELSE
    INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
    SELECT 
      ur.user_id,
      'new_claim',
      'sinistros',
      NEW.id,
      'Nova solicitação de sinistro',
      'Sinistro de R$ ' || NEW.total_claimed_value || ' - ' || tenant_name,
      jsonb_build_object(
        'creator_name', creator_name,
        'agency_name', agency_name,
        'tenant_name', tenant_name,
        'total_value', NEW.total_claimed_value
      )
    FROM public.user_roles ur
    WHERE ur.role = 'master';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 8. Atualizar função de notificação de mudança de status para usar contract_id
CREATE OR REPLACE FUNCTION public.create_claim_status_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  agency_user_record RECORD;
  tenant_name TEXT;
  status_text TEXT;
BEGIN
  IF OLD.public_status IS DISTINCT FROM NEW.public_status THEN
    SELECT a.inquilino_nome INTO tenant_name
    FROM public.contracts c
    JOIN public.analyses a ON a.id = c.analysis_id
    WHERE c.id = NEW.contract_id;
    
    status_text := CASE NEW.public_status
      WHEN 'solicitado' THEN 'Solicitado'
      WHEN 'em_analise_tecnica' THEN 'Em Análise Técnica'
      WHEN 'pagamento_programado' THEN 'Pagamento Programado'
      WHEN 'finalizado' THEN 'Finalizado'
    END;
    
    FOR agency_user_record IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user_record.user_id,
        'claim_status',
        'sinistros',
        NEW.id,
        'Status do sinistro atualizado',
        'O sinistro de ' || tenant_name || ' foi alterado para ' || status_text,
        jsonb_build_object(
          'tenant_name', tenant_name,
          'old_status', OLD.public_status::TEXT,
          'new_status', NEW.public_status::TEXT,
          'total_value', NEW.total_claimed_value
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 9. Atualizar função de log de mudança de status do claim
CREATE OR REPLACE FUNCTION public.log_claim_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.public_status IS DISTINCT FROM NEW.public_status THEN
    INSERT INTO public.claim_status_history (claim_id, status_type, old_status, new_status, changed_by)
    VALUES (NEW.id, 'public', OLD.public_status::TEXT, NEW.public_status::TEXT, auth.uid());
  END IF;
  
  IF OLD.internal_status IS DISTINCT FROM NEW.internal_status THEN
    INSERT INTO public.claim_status_history (claim_id, status_type, old_status, new_status, changed_by)
    VALUES (NEW.id, 'internal', OLD.internal_status::TEXT, NEW.internal_status::TEXT, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 10. Garantir que os triggers estão criados na tabela claims
DROP TRIGGER IF EXISTS on_claim_created ON public.claims;
CREATE TRIGGER on_claim_created
  AFTER INSERT ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.create_claim_notifications();

DROP TRIGGER IF EXISTS on_claim_status_changed ON public.claims;
CREATE TRIGGER on_claim_status_changed
  AFTER UPDATE ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.create_claim_status_notification();

DROP TRIGGER IF EXISTS on_claim_status_log ON public.claims;
CREATE TRIGGER on_claim_status_log
  AFTER UPDATE ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.log_claim_status_change();