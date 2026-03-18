

# Plano: Correções no Chat de Chamados — Data/Hora nas Mensagens + Marcar como Não Lido

## Problemas Identificados

1. **Data das mensagens**: O componente `TicketChatMessages.tsx` (portal Tridots, linha 174) mostra apenas `HH:mm` sem a data. O `AgencyTicketChatArea.tsx` (portal imobiliária, linha 504) tem o mesmo problema.
2. **Marcar como não lido**: Nenhuma funcionalidade existe no sistema para reverter um chamado para "não lido". Atualmente, ao abrir um chamado, ele e marcado como lido automaticamente e nao ha como desfazer.

## Alteracoes

### 1. Exibir data + hora nas mensagens do chat

**Arquivos**: `TicketChatMessages.tsx` e `AgencyTicketChatArea.tsx`

- Agrupar mensagens por dia (separador visual com a data, ex: "Hoje", "Ontem", "14/03/2025")
- Em cada mensagem, exibir `HH:mm` (como ja faz), mas com o separador de dia provendo contexto
- Usar `formatDateBR` com `parseISO` para evitar bug de timezone

### 2. Botao "Marcar como nao lido" nos chamados

**Arquivos**: `useUnreadItemIds.ts`, `TicketConversationItem.tsx`, `AgencyTicketList.tsx`, `TicketChatArea.tsx`, `AgencyTicketChatArea.tsx`

- Adicionar funcao `useMarkItemAsUnread()` em `useUnreadItemIds.ts` que insere uma notificacao sintetica com `read_at = null` na tabela `notifications` para o chamado, reativando o indicador de nao lido
- Adicionar botao de contexto (icone de envelope) no header do chat em ambos os portais (Tridots e Imobiliaria) que chama essa funcao e fecha/deseleciona o chamado
- O botao estara visivel no header do chat aberto, ao lado do status/acoes existentes

### Resumo de arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/tickets/TicketChatMessages.tsx` | Separadores de data entre mensagens + formato data/hora |
| `src/components/agency/AgencyTicketChatArea.tsx` | Separadores de data + botao marcar como nao lido |
| `src/components/tickets/TicketChatArea.tsx` | Botao marcar como nao lido |
| `src/hooks/useUnreadItemIds.ts` | Adicionar `useMarkItemAsUnread()` |
| `src/components/tickets/TicketConversationItem.tsx` | Nenhuma alteracao (ja suporta `hasUnread`) |

