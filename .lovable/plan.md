
# Plano: Correção do Erro "column 'role' does not exist"

## Problema Identificado

Os triggers de notificação de tickets criados na última migration estão consultando a coluna `role` diretamente na tabela `profiles`:

```sql
SELECT role INTO v_sender_role FROM profiles WHERE id = NEW.created_by;
```

Porém, seguindo o padrão de segurança do projeto, as roles dos usuários estão armazenadas na tabela separada `user_roles`, não na tabela `profiles`.

**Estrutura atual:**
- `profiles`: id, full_name, email, avatar_url, active, phone (SEM role)
- `user_roles`: id, user_id, role, created_at (role está aqui)

---

## Solução

Criar uma migration para corrigir as duas funções trigger, alterando a consulta de role para usar a tabela `user_roles`:

**Antes (incorreto):**
```sql
SELECT role INTO v_sender_role FROM profiles WHERE id = NEW.created_by;
```

**Depois (correto):**
```sql
SELECT role INTO v_sender_role FROM user_roles WHERE user_id = NEW.created_by;
```

---

## Arquivos Afetados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| Nova Migration SQL | Criação | Corrigir funções `notify_agency_new_ticket` e `notify_agency_new_ticket_message` |

---

## Seção Técnica

### Migration SQL

```sql
-- Corrigir função notify_agency_new_ticket
CREATE OR REPLACE FUNCTION notify_agency_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
  v_sender_role TEXT;
BEGIN
  -- Verificar se o ticket pertence a uma imobiliária
  IF NEW.agency_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o criador é um usuário Tridots (master ou analyst)
  -- CORREÇÃO: Buscar role da tabela user_roles ao invés de profiles
  SELECT role INTO v_sender_role FROM user_roles WHERE user_id = NEW.created_by;
  IF v_sender_role IS NULL OR v_sender_role NOT IN ('master', 'analyst') THEN
    RETURN NEW;
  END IF;
  
  -- Buscar credenciais
  SELECT value INTO v_url FROM system_settings WHERE key = 'supabase_url';
  SELECT value INTO v_key FROM system_settings WHERE key = 'service_role_key';
  
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'System settings not configured for ticket notification';
    RETURN NEW;
  END IF;
  
  -- Chamar Edge Function
  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-ticket-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'ticket_id', NEW.id,
      'event_type', 'new_ticket'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigir função notify_agency_new_ticket_message
CREATE OR REPLACE FUNCTION notify_agency_new_ticket_message()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket RECORD;
  v_sender_role TEXT;
  v_url TEXT;
  v_key TEXT;
BEGIN
  -- Buscar o ticket
  SELECT id, agency_id INTO v_ticket
  FROM tickets
  WHERE id = NEW.ticket_id;
  
  -- Verificar se o ticket pertence a uma imobiliária
  IF v_ticket.agency_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se a mensagem foi enviada por um usuário Tridots (master ou analyst)
  -- CORREÇÃO: Buscar role da tabela user_roles ao invés de profiles
  SELECT role INTO v_sender_role FROM user_roles WHERE user_id = NEW.sender_id;
  IF v_sender_role IS NULL OR v_sender_role NOT IN ('master', 'analyst') THEN
    RETURN NEW;
  END IF;
  
  -- Buscar credenciais
  SELECT value INTO v_url FROM system_settings WHERE key = 'supabase_url';
  SELECT value INTO v_key FROM system_settings WHERE key = 'service_role_key';
  
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'System settings not configured for ticket message notification';
    RETURN NEW;
  END IF;
  
  -- Chamar Edge Function
  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-ticket-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'ticket_id', NEW.ticket_id,
      'message_id', NEW.id,
      'event_type', 'new_reply'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Resultado Esperado

Após a correção, ambos os portais (Tridots e Imobiliária) conseguirão criar e responder chamados normalmente, com as notificações por e-mail sendo disparadas corretamente quando um usuário Tridots criar ou responder um ticket.
