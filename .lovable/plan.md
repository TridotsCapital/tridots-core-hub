

# Plano: Corrigir Sistema de Não Lidos nos Chamados (Ambos Portais)

## Problema Raiz

O sistema de chamados não lidos **nunca funcionou corretamente** porque existem 2 bugs encadeados:

### Bug 1: Trigger detecta direção errada
As funções de trigger `notify_agency_new_ticket()` e `notify_agency_new_ticket_message()` tentam detectar a role do remetente assim:
```sql
SELECT role INTO _user_role FROM public.profiles WHERE id = NEW.sender_id;
```
Mas a tabela `profiles` **não tem coluna `role`** — roles ficam em `user_roles`. Resultado: `_user_role` é sempre NULL, e a direção da notificação é determinada incorretamente.

### Bug 2: Notificações in-app não alcançam todos os usuários da agência
O edge function `send-ticket-notification` só cria notificação in-app (`notifications` table) para:
- `tridots_to_agency`: apenas o `assigned_to` (se tiver). O `responsavel_email` é adicionado sem `user_id`, então não recebe notificação in-app.
- `agency_to_tridots`: masters/analysts recebem corretamente.

Resultado: a maioria dos usuários da agência **nunca** recebe registro em `notifications` com `source = 'chamados'`, e o `useUnreadItemIds` nunca os identifica como não lidos.

## Solução

### 1. Corrigir triggers — consultar `user_roles` em vez de `profiles`

Migração SQL para recriar as funções de trigger:

```sql
CREATE OR REPLACE FUNCTION public.notify_agency_new_ticket()
  -- SELECT role INTO _user_role FROM user_roles WHERE user_id = NEW.created_by

CREATE OR REPLACE FUNCTION public.notify_agency_new_ticket_message()
  -- SELECT role INTO _user_role FROM user_roles WHERE user_id = NEW.sender_id
```

### 2. Corrigir edge function — notificar TODOS os usuários da agência

No `send-ticket-notification/index.ts`, para direção `tridots_to_agency`:
- Buscar **todos os `agency_users`** da agência do ticket (não só o `assigned_to`)
- Criar notificação in-app para cada um deles (com `user_id`)
- Manter e-mail apenas para `responsavel_email` (sem duplicar)

### 3. Nenhuma alteração no frontend

O frontend já está correto:
- `useUnreadItemIds` consulta `notifications` com `source = 'chamados'` 
- `TicketConversationItem` e `AgencyTicketList` já aplicam `bg-blue-50/60` + bold para não lidos
- Toggle de leitura (Mail/MailOpen) já funciona
- `useMarkItemAsRead`/`useMarkItemAsUnread` já atualizam a tabela `notifications`

## Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL (nova) | Recriar 2 trigger functions consultando `user_roles` |
| `supabase/functions/send-ticket-notification/index.ts` | Notificar todos `agency_users` (não só `assigned_to`) |

## Resultado Esperado

- Novo chamado → todos os usuários do portal oposto recebem `notifications` com `source: 'chamados'`
- Nova resposta → idem
- Ambos portais exibem destaque visual (fundo azul + bold) para chamados com notificações não lidas
- Marcar como não lido manualmente também funciona (já implementado)

