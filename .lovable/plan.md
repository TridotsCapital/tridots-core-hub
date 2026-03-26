

# Plano: Corrigir Valores de Aluguel + Remover Duplicatas de Faturas

## Problema 1 — Valores invertidos (Nathaniely e Gislaine)

Na alteração anterior, o valor informado (que era o **aluguel corrigido**) foi aplicado diretamente como `garantia_anual`. O correto é:

| Contrato | Inquilino | valor_aluguel atual | Correto | garantia_anual atual | Correta (aluguel × 12 × 10%) |
|---|---|---|---|---|---|
| #844217A0 | Nathaniely | R$ 1.307,75 | **R$ 1.465,82** | R$ 1.465,82 | **R$ 1.758,98** |
| #078FBDAD | Gislaine | R$ 740,10 | **R$ 762,30** | R$ 762,30 | **R$ 914,76** |

## Problema 2 — Invoice items duplicados

Contratos com itens duplicados em **todas as 12 faturas mensais**:

**Massaru Imóveis** (2 contratos):
- Natan Fratta da Silva (#a843a9ec) — 12 meses duplicados
- Leticia Renata de Oliveira (#f6b6f948) — 12 meses duplicados

**Canah Imóveis** (7 contratos):
- Anne Raissa, Carlos Eduardo, Ediucio, Gilda, Leonardo, Marcia, Ricardo — todos com 12 meses duplicados

**Total**: 9 contratos × 12 meses = **~108 invoice_items duplicados** a remover.

Causa provável: a reconciliação anterior criou novos `invoice_items` sem verificar que já existiam itens vinculados para o mesmo contrato/mês.

## Execução

### Etapa 1 — Corrigir valores (Nathaniely e Gislaine)
- Atualizar `valor_aluguel` e `valor_total` na tabela `analyses`
- Recalcular `garantia_anual = valor_total × 12 × taxa_garantia_percentual / 100`
- Atualizar valor mensal em todas as 12 `guarantee_installments` e `invoice_items`
- Recalcular `total_value` das faturas impactadas
- Registrar auditoria na `analysis_timeline`

### Etapa 2 — Remover duplicatas (9 contratos, 2 imobiliárias)
- Para cada contrato/mês duplicado: manter o `invoice_item` mais antigo (menor `created_at`), deletar o(s) mais novo(s)
- Garantir que a `guarantee_installment` aponte para o item mantido (`invoice_item_id`)
- Recalcular `total_value` de todas as faturas afetadas pela soma real dos itens restantes

### Etapa 3 — Migração: prevenir recorrência
- Criar constraint `UNIQUE(invoice_id, contract_id, installment_number)` na tabela `invoice_items`
- Isso impede que qualquer processo futuro (reconciliação, geração) crie itens duplicados

### Etapa 4 — Verificação
- Zero duplicatas em `invoice_items` no sistema inteiro
- Valores corretos para Nathaniely e Gislaine
- Totais das faturas batendo com a soma dos itens

## Detalhes técnicos

| Recurso | Operação |
|---|---|
| `analyses` | UPDATE valor_aluguel, valor_total, garantia_anual (2 contratos) |
| `guarantee_installments` | UPDATE value (24 parcelas) |
| `invoice_items` | UPDATE value (24 itens) + DELETE ~108 duplicatas |
| `agency_invoices` | UPDATE total_value (faturas impactadas) |
| `analysis_timeline` | INSERT eventos de auditoria |
| Nova migração SQL | UNIQUE constraint em invoice_items |

