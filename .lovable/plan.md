

# Plano: Confirmacao de Envio de E-mail para Tridots

## Resumo

Implementar feedback visual para a Tridots garantindo que e-mails foram enviados com sucesso em todos os 8 cenarios de notificacao do sistema.

---

## Cenarios de Notificacao Confirmados

| # | Cenario | Destinatario | Disparo |
|---|---------|--------------|---------|
| 1 | Aceite Digital | Inquilino | Trigger (aprovacao analise) |
| 2 | Lembrete Renovacao | Inquilino | Manual (botao) |
| 3 | Confirmacao Pagamento | Inquilino | Trigger (validacao PIX/Stripe) |
| 4 | Contrato Ativado (Inquilino) | Inquilino | Trigger (status = ativo) |
| 5 | Contrato Ativado (Imobiliaria) | Colaboradores | Trigger (status = ativo) |
| 6 | Ativacao Cadastro | Imobiliaria | Trigger (active = true) |
| 7 | Nova Imobiliaria | Tridots (interno) | Trigger (novo cadastro) |
| 8 | Chamados | Imobiliaria | Trigger (novo ticket/resposta) |

---

## Solucao

### 1. Toast de Sucesso (Envios Manuais)

Para acoes manuais ja existentes no frontend, adicionar toast verde apos confirmacao de envio:

**Arquivo: `src/components/contracts/RenewalNotificationActions.tsx`**
- Adicionar toast de sucesso apos `send-renewal-notification`
- Mensagem: "E-mail enviado com sucesso para [nome_destinatario]"

### 2. Toast de Erro com Reenvio

Quando falhar, mostrar toast vermelho com botao para reenviar:
- Mensagem de erro detalhada
- Botao "Tentar novamente" que reexecuta a funcao

### 3. Notificacao In-App para Triggers Automaticos

Criar novo tipo de notificacao `email_sent` para usuarios Tridots (master/analyst) quando e-mails automaticos sao enviados.

**Novo tipo de notificacao:**
```text
type: 'email_sent'
source: 'sistema'
title: 'E-mail enviado: [template_type]'
message: 'Destinatario: [email]'
metadata: { template_type, recipient_email, status }
```

### 4. Modificar Edge Functions

Atualizar todas as Edge Functions de envio para:
1. Retornar informacoes detalhadas sobre o envio
2. Criar notificacao in-app para usuarios Tridots

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/types/notifications.ts` | Modificacao | Adicionar tipo `email_sent` e source `sistema` |
| `src/components/contracts/RenewalNotificationActions.tsx` | Modificacao | Adicionar toast de sucesso/erro com reenvio |
| `supabase/functions/send-agency-activation/index.ts` | Modificacao | Criar notificacao in-app |
| `supabase/functions/send-contract-activated/index.ts` | Modificacao | Criar notificacao in-app |
| `supabase/functions/send-payment-confirmation/index.ts` | Modificacao | Criar notificacao in-app |
| `supabase/functions/send-new-agency-notification/index.ts` | Modificacao | Criar notificacao in-app |
| `supabase/functions/send-ticket-notification/index.ts` | Modificacao | Criar notificacao in-app |
| `supabase/functions/send-renewal-notification/index.ts` | Modificacao | Criar notificacao in-app |
| Migration SQL | Criacao | Funcao para criar notificacao para Tridots |

### Logica da Notificacao In-App

```sql
-- Funcao para criar notificacao de e-mail enviado para usuarios Tridots
CREATE OR REPLACE FUNCTION create_email_sent_notification(
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
  -- Criar notificacao para todos os usuarios master/analyst
  FOR v_user_id IN 
    SELECT id FROM profiles WHERE role IN ('master', 'analyst') AND active = true
  LOOP
    v_title := CASE 
      WHEN p_success THEN 'E-mail enviado com sucesso'
      ELSE 'Falha no envio de e-mail'
    END;
    
    v_message := CASE p_template_type
      WHEN 'agency_activation' THEN 'Ativacao de cadastro para ' || p_recipient_name
      WHEN 'contract_activated_tenant' THEN 'Contrato ativado para inquilino ' || p_recipient_name
      WHEN 'contract_activated_agency' THEN 'Contrato ativado para imobiliaria'
      WHEN 'payment_confirmation' THEN 'Confirmacao de pagamento para ' || p_recipient_name
      WHEN 'new_agency_pending' THEN 'Nova imobiliaria cadastrada'
      WHEN 'ticket_notification' THEN 'Notificacao de chamado para ' || p_recipient_name
      WHEN 'renewal_notification' THEN 'Lembrete de renovacao para ' || p_recipient_name
      ELSE 'E-mail: ' || p_template_type
    END;

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
```

### Exemplo de Modificacao em Edge Function

```typescript
// Em send-agency-activation/index.ts - apos envio bem-sucedido:

if (result.success) {
  // Criar notificacao in-app para usuarios Tridots
  await supabase.rpc('create_email_sent_notification', {
    p_template_type: 'agency_activation',
    p_recipient_email: recipientEmail,
    p_recipient_name: agency.responsavel_nome || agency.nome_fantasia,
    p_reference_id: agency_id,
    p_success: true
  });
}
```

### Toast com Reenvio (Frontend)

```typescript
// Em RenewalNotificationActions.tsx

const handleSendEmail = async () => {
  setSendingEmail(true);
  try {
    const { data, error } = await supabase.functions.invoke('send-renewal-notification', {
      body: { ... }
    });

    if (error || data?.error) {
      toast({
        title: "Falha no envio",
        description: data?.error || error?.message || "Erro ao enviar e-mail",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            Tentar novamente
          </Button>
        )
      });
      return;
    }

    toast({
      title: "E-mail enviado!",
      description: `Notificacao enviada para ${recipientName}`,
      variant: "default", // verde
    });
    
  } catch (err) {
    // tratamento de erro
  } finally {
    setSendingEmail(false);
  }
};
```

### Configuracao Visual da Notificacao

```typescript
// Em src/types/notifications.ts

export type NotificationType = 
  | 'ticket_message' 
  | 'ticket_status' 
  | 'analysis_message' 
  | 'analysis_status'
  | 'contract_status'
  | 'contract_document_rejected'
  | 'email_sent';  // NOVO

export type NotificationSource = 'chamados' | 'analises' | 'contratos' | 'sinistros' | 'sistema';  // NOVO

// Em getNotificationConfig:
case 'email_sent':
  return {
    icon: 'Mail',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  };
```

---

## Resultado Final

1. **Envios Manuais**: Toast verde imediato confirmando "E-mail enviado para [destinatario]"
2. **Envios Automaticos**: Notificacao na central de notificacoes (bell icon) informando cada e-mail enviado
3. **Falhas**: Toast vermelho com mensagem de erro e botao "Tentar novamente"
4. **Historico**: Todos os envios continuam registrados na tabela `email_logs` para consulta

