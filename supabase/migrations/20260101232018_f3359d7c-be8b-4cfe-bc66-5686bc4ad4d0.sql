-- =====================================================
-- MÓDULO DE SINISTROS (CLAIMS) - Solicitação de Garantia
-- =====================================================

-- 1. ENUMS
-- =====================================================

-- Status visível para imobiliárias
CREATE TYPE public.claim_public_status AS ENUM (
  'solicitado',
  'em_analise_tecnica', 
  'pagamento_programado',
  'finalizado'
);

-- Status interno para operação de cobrança
CREATE TYPE public.claim_internal_status AS ENUM (
  'aguardando_analise',
  'cobranca_amigavel',
  'notificacao_extrajudicial',
  'acordo_realizado',
  'juridico_acionado',
  'encerrado'
);

-- Categorias de itens
CREATE TYPE public.claim_item_category AS ENUM (
  'aluguel',
  'condominio',
  'iptu',
  'luz',
  'agua',
  'gas',
  'danos',
  'limpeza',
  'pintura',
  'multa_contratual',
  'outros'
);

-- Tipos de arquivo
CREATE TYPE public.claim_file_type AS ENUM (
  'boleto',
  'contrato',
  'vistoria',
  'notificacao',
  'acordo',
  'comprovante',
  'outros'
);

-- 2. TABELA PRINCIPAL: claims
-- =====================================================

CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculos
  analysis_id UUID NOT NULL REFERENCES public.analyses(id),
  agency_id UUID NOT NULL REFERENCES public.agencies(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Status duplo
  public_status public.claim_public_status NOT NULL DEFAULT 'solicitado',
  internal_status public.claim_internal_status NOT NULL DEFAULT 'aguardando_analise',
  
  -- Valores
  total_claimed_value NUMERIC NOT NULL DEFAULT 0,
  
  -- Metadados
  observations TEXT,
  canceled_at TIMESTAMPTZ,
  canceled_by UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_claims_analysis_id ON public.claims(analysis_id);
CREATE INDEX idx_claims_agency_id ON public.claims(agency_id);
CREATE INDEX idx_claims_public_status ON public.claims(public_status);
CREATE INDEX idx_claims_internal_status ON public.claims(internal_status);

-- 3. TABELA: claim_items (Itens do Sinistro)
-- =====================================================

CREATE TABLE public.claim_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  
  category public.claim_item_category NOT NULL,
  description TEXT,
  reference_period TEXT NOT NULL, -- Ex: "01/2026" ou "Jan/2026"
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_claim_items_claim_id ON public.claim_items(claim_id);

-- 4. TABELA: claim_files (Arquivos)
-- =====================================================

CREATE TABLE public.claim_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type public.claim_file_type NOT NULL DEFAULT 'outros',
  description TEXT,
  
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_claim_files_claim_id ON public.claim_files(claim_id);

-- 5. TABELA: claim_status_history (Histórico)
-- =====================================================

CREATE TABLE public.claim_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  
  -- Qual status mudou
  status_type TEXT NOT NULL CHECK (status_type IN ('public', 'internal')),
  old_status TEXT,
  new_status TEXT NOT NULL,
  
  -- Quem e quando
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_claim_status_history_claim_id ON public.claim_status_history(claim_id);

-- 6. ADICIONAR COLUNA claim_id NA TABELA tickets
-- =====================================================

ALTER TABLE public.tickets
ADD COLUMN claim_id UUID REFERENCES public.claims(id);

CREATE INDEX idx_tickets_claim_id ON public.tickets(claim_id);

-- 7. STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-files', 'claim-files', false);

-- Storage policies para claim-files
CREATE POLICY "Users can view claim files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'claim-files'
  AND (
    has_any_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND c.agency_id = get_user_agency_id(auth.uid())
    )
  )
);

CREATE POLICY "Users can upload claim files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'claim-files'
  AND (
    has_any_role(auth.uid())
    OR (
      is_agency_user(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.claims c
        WHERE c.id::text = (storage.foldername(name))[1]
        AND c.agency_id = get_user_agency_id(auth.uid())
        AND c.public_status = 'solicitado'
      )
    )
  )
);

CREATE POLICY "Team members can delete claim files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'claim-files'
  AND has_any_role(auth.uid())
);

-- 8. TRIGGERS E FUNÇÕES
-- =====================================================

