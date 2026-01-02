-- Corrige a função create_analysis_chat_notification para identificar corretamente usuários internos
-- O bug era: verificava apenas se existia em user_roles, mas agency_user também existe lá
-- Correção: verificar se role é 'master' OU 'analyst'

CREATE OR REPLACE FUNCTION public.create_analysis_chat_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  analysis_record RECORD;
  sender_name TEXT;
  is_internal_user BOOLEAN;
  agency_user_record RECORD;
BEGIN
  -- Busca dados da análise e agência
  SELECT a.*, ag.nome_fantasia as agency_name
  INTO analysis_record 
  FROM public.analyses a
  JOIN public.agencies ag ON ag.id = a.agency_id
  WHERE a.id = NEW.analysis_id;
  
  -- Busca nome do remetente
  SELECT full_name INTO sender_name 
  FROM public.profiles WHERE id = NEW.sender_id;
  
  -- CORREÇÃO: Verifica se é usuário INTERNO (master ou analyst), não apenas se existe em user_roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.sender_id 
    AND role IN ('master', 'analyst')
  ) INTO is_internal_user;
  
  -- Se for usuário interno, notifica a imobiliária
  IF is_internal_user THEN
    FOR agency_user_record IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = analysis_record.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user_record.user_id,
        'analysis_message',
        'analises',
        NEW.analysis_id,
        'Nova mensagem em análise',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'tenant_name', analysis_record.inquilino_nome,
          'status', analysis_record.status::TEXT
        )
      );
    END LOOP;
  ELSE
    -- Se for imobiliária, notifica equipe interna
    IF analysis_record.analyst_id IS NOT NULL THEN
      -- Se tem analista atribuído, notifica apenas o analista
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        analysis_record.analyst_id,
        'analysis_message',
        'analises',
        NEW.analysis_id,
        'Nova mensagem em análise',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'tenant_name', analysis_record.inquilino_nome,
          'agency_name', analysis_record.agency_name,
          'status', analysis_record.status::TEXT
        )
      );
    ELSE
      -- Se não tem analista, notifica todos os masters
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      SELECT 
        ur.user_id,
        'analysis_message',
        'analises',
        NEW.analysis_id,
        'Nova mensagem em análise',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'tenant_name', analysis_record.inquilino_nome,
          'agency_name', analysis_record.agency_name,
          'status', analysis_record.status::TEXT
        )
      FROM public.user_roles ur
      WHERE ur.role = 'master';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;