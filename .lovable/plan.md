

# Plano: Indicador Visual de Prazo de Pagamento no Detalhe da Garantia (Tridots)

## O que será feito

Adicionar um banner/card de contagem regressiva no topo da página de detalhe da garantia (`ClaimDetail.tsx`) que mostra quantos dias restam dos 30 dias para pagamento, com cores escalonadas conforme a urgência.

## Regras visuais

- **Verde** (> 20 dias restantes): "X dias restantes para pagamento"
- **Amarelo** (10-20 dias): tom informativo
- **Laranja** (3-9 dias): tom de alerta
- **Vermelho** (1-2 dias): tom urgente
- **Vermelho piscante** (0 ou expirado): "PRAZO EXPIRADO — X dias em atraso"
- Oculto quando `public_status === 'finalizado'`

## Alteração

| Arquivo | Ação |
|---------|------|
| `src/pages/ClaimDetail.tsx` | Adicionar card de prazo entre o header e os controles de status, calculando `daysElapsed` e `daysRemaining` a partir de `claim.created_at` |

A lógica é puramente frontend (cálculo de `differenceInDays(now, created_at)`), sem necessidade de alteração no banco.