-- 8.1 Trigger para updated_at
CREATE TRIGGER update_claims_updated_at
BEFORE UPDATE ON public.claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_claim_items_updated_at
BEFORE UPDATE ON public.claim_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8.2 Soma automática de itens
CREATE OR REPLACE FUNCTION public.update_claim_total_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.claims
  SET total_claimed_value = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.claim_items
    WHERE claim_id = COALESCE(NEW.claim_id, OLD.claim_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.claim_id, OLD.claim_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_claim_total_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.claim_items
FOR EACH ROW
EXECUTE FUNCTION public.update_claim_total_value();

-- 8.3 Histórico automático de status
CREATE OR REPLACE FUNCTION public.log_claim_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Registrar mudança de public_status
  IF OLD.public_status IS DISTINCT FROM NEW.public_status THEN
    INSERT INTO public.claim_status_history (claim_id, status_type, old_status, new_status, changed_by)
    VALUES (NEW.id, 'public', OLD.public_status::TEXT, NEW.public_status::TEXT, auth.uid());
  END IF;
  
  -- Registrar mudança de internal_status
  IF OLD.internal_status IS DISTINCT FROM NEW.internal_status THEN
    INSERT INTO public.claim_status_history (claim_id, status_type, old_status, new_status, changed_by)
    VALUES (NEW.id, 'internal', OLD.internal_status::TEXT, NEW.internal_status::TEXT, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_claim_status_changes
AFTER UPDATE ON public.claims
FOR EACH ROW
EXECUTE FUNCTION public.log_claim_status_change();

-- 8.4 Notificações automáticas para novo sinistro
CREATE OR REPLACE FUNCTION public.create_claim_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  agency_name TEXT;
  creator_name TEXT;
  is_internal_creator BOOLEAN;
  agency_user_record RECORD;
  tenant_name TEXT;
BEGIN
  -- Buscar dados
  SELECT ag.nome_fantasia, a.inquilino_nome 
  INTO agency_name, tenant_name
  FROM public.agencies ag
  JOIN public.analyses a ON a.agency_id = ag.id
  WHERE ag.id = NEW.agency_id AND a.id = NEW.analysis_id;
  
  SELECT full_name INTO creator_name 
  FROM public.profiles WHERE id = NEW.created_by;
  
  -- Verificar se criador é interno
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.created_by AND role IN ('master', 'analyst')
  ) INTO is_internal_creator;
  
  IF is_internal_creator THEN
    -- Equipe criou -> notificar imobiliária
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
    -- Imobiliária criou -> notificar masters
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
$$;

CREATE TRIGGER notify_new_claim
AFTER INSERT ON public.claims
FOR EACH ROW
EXECUTE FUNCTION public.create_claim_notifications();

-- 8.5 Notificações de mudança de status público
CREATE OR REPLACE FUNCTION public.create_claim_status_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  agency_user_record RECORD;
  tenant_name TEXT;
  status_text TEXT;
BEGIN
  IF OLD.public_status IS DISTINCT FROM NEW.public_status THEN
    -- Buscar nome do inquilino
    SELECT a.inquilino_nome INTO tenant_name
    FROM public.analyses a
    WHERE a.id = NEW.analysis_id;
    
    status_text := CASE NEW.public_status
      WHEN 'solicitado' THEN 'Solicitado'
      WHEN 'em_analise_tecnica' THEN 'Em Análise Técnica'
      WHEN 'pagamento_programado' THEN 'Pagamento Programado'
      WHEN 'finalizado' THEN 'Finalizado'
    END;
    
    -- Notificar usuários da imobiliária
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
$$;

CREATE TRIGGER notify_claim_status_change
AFTER UPDATE ON public.claims
FOR EACH ROW
EXECUTE FUNCTION public.create_claim_status_notification();

-- 9. RLS POLICIES
-- =====================================================

-- 9.1 claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Imobiliária pode visualizar seus sinistros
CREATE POLICY "Agency users can view their claims"
ON public.claims FOR SELECT
USING (agency_id = get_user_agency_id(auth.uid()));

-- Imobiliária pode criar sinistros para contratos ativos
CREATE POLICY "Agency users can create claims"
ON public.claims FOR INSERT
WITH CHECK (
  is_agency_user(auth.uid()) 
  AND agency_id = get_user_agency_id(auth.uid())
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.analyses 
    WHERE id = analysis_id 
    AND status = 'ativo'
  )
);

-- Imobiliária pode atualizar apenas em 'solicitado' (para cancelar)
CREATE POLICY "Agency users can update own claims in solicitado"
ON public.claims FOR UPDATE
USING (
  is_agency_user(auth.uid()) 
  AND agency_id = get_user_agency_id(auth.uid())
  AND public_status = 'solicitado'
);

