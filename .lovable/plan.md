

# Plano: Toggle Lido/Não Lido nos Chamados (Ambos Portais)

## Situação Atual

O sistema **já possui**:
- Indicador visual de não lido (bolinha vermelha pulsante) nas listas de chamados
- Marcação automática como lido ao abrir um chamado
- Botão "Marcar como não lido" no header do chat (MailOpen)
- Filtro "Não lidos" no portal da imobiliária

O que **falta**:
- Não há como marcar como lido/não lido **diretamente da lista**, sem abrir o chamado
- No portal Tridots (`TicketConversationItem`), não há ação de contexto para toggle

## Alterações

### 1. Portal Tridots — `TicketConversationItem.tsx`

Adicionar um botão de toggle (ícone `Mail`/`MailOpen`) que aparece no hover sobre cada item da lista:
- Se não lido: ícone `MailOpen` → ao clicar, marca como lido (chama `markAsRead`)
- Se lido: ícone `Mail` → ao clicar, marca como não lido (chama `markAsUnread`)
- Posicionado no canto superior direito, substituindo/complementando a bolinha vermelha
- Passa `onMarkAsRead` e `onMarkAsUnread` como props do `TicketConversationList`

### 2. Portal Tridots — `TicketConversationList.tsx`

Passar as callbacks `markAsRead` e `markAsUnread` para cada `TicketConversationItem`, propagando as ações dos hooks existentes.

### 3. Portal Imobiliária — `AgencyTicketList.tsx`

Mesmo padrão: botão de toggle lido/não lido visível no hover de cada card de chamado, usando os mesmos hooks `useMarkItemAsRead` e `useMarkItemAsUnread`.

### Resumo de arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/tickets/TicketConversationItem.tsx` | Adicionar botão toggle lido/não lido no hover |
| `src/components/tickets/TicketConversationList.tsx` | Passar callbacks de read/unread para os items |
| `src/components/agency/AgencyTicketList.tsx` | Adicionar botão toggle lido/não lido no hover de cada card |

