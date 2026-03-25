

# Plano: Corrigir Parcelas Marcadas como "Paga" sem Fatura Paga

## Problema Identificado

A análise dos dados revelou a **causa raiz**: os dois contratos (`298e7156` e `73d93ca5`) são **contratos migrados** (`is_migrated = true`). A lógica de migração marca automaticamente como "paga" parcelas com `due_date` anterior à `created_at` do sistema — mas essa regra está incorreta para contratos Boleto Unificado, pois **a parcela só deve ser "paga" quando a fatura correspondente é efetivamente paga pela imobiliária**.

**Dados encontrados:**
- Contrato `298e7156`: parcela #1 (março/2026), `due_date = 2026-03-10`, `created_at = 2026-03-11`, `paid_at = 2026-03-11` → Fatura `a51ad834` com status `gerada` (NÃO paga)
- Contrato `73d93ca5`: parcela #1 (março/2026), `due_date = 2026-03-10`, `created_at = 2026-03-12`, `paid_at = 2026-03-12` → Fatura `a51ad834` com status `gerada` (NÃO paga)

**Escopo total do problema**: Apenas essas 2 parcelas estão incorretas (parcelas com `invoice_item_id` vinculado a faturas não pagas). As demais parcelas "paga" de contratos migrados sem `invoice_item_id` são históricas e corretas (pré-sistema).

## Solução

### 1. Migração SQL — Correção retroativa dos dados

Executar uma migração que:
- Corrige as 2 parcelas afetadas: de `status = 'paga'` → `status = 'faturada'`, `paid_at = NULL`
- A query genérica corrige **qualquer** parcela que tenha `status = 'paga'` mas cuja fatura vinculada **não está paga**:

```sql
UPDATE guarantee_installments gi
SET status = 'faturada', paid_at = NULL
FROM invoice_items ii
JOIN agency_invoices ai ON ai.id = ii.invoice_id
WHERE gi.invoice_item_id = ii.id
  AND gi.status = 'paga'
  AND ai.status != 'paga';
```

### 2. Safeguard no código — Prevenir recorrência

Modificar o hook `useAgencyInvoices.ts` no `useRegisterInvoicePayment` para adicionar uma **verificação pré-condição**: antes de marcar parcelas como pagas, verificar que a fatura realmente acabou de ser paga com sucesso.

Isso já é feito corretamente no fluxo atual — o problema veio da lógica de migração manual. A prevenção real está na **Etapa 3**.

### 3. Safeguard na Edge Function `generate-installments`

Garantir que a função **nunca** crie ou altere parcelas com `status = 'paga'` — todas devem ser criadas como `'pendente'` e movidas para `'faturada'` ao vincular à fatura. Atualmente a função já faz isso corretamente, então o problema foi externo (migração manual).

Para prevenir futuras migrações incorretas, adicionar um **trigger de validação** no banco que impede `status = 'paga'` se a fatura vinculada não estiver paga:

```sql
CREATE OR REPLACE FUNCTION validate_installment_paid_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'paga' AND NEW.invoice_item_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM invoice_items ii
      JOIN agency_invoices ai ON ai.id = ii.invoice_id
      WHERE ii.id = NEW.invoice_item_id AND ai.status = 'paga'
    ) THEN
      -- Allow if no invoice linked (legacy migrated)
      RAISE EXCEPTION 'Não é possível marcar parcela como paga quando a fatura vinculada não está paga';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Nota**: este trigger precisa ser `SECURITY DEFINER` e deve permitir a exceção quando o `registerPayment` no `useAgencyInvoices` atualiza a fatura para "paga" primeiro e depois atualiza as parcelas (a fatura já estará paga quando as parcelas forem atualizadas).

## Arquivos Alterados

| Arquivo/Recurso | Operação |
|---|---|
| Nova migração SQL | Correção retroativa + trigger de validação |
| Nenhum arquivo `.ts` | O fluxo de código já está correto |

## Resultado

- As 2 parcelas afetadas voltam ao status `faturada`
- A Fatura 03/2026 da Massaru exibirá corretamente as parcelas como pendentes
- O trigger impede que qualquer processo futuro marque parcelas como pagas sem fatura correspondente paga

