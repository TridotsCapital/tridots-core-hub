

# Plano: Simplificar Destaque de Não Lidos nos Chamados

## Problema

O `TicketConversationItem` usa `border-l-4` com 3 cores diferentes (vermelho = urgente/demorado, verde = recente/resolvido, azul = não lido), criando ruído visual. O `AgencyTicketList` também usa `border-l-4 border-l-blue-500` para não lidos.

## Solução: Remover bordas coloridas, usar apenas fundo + bold

Abordagem minimalista — chamados não lidos se destacam apenas por:
- **Fundo azul sutil** (`bg-blue-50/60`)
- **Assunto em negrito** (`font-bold`)
- **Bolinha pulsante** (já existe, mantém)
- **Sem borda lateral colorida** em nenhum caso

Chamados lidos ficam com fundo normal, sem borda, sem destaque.

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/tickets/TicketConversationItem.tsx` | Remover `getWaitTimeColor()` e `border-l-4`. Não lido = `bg-blue-50/60` + bold. Lido = sem destaque. |
| `src/components/agency/AgencyTicketList.tsx` | Remover `border-l-4 border-l-blue-500`. Não lido = `bg-blue-50/60` + bold. Lido = sem destaque. |
| `src/pages/agency/AgencySupport.tsx` | Mesmo ajuste na lista inline (se aplicável). |

Resultado: visual limpo, apenas 1 forma de destaque (fundo claro + bold), sem bordas laterais coloridas.

