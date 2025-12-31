-- Enum para categorias de tickets
CREATE TYPE public.ticket_category AS ENUM ('financeiro', 'tecnico', 'comercial', 'urgente');

-- Enum para status de tickets
CREATE TYPE public.ticket_status AS ENUM ('aberto', 'em_atendimento', 'aguardando_cliente', 'resolvido');

-- Enum para prioridade de tickets
CREATE TYPE public.ticket_priority AS ENUM ('baixa', 'media', 'alta');

-- Enum para tipos de notificação
CREATE TYPE public.notification_type AS ENUM ('new_message', 'status_change', 'ticket_escalated', 'ticket_assigned');

-- Tabela de Tickets
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  description TEXT,
  category ticket_category NOT NULL DEFAULT 'tecnico',
  status ticket_status NOT NULL DEFAULT 'aberto',
  priority ticket_priority NOT NULL DEFAULT 'media',
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_comment TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Mensagens do Ticket
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  attachments_url TEXT[],
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Notificações
CREATE TABLE public.ticket_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_tickets_agency_id ON public.tickets(agency_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created_at ON public.ticket_messages(created_at DESC);
CREATE INDEX idx_ticket_notifications_user_id ON public.ticket_notifications(user_id);
CREATE INDEX idx_ticket_notifications_read_at ON public.ticket_notifications(read_at) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies para Tickets
CREATE POLICY "Team members can view all tickets"
ON public.tickets FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can create tickets"
ON public.tickets FOR INSERT
WITH CHECK (has_any_role(auth.uid()));

CREATE POLICY "Team members can update tickets"
ON public.tickets FOR UPDATE
USING (has_any_role(auth.uid()));

-- RLS Policies para Ticket Messages
CREATE POLICY "Team members can view all messages"
ON public.ticket_messages FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can send messages"
ON public.ticket_messages FOR INSERT
WITH CHECK (has_any_role(auth.uid()) AND sender_id = auth.uid());

-- RLS Policies para Notifications
CREATE POLICY "Users can view their own notifications"
ON public.ticket_notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.ticket_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.ticket_notifications FOR UPDATE
USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime para tickets e mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_notifications;

-- Função para registrar primeira resposta
CREATE OR REPLACE FUNCTION public.update_first_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é uma mensagem de um membro da equipe (não o criador do ticket)
  IF EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = NEW.ticket_id
    AND t.created_by != NEW.sender_id
    AND t.first_response_at IS NULL
  ) THEN
    UPDATE public.tickets
    SET first_response_at = NOW()
    WHERE id = NEW.ticket_id AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ticket_message_insert
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_first_response();

-- Função para criar notificação quando status muda
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notificar o criador do ticket
    INSERT INTO public.ticket_notifications (user_id, ticket_id, type, title, message)
    VALUES (
      NEW.created_by,
      NEW.id,
      'status_change',
      'Status do ticket atualizado',
      'O status do ticket "' || NEW.subject || '" foi alterado para ' || NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ticket_status_change
AFTER UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_status_change();

-- Função para criar notificação quando nova mensagem
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  ticket_record RECORD;
  notify_user_id UUID;
BEGIN
  SELECT * INTO ticket_record FROM public.tickets WHERE id = NEW.ticket_id;
  
  -- Se o remetente é o criador, notificar assigned_to (se existir) ou todos masters
  -- Se o remetente não é o criador, notificar o criador
  IF NEW.sender_id = ticket_record.created_by THEN
    IF ticket_record.assigned_to IS NOT NULL THEN
      INSERT INTO public.ticket_notifications (user_id, ticket_id, type, title, message)
      VALUES (
        ticket_record.assigned_to,
        NEW.ticket_id,
        'new_message',
        'Nova mensagem no ticket',
        'Nova mensagem no ticket "' || ticket_record.subject || '"'
      );
    END IF;
  ELSE
    INSERT INTO public.ticket_notifications (user_id, ticket_id, type, title, message)
    VALUES (
      ticket_record.created_by,
      NEW.ticket_id,
      'new_message',
      'Nova resposta no seu ticket',
      'Você recebeu uma resposta no ticket "' || ticket_record.subject || '"'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;