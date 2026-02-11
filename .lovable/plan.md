
# Correcao: Modulo de Faturas mostrando apenas fevereiro

## Problema

O banco de dados mostra que existem parcelas pendentes nos meses 3 a 13 (marco 2026 em diante) para ambas as imobiliarias, mas so existem registros em `agency_invoices` para fevereiro/2026. Isso aconteceu porque os contratos foram ativados **antes** da nova logica que cria faturas automaticamente junto com as parcelas.

Resultado: o grafico e a lista so mostram dados de fevereiro, porque o hook `useMonthlyInvoiceSummary` busca apenas a tabela `agency_invoices`.

## Solucao (2 partes)

### Parte 1: Backfill das faturas faltantes

Ajustar a Edge Function `generate-invoice-drafts` para processar **todos os meses** com parcelas orfas (sem fatura vinculada), ao inves de apenas um mes especifico. Adicionar um modo "backfill_all" que varre todos os meses pendentes de uma vez.

Depois, chamar essa funcao uma vez para criar as faturas faltantes para meses 3-13.

**Arquivo**: `supabase/functions/generate-invoice-drafts/index.ts`

Alteracoes:
- Adicionar parametro `backfill_all: true` que busca TODAS as parcelas orfas sem filtro de mes/ano
- Agrupar por agencia + mes/ano e criar/atualizar faturas para cada combinacao
- Manter compatibilidade com o modo atual (filtro por mes especifico)

### Parte 2: Fallback no hook (seguranca)

Ajustar `useMonthlyInvoiceSummary` para, alem de buscar `agency_invoices`, tambem buscar parcelas de `guarantee_installments` que ainda nao estao vinculadas a faturas. Isso garante que o grafico mostra os valores corretos mesmo antes do backfill completar.

**Arquivo**: `src/hooks/useMonthlyInvoiceSummary.ts`

Alteracoes:
- Apos mapear faturas existentes, buscar parcelas com status `pendente` e `invoice_item_id IS NULL`
- Para cada parcela orfa, somar o valor no mes correspondente do grafico
- Marcar esses meses como `status: 'pendente'` e `hasInvoice: false`

### Parte 3: Executar o backfill

Apos deploy da funcao atualizada, chama-la com `backfill_all: true` para criar todas as faturas faltantes de uma vez.

---

## Detalhes Tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-invoice-drafts/index.ts` | Adicionar modo `backfill_all` que processa todos os meses com parcelas orfas |
| `src/hooks/useMonthlyInvoiceSummary.ts` | Adicionar query de fallback para parcelas orfas sem fatura |

### Fluxo

```text
Hook useMonthlyInvoiceSummary:
  1. Busca agency_invoices (faturas existentes) -> mapeia por mes/ano
  2. Busca guarantee_installments orfas (pendente + sem invoice_item_id)
  3. Soma valores das orfas nos meses correspondentes
  4. Resultado: grafico mostra todos os meses com valores corretos

Backfill (uma vez):
  1. Chama generate-invoice-drafts com backfill_all=true
  2. Cria faturas + invoice_items para todas as parcelas orfas
  3. Atualiza parcelas para status=faturada
```
