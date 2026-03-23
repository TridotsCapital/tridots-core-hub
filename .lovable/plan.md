

# Plano: Corrigir Data/Hora da Primeira Mensagem dos Chamados

## Problema

A "primeira mensagem" de cada chamado é na verdade o campo `ticket.description`, renderizado como uma mensagem visual no chat, mas **sem data/hora**. As mensagens reais (tabela `ticket_messages`) mostram horário normalmente.

## Solução

### 1. Exibir data/hora na descrição (ambos portais)

Usar `ticket.created_at` como timestamp da descrição, já que é quando o chamado foi criado.

| Arquivo | Alteração |
|---------|-----------|
| `src/components/tickets/TicketChatMessages.tsx` | Receber `createdAt` como prop e exibir horário abaixo da descrição (mesmo formato das outras mensagens) |
| `src/components/tickets/TicketChatArea.tsx` | Passar `ticket.created_at` para o componente |
| `src/components/agency/AgencyTicketChatArea.tsx` | Adicionar horário abaixo da descrição usando `ticket.created_at` |

### 2. Correção retroativa — sem necessidade de migração

Não há dados faltando no banco. O `ticket.created_at` já existe e está correto para todos os chamados. O problema é apenas de **exibição** — a UI não mostrava esse timestamp.

## Resumo

Alteração puramente visual em 3 arquivos. Sem mudanças no banco de dados.

