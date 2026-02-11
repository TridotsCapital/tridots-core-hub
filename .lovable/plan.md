
# Correcao: Comissoes nao geradas para contratos Boleto Unificado

## Problema raiz

No Edge Function `validate-payments/index.ts`, na linha 147, existe uma condicao que **pula a geracao de comissoes** para contratos do tipo boleto unificado:

```
if (!isBoletoUnificado) {
  await generateCommissions(supabase, analysis, guaranteePaymentDate!);
}
```

Isso significa que **nenhum contrato de boleto unificado jamais teve comissoes geradas**. Consequentemente:
- A aba de comissoes do contrato aparece vazia
- O registro de pagamento da fatura tenta atualizar comissoes que nao existem

## Solucao

### Parte 1: Corrigir a Edge Function `validate-payments`

**Arquivo**: `supabase/functions/validate-payments/index.ts`

Remover a condicao `if (!isBoletoUnificado)` para que comissoes sejam geradas para **todos** os contratos, independentemente do metodo de pagamento. Para contratos boleto_imobiliaria, usar a data de ativacao (activated_at ou now) como base para calcular as datas de vencimento das comissoes.

Alteracoes:
- Remover o `if (!isBoletoUnificado)` na linha 147
- Para boleto_imobiliaria, usar `new Date().toISOString().split('T')[0]` como `validationDate` (ja que nao tem `guaranteePaymentDate`)
- Gerar comissoes normalmente (1 setup + 12 recorrentes)

### Parte 2: Backfill de comissoes para contratos existentes

**Arquivo**: `supabase/functions/generate-installments/index.ts`

Adicionar geracao de comissoes dentro da funcao `generate-installments`, apos criar as parcelas e faturas. Assim, quando rodarmos o backfill para contratos existentes que ja tem parcelas, as comissoes tambem serao criadas.

Alternativamente, podemos criar um script SQL de backfill que gera as comissoes retroativas para todos os contratos boleto_imobiliaria que nao possuem comissoes.

A abordagem mais segura e executar um backfill via SQL diretamente, usando os dados das `analyses` vinculadas aos contratos boleto_imobiliaria que nao tem comissoes.

### Parte 3: Backfill SQL (executar uma vez)

Criar e executar uma query que:
1. Identifica todos os contratos boleto_imobiliaria com analysis_id que nao possuem registros na tabela `commissions`
2. Para cada um, insere 1 comissao setup (status `a_pagar`) e 12 comissoes recorrentes (status `pendente`)
3. Usa os dados de `plano_garantia`, `garantia_anual` e `setup_fee` da analise para calcular os valores

### Parte 4: Atualizar comissoes das faturas ja pagas

Apos o backfill, executar uma segunda query que:
1. Identifica faturas com status `paga`
2. Para cada fatura paga, busca os `analysis_id` vinculados via `invoice_items -> contracts`
3. Atualiza as comissoes recorrentes do mes/ano de referencia correspondente de `pendente` para `a_pagar`

---

## Detalhes Tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/validate-payments/index.ts` | Remover condicao `!isBoletoUnificado` da geracao de comissoes |
| Backfill SQL | Gerar comissoes retroativas para contratos sem comissoes |
| Backfill SQL | Atualizar status das comissoes para faturas ja pagas |

### Fluxo corrigido

```text
Validacao de pagamento (validate-payments)
  |
  v
Criar contrato + gerar parcelas/faturas (boleto)
  |
  v
Gerar comissoes (1 setup a_pagar + 12 recorrentes pendente) -- AGORA PARA TODOS
  |
  v
Registro de pagamento da fatura (useRegisterInvoicePayment)
  |
  v
Comissoes recorrentes do mes -> status 'a_pagar' -- AGORA FUNCIONA
```