-- Equipe interna pode visualizar todos
CREATE POLICY "Team members can view all claims"
ON public.claims FOR SELECT
USING (has_any_role(auth.uid()));

-- Equipe interna pode criar para qualquer contrato ativo
CREATE POLICY "Team members can create claims"
ON public.claims FOR INSERT
WITH CHECK (
  has_any_role(auth.uid())
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.analyses 
    WHERE id = analysis_id 
    AND status = 'ativo'
  )
);

-- Equipe interna pode atualizar tudo
CREATE POLICY "Team members can update claims"
ON public.claims FOR UPDATE
USING (has_any_role(auth.uid()));

-- Masters podem deletar sinistros em 'solicitado'
CREATE POLICY "Masters can delete claims in solicitado"
ON public.claims FOR DELETE
USING (is_master(auth.uid()) AND public_status = 'solicitado');

-- 9.2 claim_items
ALTER TABLE public.claim_items ENABLE ROW LEVEL SECURITY;

-- Visualização
CREATE POLICY "Agency users can view their claim items"
ON public.claim_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
  )
);

CREATE POLICY "Team members can view all claim items"
ON public.claim_items FOR SELECT
USING (has_any_role(auth.uid()));

-- Imobiliária só pode inserir se sinistro está em 'solicitado'
CREATE POLICY "Agency users can insert items in solicitado"
ON public.claim_items FOR INSERT
WITH CHECK (
  is_agency_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
    AND c.public_status = 'solicitado'
  )
);

-- Imobiliária só pode atualizar se sinistro está em 'solicitado'
CREATE POLICY "Agency users can update items in solicitado"
ON public.claim_items FOR UPDATE
USING (
  is_agency_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
    AND c.public_status = 'solicitado'
  )
);

-- Imobiliária só pode deletar se sinistro está em 'solicitado'
CREATE POLICY "Agency users can delete items in solicitado"
ON public.claim_items FOR DELETE
USING (
  is_agency_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
    AND c.public_status = 'solicitado'
  )
);

-- Equipe interna pode gerenciar itens sempre
CREATE POLICY "Team members can insert claim items"
ON public.claim_items FOR INSERT
WITH CHECK (has_any_role(auth.uid()));

CREATE POLICY "Team members can update claim items"
ON public.claim_items FOR UPDATE
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can delete claim items"
ON public.claim_items FOR DELETE
USING (has_any_role(auth.uid()));

-- 9.3 claim_files
ALTER TABLE public.claim_files ENABLE ROW LEVEL SECURITY;

-- Visualização
CREATE POLICY "Agency users can view their claim files"
ON public.claim_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
  )
);

CREATE POLICY "Team members can view all claim files"
ON public.claim_files FOR SELECT
USING (has_any_role(auth.uid()));

-- Imobiliária pode fazer upload se sinistro está em 'solicitado'
CREATE POLICY "Agency users can upload files in solicitado"
ON public.claim_files FOR INSERT
WITH CHECK (
  is_agency_user(auth.uid())
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
    AND c.public_status = 'solicitado'
  )
);

-- Imobiliária pode deletar seus arquivos se sinistro está em 'solicitado'
CREATE POLICY "Agency users can delete own files in solicitado"
ON public.claim_files FOR DELETE
USING (
  is_agency_user(auth.uid())
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
    AND c.public_status = 'solicitado'
  )
);

-- Equipe interna pode fazer upload sempre
CREATE POLICY "Team members can upload claim files"
ON public.claim_files FOR INSERT
WITH CHECK (has_any_role(auth.uid()) AND uploaded_by = auth.uid());

-- Equipe interna pode deletar arquivos
CREATE POLICY "Team members can delete claim files"
ON public.claim_files FOR DELETE
USING (has_any_role(auth.uid()));

-- 9.4 claim_status_history
ALTER TABLE public.claim_status_history ENABLE ROW LEVEL SECURITY;

-- Visualização
CREATE POLICY "Agency users can view their claim history"
ON public.claim_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_id
    AND c.agency_id = get_user_agency_id(auth.uid())
  )
);

CREATE POLICY "Team members can view all claim history"
ON public.claim_status_history FOR SELECT
USING (has_any_role(auth.uid()));

-- Inserção automática via trigger (security definer)
CREATE POLICY "System can insert claim history"
ON public.claim_status_history FOR INSERT
WITH CHECK (true);

-- 10. ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_files;