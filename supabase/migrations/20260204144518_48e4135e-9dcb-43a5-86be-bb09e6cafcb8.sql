-- Função para criar notificação de e-mail enviado para usuários Tridots (master/analyst)
CREATE OR REPLACE FUNCTION public.create_email_sent_notification(
  p_template_type TEXT,
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Título baseado no sucesso ou falha
  v_title := CASE 
    WHEN p_success THEN 'E-mail enviado com sucesso'
    ELSE 'Falha no envio de e-mail'
  END;
  
  -- Mensagem baseada no tipo de template
  v_message := CASE p_template_type
    WHEN 'agency_activation' THEN 'Ativação de cadastro para ' || COALESCE(p_recipient_name, p_recipient_email)
    WHEN 'contract_activated_tenant' THEN 'Contrato ativado para inquilino ' || COALESCE(p_recipient_name, p_recipient_email)
    WHEN 'contract_activated_agency' THEN 'Contrato ativado para imobiliária'
    WHEN 'payment_confirmation' THEN 'Confirmação de pagamento para ' || COALESCE(p_recipient_name, p_recipient_email)
    WHEN 'new_agency_pending' THEN 'Nova imobiliária cadastrada: ' || COALESCE(p_recipient_name, 'Aguardando aprovação')
    WHEN 'ticket_notification' THEN 'Notificação de chamado para ' || COALESCE(p_recipient_name, p_recipient_email)
    WHEN 'renewal_notification' THEN 'Lembrete de renovação para ' || COALESCE(p_recipient_name, p_recipient_email)
    WHEN 'acceptance_link' THEN 'Link de aceite enviado para ' || COALESCE(p_recipient_name, p_recipient_email)
    ELSE 'E-mail (' || p_template_type || ') para ' || COALESCE(p_recipient_name, p_recipient_email)
  END;

  -- Criar notificação para todos os usuários master/analyst ativos
  FOR v_user_id IN 
    SELECT p.id 
    FROM profiles p
    WHERE p.active = true
    AND NOT EXISTS (
      SELECT 1 FROM agency_users au WHERE au.user_id = p.id
    )
  LOOP
    INSERT INTO notifications (user_id, type, source, reference_id, title, message, metadata)
    VALUES (
      v_user_id,
      'email_sent',
      'sistema',
      p_reference_id,
      v_title,
      v_message,
      jsonb_build_object(
        'template_type', p_template_type,
        'recipient_email', p_recipient_email,
        'recipient_name', p_recipient_name,
        'success', p_success
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário explicativo
COMMENT ON FUNCTION public.create_email_sent_notification IS 'Cria notificações in-app para usuários Tridots (master/analyst) quando e-mails são enviados pelo sistema';