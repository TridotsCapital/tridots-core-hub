
# Correção: Parcelas Não Geradas para Contratos Boleto Unificado

## Problema

O contrato #5327229E (Canah Imóveis) e o contrato a54256b8 (Morar Bem) não tiveram suas parcelas geradas. A causa:

1. A agência "Canah Imóveis" tem `billing_due_day = NULL` no banco
2. A edge function `generate-installments` (linha 83) retorna erro 400 se `billing_due_day` é null
3. O `validate-payments` chama `generate-installments` mas apenas loga o erro (linhas 161-162), sem ação corretiva
4. Resultado: contrato criado com 0 parcelas, 0 faturas, sem alerta ao usuário

```text
validate-payments -> generate-installments({ contract_id })
                        |
                        v
                  Agency billing_due_day = NULL
                        |
                        v
                  Return 400: "Agency billing_due_day not configured"
                        |
                        v
                  validate-payments: console.error(...)  <-- erro silencioso
                        |
                        v
                  Contrato criado SEM parcelas
```

## Solução

### 1. Edge Function `generate-installments/index.ts`

Usar fallback de `billing_due_day = 10` (padrão do sistema) quando o campo é null, em vez de rejeitar:

```text
Antes (linha 83-89):
  if (agencyError || !agency?.billing_due_day) {
    return Response 400: "Agency billing_due_day not configured"
  }

Depois:
  const billingDueDay = agency?.billing_due_day || 10;
  // Log warning mas continua a execução
```

### 2. Migração SQL

- Definir `billing_due_day = 10` para todas as agências que tenham o valor null (padrão do sistema conforme regra de negócio)

### 3. Regenerar parcelas dos contratos afetados

Chamar a edge function `generate-installments` para os 2 contratos que estão com 0 parcelas:
- `5327229e-9125-480d-84d0-96ce3df4bc7d` (Canah Imóveis)
- `a54256b8-fb91-42af-b557-fa3bd2ab4e43` (Morar Bem)

### 4. Edge Function `validate-payments/index.ts`

Melhorar o tratamento de erro: se `generate-installments` falhar, tentar novamente ou lançar erro mais visível (timeline event de warning).

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-installments/index.ts` | Fallback billing_due_day = 10 |
| `supabase/functions/validate-payments/index.ts` | Melhor tratamento de erro na chamada de installments |
| Migração SQL | `UPDATE agencies SET billing_due_day = 10 WHERE billing_due_day IS NULL` |
| Chamada manual | Invocar generate-installments para os 2 contratos afetados |

## Resultado Esperado

1. Contratos existentes sem parcelas terão as 12 parcelas e faturas geradas
2. Novos contratos boleto unificado nunca mais falharão silenciosamente por falta de billing_due_day
3. Todas as agências terão um billing_due_day definido (padrão 10)
