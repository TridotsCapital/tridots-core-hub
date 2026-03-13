

# Plano: Nova Regra de Corte — Primeira Parcela Sempre no Mês Seguinte + Parcela Extra no Cancelamento

## Resumo da Mudança

**Regra atual**: Se o contrato é ativado antes do `billing_due_day`, a primeira parcela entra no mesmo mês.

**Nova regra**: A primeira parcela é **sempre no mês seguinte** à ativação, independentemente do dia. Se o contrato for cancelado antes do fim da vigência e ainda faltar 1 parcela (porque a primeira foi deslocada), a imobiliária paga uma parcela extra no mês seguinte ao cancelamento.

## Alterações

### 1. Edge Function `generate-installments/index.ts` — Regra de corte

Remover a condição `if (activationDay < billingDueDay)` (linhas 146-158) e sempre iniciar no mês seguinte:

```typescript
// SEMPRE começa no mês seguinte à ativação
firstMonth = activationDate.getMonth() + 1;
firstYear = activationDate.getFullYear();
if (firstMonth > 11) {
  firstMonth = 0;
  firstYear++;
}
```

### 2. Lógica de cancelamento — `ContractActions.tsx`

Ao cancelar um contrato, após atualizar o status para `cancelado`, adicionar lógica para:

1. Contar quantas parcelas já foram pagas (`status = 'paga'`)
2. Verificar se são menos de 12
3. Se sim, gerar **1 parcela extra** no mês seguinte ao cancelamento, vinculando-a à fatura correspondente da agência (criando ou atualizando `agency_invoices` e `invoice_items`)
4. Registrar evento na `analysis_timeline` documentando a parcela compensatória

### 3. Documentação visual (sem alteração de código UI)

A regra não altera interfaces visuais — apenas a lógica de geração de parcelas e o fluxo de cancelamento.

### Resumo de arquivos afetados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-installments/index.ts` | Primeira parcela sempre no mês seguinte |
| `src/components/contracts/ContractActions.tsx` | Gerar parcela compensatória no cancelamento |

