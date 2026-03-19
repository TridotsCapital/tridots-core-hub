

# Plano: Destaque Visual Forte para Chamados Não Lidos + Toggle em Todas as Listas

## Problema Identificado

Existem **3 locais** que renderizam listas de chamados. Dois deles (`TicketConversationItem` e `AgencyTicketList`) já possuem o toggle lido/não lido, mas com estilo sutil. O terceiro (`AgencySupport.tsx` linhas 263-337) renderiza uma lista inline própria que **não tem o botão de toggle** — só tem a bolinha vermelha estática.

Além disso, o destaque visual atual (`bg-red-50/50`) é muito discreto e não chama atenção suficiente.

## Alterações

### 1. `src/pages/agency/AgencySupport.tsx` — Adicionar toggle + destaque forte

A lista inline (linhas 263-337) precisa:
- Importar `useMarkItemAsUnread`, `Mail`, `MailOpen`, `Tooltip`
- Adicionar botão de toggle lido/não lido no hover (mesmo padrão dos outros componentes)
- Aplicar destaque visual forte: `bg-blue-50 border-l-4 border-l-blue-500 font-semibold` para não lidos
- Manter o assunto em negrito (bold) quando não lido, normal quando lido

### 2. `src/components/tickets/TicketConversationItem.tsx` — Destaque visual mais forte

Atualizar o estilo de chamados não lidos:
- Trocar `bg-red-50/50` por `bg-blue-50 dark:bg-blue-950/30`
- Adicionar `border-l-blue-500` (borda esquerda azul forte) quando não lido
- Colocar o subject em `font-bold` quando não lido (vs `font-medium` quando lido)
- Manter o botão toggle no hover como está

### 3. `src/components/agency/AgencyTicketList.tsx` — Destaque visual mais forte

Mesmo ajuste:
- Trocar `bg-red-50/50 border-red-200` por `bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500`
- Subject em `font-bold` quando não lido

### Resumo de arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/agency/AgencySupport.tsx` | Adicionar toggle lido/não lido + destaque forte na lista inline |
| `src/components/tickets/TicketConversationItem.tsx` | Reforçar estilo visual de não lido (fundo + borda azul + bold) |
| `src/components/agency/AgencyTicketList.tsx` | Reforçar estilo visual de não lido (fundo + borda azul + bold) |

Sem alterações no banco de dados — a lógica de `notifications` com `read_at` por usuário já funciona corretamente.

