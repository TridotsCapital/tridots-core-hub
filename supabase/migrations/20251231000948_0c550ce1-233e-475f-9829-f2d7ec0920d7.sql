-- Tabela de Templates de Respostas Rápidas (compartilhados)
CREATE TABLE public.ticket_quick_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category ticket_category,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para controlar quem está digitando em um ticket
CREATE TABLE public.ticket_typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, user_id)
);

-- Índices
CREATE INDEX idx_quick_replies_category ON public.ticket_quick_replies(category);
CREATE INDEX idx_typing_indicators_ticket ON public.ticket_typing_indicators(ticket_id);

-- RLS
ALTER TABLE public.ticket_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policies para Quick Replies
CREATE POLICY "Team members can view quick replies"
ON public.ticket_quick_replies FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can create quick replies"
ON public.ticket_quick_replies FOR INSERT
WITH CHECK (has_any_role(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Team members can update quick replies"
ON public.ticket_quick_replies FOR UPDATE
USING (has_any_role(auth.uid()));

CREATE POLICY "Masters can delete quick replies"
ON public.ticket_quick_replies FOR DELETE
USING (is_master(auth.uid()));

-- Policies para Typing Indicators
CREATE POLICY "Team members can view typing indicators"
ON public.ticket_typing_indicators FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can manage their typing indicator"
ON public.ticket_typing_indicators FOR INSERT
WITH CHECK (has_any_role(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Team members can delete their typing indicator"
ON public.ticket_typing_indicators FOR DELETE
USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_quick_replies_updated_at
BEFORE UPDATE ON public.ticket_quick_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime para typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_typing_indicators;

-- Função para limpar typing indicators antigos (mais de 30 segundos)
CREATE OR REPLACE FUNCTION public.cleanup_stale_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ticket_typing_indicators
  WHERE started_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para obter analista com menos tickets (sugestão automática)
CREATE OR REPLACE FUNCTION public.get_suggested_analyst()
RETURNS UUID AS $$
DECLARE
  suggested_analyst UUID;
BEGIN
  SELECT ur.user_id INTO suggested_analyst
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE p.active = true
  GROUP BY ur.user_id
  ORDER BY (
    SELECT COUNT(*) 
    FROM public.tickets t 
    WHERE t.assigned_to = ur.user_id 
    AND t.status NOT IN ('resolvido')
  ) ASC
  LIMIT 1;
  
  RETURN suggested_analyst;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;