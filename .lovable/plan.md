
# Reestruturacao do Fluxo de Faturas: Criacao Automatica na Ativacao do Contrato

## Resumo

Mudar fundamentalmente o fluxo de faturamento: ao inves de gerar faturas mensalmente (manual ou via cron), as faturas serao criadas automaticamente junto com as 12 parcelas no momento da ativacao do contrato. Isso garante que sempre exista uma fatura para cada mes/agencia, simplificando toda a interface.

---

## 1. Edge Function: generate-installments (refatoracao principal)

**Arquivo**: `supabase/functions/generate-installments/index.ts`

Apos criar as 12 parcelas, a funcao deve tambem:
- Para cada parcela, verificar se ja existe uma fatura (`agency_invoices`) para aquela agencia/mes/ano com status diferente de `cancelada`
- Se existir: adicionar um `invoice_item` vinculando a parcela a fatura existente, atualizar o `total_value` da fatura (somando o valor da nova parcela), e marcar a parcela como `faturada` com o `invoice_item_id`
- Se nao existir: criar uma nova fatura com status `rascunho`, calcular o `due_date` usando o `billing_due_day` da agencia, criar o `invoice_item`, e marcar a parcela como `faturada`
- Registrar evento na `invoice_timeline` para cada fatura criada/atualizada

Isso garante que ao ativar um contrato, todas as 12 faturas mensais ja existam.

---

## 2. Remover botao "Gerar Rascunhos" e simplificar Tridots

**Arquivo**: `src/pages/FinancialInvoices.tsx`

- Remover o botao "Gerar Rascunhos" e todo o dialog associado (linhas 77-133, 237-294)
- Remover a funcao `handleGenerateForAgency` (nao e mais necessaria)
- Na lista de imobiliarias, o botao sempre sera "Ver Detalhes" e sempre tera `invoiceId` (pois a fatura ja existe)
- Adicionar filtro de vencimento com chips/botoes ("Todos", "Dia 5", "Dia 10", "Dia 15") acima da lista de imobiliarias
- Para o filtro funcionar, o hook `useAgenciesWithInvoiceInMonth` precisara retornar tambem o `billing_due_day` de cada agencia

---

## 3. Filtro por dia de vencimento

**Arquivo**: `src/hooks/useMonthlyInvoiceSummary.ts`

No hook `useAgenciesWithInvoiceInMonth`:
- Simplificar: como faturas sempre existem, remover a logica de fallback para parcelas pendentes sem fatura
- Adicionar `billing_due_day` no select da agencia para permitir filtragem no front-end
- Retornar o campo `billingDueDay` no `AgencyInvoiceSummary`

**Arquivo**: `src/pages/FinancialInvoices.tsx`

- Novo state `dueDayFilter` (null | 5 | 10 | 15)
- Renderizar chips: `Todos`, `Dia 5`, `Dia 10`, `Dia 15`
- Filtrar a lista de agencias no front-end com base no `billingDueDay`

---

## 4. Atualizar comissoes na baixa de pagamento

**Arquivo**: `src/hooks/useAgencyInvoices.ts` (funcao `useRegisterInvoicePayment`)

Apos marcar parcelas como `paga`, adicionar logica para:
- Buscar os `contract_id` das parcelas pagas
- Para cada contrato, buscar comissoes com status `pendente` e `due_date` no mes de referencia da fatura
- Atualizar essas comissoes de `pendente` para `a_pagar`
- Invalidar queries de comissoes para atualizar a interface

---

## 5. Remover/desativar generate-invoice-drafts do cron

**Arquivo**: `supabase/functions/generate-invoice-drafts/index.ts`

Manter a funcao mas ajustar para ser um fallback de seguranca (caso alguma parcela nao tenha sido faturada corretamente). Ela pode ser mantida no cron como verificacao, mas nao sera mais o fluxo principal.

---

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-installments/index.ts` | Criar faturas e invoice_items junto com as parcelas |
| `src/pages/FinancialInvoices.tsx` | Remover "Gerar Rascunhos", adicionar filtro de vencimento (chips), simplificar botao |
| `src/hooks/useMonthlyInvoiceSummary.ts` | Simplificar `useAgenciesWithInvoiceInMonth`, adicionar `billingDueDay` |
| `src/hooks/useAgencyInvoices.ts` | Atualizar comissoes para `a_pagar` na baixa de pagamento |
| `supabase/functions/generate-invoice-drafts/index.ts` | Ajustar para ser fallback de seguranca |

---

## Fluxo resultante

```text
Contrato ativado
  |
  v
generate-installments cria 12 parcelas
  |
  v
Para cada parcela: cria/atualiza fatura do mes (agency_invoices + invoice_items)
  |
  v
Portal Tridots: lista imobiliarias com faturas por mes
  |-- Filtro: Todos / Dia 5 / Dia 10 / Dia 15
  |-- Clica na imobiliaria -> abre detalhe da fatura (sempre existe)
  |
  v
Detalhe da fatura: lista parcelas, upload boleto, registrar pagamento
  |
  v
Registrar Pagamento -> marca parcelas como pagas + comissoes como a_pagar
```
