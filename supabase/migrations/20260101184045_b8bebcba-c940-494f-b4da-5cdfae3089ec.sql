-- 1. Criar tabela public.notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  reference_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_source ON public.notifications(source);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Criar Triggers para as funções existentes
CREATE TRIGGER on_ticket_message_created
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_message_notification();

CREATE TRIGGER on_ticket_status_changed
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_status_notification();

CREATE TRIGGER on_analysis_chat_message
  AFTER INSERT ON public.internal_chat
  FOR EACH ROW
  EXECUTE FUNCTION create_analysis_chat_notification();

CREATE TRIGGER on_analysis_status_changed
  AFTER UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION create_analysis_status_notification();

-- 3. Adicionar políticas RLS para usuários de agências em tickets
CREATE POLICY "Agency users can create tickets"
ON public.tickets FOR INSERT
WITH CHECK (
  is_agency_user(auth.uid()) 
  AND agency_id = get_user_agency_id(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Agency users can view their tickets"
ON public.tickets FOR SELECT
USING (
  is_agency_user(auth.uid()) 
  AND agency_id = get_user_agency_id(auth.uid())
);

-- 4. Adicionar políticas RLS para usuários de agências em ticket_messages
CREATE POLICY "Agency users can send messages"
ON public.ticket_messages FOR INSERT
WITH CHECK (
  is_agency_user(auth.uid())
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = ticket_id 
    AND t.agency_id = get_user_agency_id(auth.uid())
  )
);

CREATE POLICY "Agency users can view their messages"
ON public.ticket_messages FOR SELECT
USING (
  is_agency_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = ticket_id 
    AND t.agency_id = get_user_agency_id(auth.uid())
  )
);