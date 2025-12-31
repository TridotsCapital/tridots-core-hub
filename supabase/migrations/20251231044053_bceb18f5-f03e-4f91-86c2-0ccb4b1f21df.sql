-- Criar função para notificações de mensagens em tickets
CREATE OR REPLACE FUNCTION public.create_ticket_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  ticket_record RECORD;
  sender_name TEXT;
BEGIN
  -- Buscar dados do ticket
  SELECT t.*, p.full_name as creator_name, ag.nome_fantasia as agency_name
  INTO ticket_record 
  FROM public.tickets t
  JOIN public.profiles p ON p.id = t.created_by
  JOIN public.agencies ag ON ag.id = t.agency_id
  WHERE t.id = NEW.ticket_id;
  
  -- Buscar nome do remetente
  SELECT full_name INTO sender_name 
  FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Se remetente é o criador, notificar assigned_to (equipe)
  IF NEW.sender_id = ticket_record.created_by THEN
    IF ticket_record.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        ticket_record.assigned_to,
        'ticket_message',
        'chamados',
        NEW.ticket_id,
        'Nova mensagem em chamado',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'ticket_subject', ticket_record.subject,
          'agency_name', ticket_record.agency_name,
          'category', ticket_record.category::TEXT
        )
      );
    ELSE
      -- Notificar todos os masters se não há assigned_to
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      SELECT 
        ur.user_id,
        'ticket_message',
        'chamados',
        NEW.ticket_id,
        'Nova mensagem em chamado',
        LEFT(NEW.message, 100),
        jsonb_build_object(
          'sender_name', sender_name,
          'ticket_subject', ticket_record.subject,
          'agency_name', ticket_record.agency_name,
          'category', ticket_record.category::TEXT
        )
      FROM public.user_roles ur
      WHERE ur.role = 'master';
    END IF;
  ELSE
    -- Notificar criador do ticket (imobiliária)
    INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
    VALUES (
      ticket_record.created_by,
      'ticket_message',
      'chamados',
      NEW.ticket_id,
      'Nova resposta no seu chamado',
      LEFT(NEW.message, 100),
      jsonb_build_object(
        'sender_name', sender_name,
        'ticket_subject', ticket_record.subject,
        'category', ticket_record.category::TEXT
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função para notificações de status do ticket
CREATE OR REPLACE FUNCTION public.create_ticket_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
    VALUES (
      NEW.created_by,
      'ticket_status',
      'chamados',
      NEW.id,
      'Status do chamado atualizado',
      'O status do seu chamado foi alterado para ' || 
      CASE NEW.status
        WHEN 'aberto' THEN 'Aberto'
        WHEN 'em_atendimento' THEN 'Em Atendimento'
        WHEN 'aguardando_cliente' THEN 'Aguardando Resposta'
        WHEN 'resolvido' THEN 'Resolvido'
      END,
      jsonb_build_object(
        'ticket_subject', NEW.subject,
        'old_status', OLD.status::TEXT,
        'new_status', NEW.status::TEXT,
        'category', NEW.category::TEXT
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função para notificações de chat de análises
CREATE OR REPLACE FUNCTION public.create_analysis_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  analysis_record RECORD;
  sender_name TEXT;
  is_internal_user BOOLEAN;
  agency_user_record RECORD;
BEGIN
  SELECT a.*, ag.nome_fantasia as agency_name
  INTO analysis_record 
  FROM public.analyses a
  JOIN public.agencies ag ON ag.id = a.agency_id
  WHERE a.id = NEW.analysis_id;
  
  SELECT full_name INTO sender_name 
  FROM public.profiles WHERE id = NEW.sender_id;
  
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.sender_id
  ) INTO is_internal_user;
  
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
    IF analysis_record.analyst_id IS NOT NULL THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função para notificações de status da análise
CREATE OR REPLACE FUNCTION public.create_analysis_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  agency_user_record RECORD;
  status_text TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    status_text := CASE NEW.status
      WHEN 'pendente' THEN 'Pendente'
      WHEN 'em_analise' THEN 'Em Análise'
      WHEN 'aprovada' THEN 'Aprovada'
      WHEN 'reprovada' THEN 'Reprovada'
      WHEN 'cancelada' THEN 'Cancelada'
      WHEN 'aguardando_pagamento' THEN 'Aguardando Pagamento'
      WHEN 'ativo' THEN 'Contrato Ativo'
    END;
    
    FOR agency_user_record IN 
      SELECT user_id FROM public.agency_users WHERE agency_id = NEW.agency_id
    LOOP
      INSERT INTO public.notifications (user_id, type, source, reference_id, title, message, metadata)
      VALUES (
        agency_user_record.user_id,
        'analysis_status',
        'analises',
        NEW.id,
        'Status da análise atualizado',
        'A análise de ' || NEW.inquilino_nome || ' foi alterada para ' || status_text,
        jsonb_build_object(
          'tenant_name', NEW.inquilino_nome,
          'old_status', OLD.status::TEXT,
          'new_status', NEW.status::TEXT
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dropar triggers antigos se existirem
DROP TRIGGER IF EXISTS on_ticket_message_insert ON public.ticket_messages;
DROP TRIGGER IF EXISTS on_ticket_status_change ON public.tickets;
DROP TRIGGER IF EXISTS on_analysis_chat_insert ON public.internal_chat;
DROP TRIGGER IF EXISTS on_analysis_status_change ON public.analyses;

-- Criar triggers
CREATE TRIGGER notification_ticket_message
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.create_ticket_message_notification();

CREATE TRIGGER notification_ticket_status
AFTER UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.create_ticket_status_notification();

CREATE TRIGGER notification_analysis_chat
AFTER INSERT ON public.internal_chat
FOR EACH ROW
EXECUTE FUNCTION public.create_analysis_chat_notification();

CREATE TRIGGER notification_analysis_status
AFTER UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.create_analysis_status_notification();