

# Alteração: Contrato #948535E3 - Cartão 12x para Boleto Unificado

## Situação Atual

| Campo | Valor |
|-------|-------|
| Contrato | 948535e3-8195-4799-9fec-fd05b814c4d0 |
| Inquilino | Gustavo Henrique Jacob Magioni |
| Imobiliária | Canah Imóveis (billing_due_day = 10) |
| Status | documentacao_pendente (NAO ativado) |
| Forma de pagamento | card_12x |
| Parcelas geradas | 0 |
| Faturas geradas | 0 |
| Stripe vinculado | Nenhum |

## Impedimentos

**Nenhum.** O contrato ainda nao foi ativado, nao possui parcelas, faturas ou assinatura Stripe. A alteracao e segura.

## Acao Necessaria

Atualizar o campo `forma_pagamento_preferida` na tabela `analyses` de `card_12x` para `boleto_imobiliaria`:

```text
UPDATE analyses
SET forma_pagamento_preferida = 'boleto_imobiliaria'
WHERE id = 'd3010928-ee0d-4d5f-b934-f6afe00f017c';
```

## Detalhes Tecnicos

Como o banco de consultas e somente leitura, a alteracao sera feita via uma edge function utilitaria que executa o UPDATE com service role e retorna o resultado.

### Arquivo: `supabase/functions/fix-payment-method/index.ts`

Edge function temporaria que:
1. Recebe o `analysis_id` e o novo `forma_pagamento_preferida`
2. Executa o UPDATE na tabela `analyses`
3. Retorna confirmacao

Apos a execucao bem-sucedida, a edge function sera removida (nao e necessaria em producao permanentemente).

## Resultado Esperado

Quando o contrato for ativado futuramente, o sistema seguira o fluxo correto de Boleto Unificado:
- Geracao automatica de 12 parcelas em `guarantee_installments`
- Vinculacao as faturas mensais da Canah Imoveis em `agency_invoices`
- Sem criacao de checkout Stripe

