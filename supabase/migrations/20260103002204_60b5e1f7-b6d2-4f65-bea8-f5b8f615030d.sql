-- Tabela de histórico de analistas por ticket
CREATE TABLE public.ticket_analyst_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  analyst_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ticket_analyst_history_ticket ON public.ticket_analyst_history(ticket_id);
CREATE INDEX idx_ticket_analyst_history_analyst ON public.ticket_analyst_history(analyst_id);

-- RLS para ticket_analyst_history
ALTER TABLE public.ticket_analyst_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view analyst history"
ON public.ticket_analyst_history FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "System can insert analyst history"
ON public.ticket_analyst_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update analyst history"
ON public.ticket_analyst_history FOR UPDATE
USING (true);

-- Adicionar colunas de encerramento na tabela tickets
ALTER TABLE public.tickets 
  ADD COLUMN closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN closed_by_type text CHECK (closed_by_type IN ('agency', 'internal'));

-- Tabela de pesquisas de satisfação (NPS)
CREATE TABLE public.satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  analyst_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating smallint CHECK (rating >= 0 AND rating <= 10),
  comment text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(ticket_id)
);

-- Índices para performance
CREATE INDEX idx_satisfaction_surveys_agency ON public.satisfaction_surveys(agency_id);
CREATE INDEX idx_satisfaction_surveys_analyst ON public.satisfaction_surveys(analyst_id);
CREATE INDEX idx_satisfaction_surveys_pending ON public.satisfaction_surveys(agency_id) WHERE rating IS NULL;

-- RLS para satisfaction_surveys
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can view their surveys"
ON public.satisfaction_surveys FOR SELECT
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Agency users can update their pending surveys"
ON public.satisfaction_surveys FOR UPDATE
USING (agency_id = get_user_agency_id(auth.uid()) AND rating IS NULL);

CREATE POLICY "Team members can view all surveys"
ON public.satisfaction_surveys FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "System can insert surveys"
ON public.satisfaction_surveys FOR INSERT
WITH CHECK (true);

-- Função para registrar histórico de analistas
CREATE OR REPLACE FUNCTION public.log_analyst_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tinha analista anterior, marca como removido
  IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    UPDATE public.ticket_analyst_history 
    SET removed_at = now() 
    WHERE ticket_id = OLD.id AND analyst_id = OLD.assigned_to AND removed_at IS NULL;
  END IF;
  
  -- Se tem novo analista, insere registro
  IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.ticket_analyst_history (ticket_id, analyst_id)
    VALUES (NEW.id, NEW.assigned_to);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para histórico de analistas
CREATE TRIGGER trigger_log_analyst_assignment
AFTER UPDATE OF assigned_to ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.log_analyst_assignment();

-- Função para criar pesquisa pendente ao resolver ticket
CREATE OR REPLACE FUNCTION public.create_pending_survey()
RETURNS TRIGGER AS $$
BEGIN
  -- Só cria pesquisa se o status mudou para resolvido
  IF NEW.status = 'resolvido' AND (OLD.status IS NULL OR OLD.status != 'resolvido') THEN
    INSERT INTO public.satisfaction_surveys (ticket_id, agency_id, analyst_id)
    VALUES (NEW.id, NEW.agency_id, NEW.assigned_to)
    ON CONFLICT (ticket_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar pesquisa ao resolver
CREATE TRIGGER trigger_create_pending_survey
AFTER UPDATE OF status ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_survey();

-- Habilitar realtime para satisfaction_surveys
ALTER PUBLICATION supabase_realtime ADD TABLE public.satisfaction_surveys;