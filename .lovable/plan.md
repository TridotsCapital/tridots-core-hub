

# Correção: E-mail de Chamado Não Chega ao Colaborador Destinatário

## Problema

Quando a Tridots abre um chamado selecionando um colaborador específico da imobiliária, o e-mail de notificação vai **apenas** para o master (responsavel_email da agência). O colaborador selecionado não recebe nada.

### Causa Raiz

O formulário de criação (`NewTicketDialog`) coleta o colaborador no campo `selectedCollaboratorId`, mas **nunca envia esse valor** para o banco. O campo `assigned_to` do ticket fica `null`.

A edge function `send-ticket-notification` já tem a lógica correta para enviar e-mail ao `assigned_to`, mas como o valor é sempre `null`, apenas o master recebe.

```text
NewTicketDialog:
  selectedCollaboratorId = "uuid-do-colaborador"  (coletado)
  createTicket({ agency_id, subject, ... })        (NÃO inclui assigned_to)
      |
      v
tickets INSERT: assigned_to = NULL
      |
      v
Edge Function: ticket.assigned_to = NULL -> só envia para master
```

### Bug Secundário

Na direção `agency_to_tridots`, a edge function busca masters/analysts filtrando por `profiles.role`, mas essa coluna não existe na tabela `profiles`. Deveria consultar `user_roles`.

---

## Solução

### 1. `src/components/tickets/NewTicketDialog.tsx`

Passar o `selectedCollaboratorId` como `assigned_to` ao chamar `createTicket.mutateAsync()`:

```text
Antes:
  createTicket.mutateAsync({ agency_id, subject, description, category, priority })

Depois:
  createTicket.mutateAsync({ agency_id, subject, description, category, priority, assigned_to: selectedCollaboratorId || undefined })
```

### 2. `src/hooks/useTickets.ts`

Adicionar `assigned_to` ao `CreateTicketData` interface e incluí-lo no INSERT:

```text
interface CreateTicketData {
  ...campos existentes...
  assigned_to?: string;    // <-- novo campo
}

// No insert:
assigned_to: data.assigned_to || null,
```

### 3. `supabase/functions/send-ticket-notification/index.ts`

Corrigir a busca de destinatários na direção `agency_to_tridots` (linhas 134-138):

```text
Antes:
  .from('profiles')
  .select('id, email, full_name')
  .in('role', ['master', 'analyst'])   <-- coluna 'role' não existe em profiles
  .eq('active', true);

Depois:
  Buscar user_ids da tabela user_roles onde role IN ('master', 'analyst'),
  depois buscar profiles desses user_ids
```

---

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/tickets/NewTicketDialog.tsx` | Passar `assigned_to: selectedCollaboratorId` no submit |
| `src/hooks/useTickets.ts` | Adicionar `assigned_to` na interface e no INSERT |
| `supabase/functions/send-ticket-notification/index.ts` | Corrigir query `agency_to_tridots` para usar `user_roles` |

## Resultado Esperado

1. Tridots cria chamado selecionando colaborador "João" da imobiliária
2. Ticket é criado com `assigned_to = uuid-do-joao`
3. Edge function envia e-mail para:
   - Master da imobiliária (responsavel_email)
   - João (e-mail do colaborador designado)
4. Na direção contrária (imobiliária responde), masters/analysts da Tridots recebem corretamente

