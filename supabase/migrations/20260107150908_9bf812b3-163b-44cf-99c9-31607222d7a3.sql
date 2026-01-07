-- 1. Criar tabela claim_timeline para registrar eventos
CREATE TABLE IF NOT EXISTS public.claim_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_timeline_claim_id ON claim_timeline(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_created_at ON claim_timeline(created_at DESC);

-- Enable RLS
ALTER TABLE claim_timeline ENABLE ROW LEVEL SECURITY;

-- RLS policies para claim_timeline
CREATE POLICY "Agency users can view their claim timelines"
  ON claim_timeline FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM claims c
    JOIN agency_users au ON au.agency_id = c.agency_id
    WHERE c.id = claim_timeline.claim_id AND au.user_id = auth.uid()
  ));

CREATE POLICY "Internal users can view all claim timelines"
  ON claim_timeline FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Internal users can insert claim timelines"
  ON claim_timeline FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid()));

CREATE POLICY "Agency users can insert their claim timelines"
  ON claim_timeline FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM claims c
    JOIN agency_users au ON au.agency_id = c.agency_id
    WHERE c.id = claim_timeline.claim_id AND au.user_id = auth.uid()
  ));

-- 2. Trigger para registrar criação de claim
CREATE OR REPLACE FUNCTION public.log_claim_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.claim_timeline (claim_id, event_type, description, metadata, created_by)
  VALUES (NEW.id, 'created', 'Solicitação de garantia criada', '{}', NEW.created_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_claim_created ON claims;
CREATE TRIGGER on_claim_created
  AFTER INSERT ON claims
  FOR EACH ROW EXECUTE FUNCTION log_claim_created();

-- 3. Trigger para registrar mudanças de status
CREATE OR REPLACE FUNCTION public.log_claim_timeline_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.public_status IS DISTINCT FROM NEW.public_status THEN
    INSERT INTO claim_timeline (claim_id, event_type, description, metadata, created_by)
    VALUES (NEW.id, 'public_status_changed', 
      'Status público alterado para ' || NEW.public_status::TEXT,
      jsonb_build_object('old_status', OLD.public_status::TEXT, 'new_status', NEW.public_status::TEXT),
      auth.uid());
  END IF;
  IF OLD.internal_status IS DISTINCT FROM NEW.internal_status THEN
    INSERT INTO claim_timeline (claim_id, event_type, description, metadata, created_by)
    VALUES (NEW.id, 'internal_status_changed', 
      'Status interno alterado para ' || NEW.internal_status::TEXT,
      jsonb_build_object('old_status', OLD.internal_status::TEXT, 'new_status', NEW.internal_status::TEXT),
      auth.uid());
  END IF;
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO claim_timeline (claim_id, event_type, description, metadata, created_by)
    VALUES (NEW.id, 'assigned', 
      CASE WHEN NEW.assigned_to IS NULL THEN 'Responsável removido' ELSE 'Responsável atribuído' END,
      jsonb_build_object('old_assigned_to', OLD.assigned_to, 'new_assigned_to', NEW.assigned_to),
      auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_claim_status_change_timeline ON claims;
CREATE TRIGGER on_claim_status_change_timeline
  AFTER UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION log_claim_timeline_status_change();

-- 4. Trigger para registrar arquivos adicionados
CREATE OR REPLACE FUNCTION public.log_claim_file_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO claim_timeline (claim_id, event_type, description, metadata, created_by)
  VALUES (NEW.claim_id, 'file_added', 
    'Arquivo adicionado: ' || NEW.file_name,
    jsonb_build_object('file_id', NEW.id, 'file_name', NEW.file_name, 'file_type', NEW.file_type),
    NEW.uploaded_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_claim_file_added ON claim_files;
CREATE TRIGGER on_claim_file_added
  AFTER INSERT ON claim_files
  FOR EACH ROW EXECUTE FUNCTION log_claim_file_added();

-- 5. Trigger para registrar notas adicionadas
CREATE OR REPLACE FUNCTION public.log_claim_note_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO claim_timeline (claim_id, event_type, description, metadata, created_by)
  VALUES (NEW.claim_id, 'note_added', 
    'Nota adicionada',
    jsonb_build_object('note_id', NEW.id, 'note_type', NEW.note_type),
    NEW.created_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_claim_note_added ON claim_notes;
CREATE TRIGGER on_claim_note_added
  AFTER INSERT ON claim_notes
  FOR EACH ROW EXECUTE FUNCTION log_claim_note_added();

-- 6. Atualizar função de notificação de criação de claim
CREATE OR REPLACE FUNCTION public.create_claim_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_master_user RECORD;
  v_agency_name TEXT;
  v_tenant_name TEXT;
BEGIN
  SELECT a.nome_fantasia, an.inquilino_nome
  INTO v_agency_name, v_tenant_name
  FROM contracts c
  JOIN agencies a ON a.id = c.agency_id
  JOIN analyses an ON an.id = c.analysis_id
  WHERE c.id = NEW.contract_id;

  FOR v_master_user IN
    SELECT p.id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'master' AND p.active = true
  LOOP
    INSERT INTO notifications (user_id, type, source, title, message, reference_id)
    VALUES (
      v_master_user.id,
      'claim_created',
      'sinistros',
      'Nova garantia solicitada',
      format('Imobiliária %s solicitou garantia para inquilino %s', v_agency_name, v_tenant_name),
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- 7. Atualizar função de notificação de mudança de status
CREATE OR REPLACE FUNCTION public.create_claim_status_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_agency_user RECORD;
  v_tenant_name TEXT;
  v_status_label TEXT;
BEGIN
  IF OLD.public_status IS DISTINCT FROM NEW.public_status THEN
    SELECT an.inquilino_nome
    INTO v_tenant_name
    FROM contracts c
    JOIN analyses an ON an.id = c.analysis_id
    WHERE c.id = NEW.contract_id;

    v_status_label := CASE NEW.public_status
      WHEN 'solicitado' THEN 'Solicitado'
      WHEN 'em_analise_tecnica' THEN 'Em Análise Técnica'
      WHEN 'pagamento_programado' THEN 'Pagamento Programado'
      WHEN 'finalizado' THEN 'Finalizado'
      ELSE NEW.public_status::TEXT
    END;

    FOR v_agency_user IN
      SELECT au.user_id
      FROM agency_users au
      WHERE au.agency_id = NEW.agency_id
    LOOP
      INSERT INTO notifications (user_id, type, source, title, message, reference_id)
      VALUES (
        v_agency_user.user_id,
        'claim_status_changed',
        'sinistros',
        'Status da garantia atualizado',
        format('Garantia do inquilino %s: %s', v_tenant_name, v_status_label),
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Enable realtime for claim_timeline
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_timeline;