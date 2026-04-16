

# Plano: Ordenar Chamados por Última Mensagem + Exibir Data

## Resumo

Ordenar a lista de chamados em ambos os portais (Tridots e Imobiliária) pela data da última mensagem (decrescente), e substituir a data atual exibida no card pela data da última mensagem. Chamados sem mensagem usam `created_at` como fallback. Formato: relativo para < 24h ("há 5 min"), absoluto para > 24h ("16/04 14:30").

## Situação Atual

- **Ordenação**: ambos os portais ordenam por `updated_at` (que muda com qualquer update no ticket, não apenas mensagens)
- **Data exibida**: Tridots mostra `updated_at` relativo; Imobiliária mostra `created_at` relativo
- **Dados**: não existe consulta da última mensagem (`ticket_messages`) junto com a listagem de tickets

## Mudanças

### 1. Hook `useTickets.ts` — buscar data da última mensagem

Nas funções `useTickets()` e `useAgencyTickets()`, após buscar os tickets, fazer uma query em `ticket_messages` agrupando por `ticket_id` para obter o `MAX(created_at)` de cada ticket. Retornar um campo `last_message_at` em cada ticket.

Abordagem: query separada em `ticket_messages` com os IDs dos tickets carregados:
```sql
SELECT ticket_id, MAX(created_at) as last_message_at
FROM ticket_messages
WHERE ticket_id IN (...)
GROUP BY ticket_id
```

### 2. Ordenação no frontend

Substituir a ordenação por `updated_at` pela ordenação por `last_message_at` (com fallback para `created_at`) em:
- `src/pages/TicketCenter.tsx` (Tridots) — linha 77
- `src/pages/agency/AgencySupport.tsx` (Imobiliária) — linha 119

### 3. Exibir data da última mensagem nos cards

**Portal Tridots** (`TicketConversationItem.tsx`):
- Substituir `updated_at` (linha 107) por `last_message_at || created_at`
- Formato: relativo se < 24h, absoluto (dd/MM HH:mm) se > 24h

**Portal Imobiliária** (`AgencySupport.tsx`):
- Substituir `created_at` (linha 354) por `last_message_at || created_at`
- Mesmo formato híbrido
- Adicionar label "Última msg" para clareza

### 4. Realtime — manter ordenação atualizada

As subscriptions realtime em `useTickets` já invalidam a query quando tickets mudam. Adicionar subscription em `ticket_messages` (INSERT) para invalidar a lista quando nova mensagem chegar, garantindo reordenação automática.

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useTickets.ts` | Buscar `last_message_at` via query em `ticket_messages` nas funções `useTickets` e `useAgencyTickets` |
| `src/pages/TicketCenter.tsx` | Ordenar por `last_message_at`, passar dado ao componente |
| `src/pages/agency/AgencySupport.tsx` | Ordenar por `last_message_at`, exibir no card |
| `src/components/tickets/TicketConversationItem.tsx` | Receber e exibir `last_message_at` com formato híbrido |
| `src/types/tickets.ts` | Adicionar campo `last_message_at?: string` à interface `Ticket` |

