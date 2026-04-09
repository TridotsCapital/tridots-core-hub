

# Plano: Atualizar Data de Início do Contrato #D13A4E7E para 01/03/2026

## Situação Atual

| Campo | Valor atual |
|---|---|
| `guarantee_payment_date` | null |
| `data_fim_contrato` | null |
| `is_migrated` | false |
| Parcelas | 12× ref 05/2026→04/2027, due 2026-05-10→2027-04-10 |
| Invoice items | 12 itens em faturas "rascunho" |
| Comissões | Nenhuma |

## O que precisa mudar

| Campo | Novo valor |
|---|---|
| `analyses.guarantee_payment_date` | `2026-03-01` |
| `contracts.data_fim_contrato` | `2027-03-01` |
| `contracts.is_migrated` | `true` |
| Parcelas | Shift -1 mês: ref 04/2026→03/2027, due 2026-04-10→2027-03-10 |
| Invoice items | Remover itens atuais, reassociar às faturas dos novos meses |

## Passos de execução (apenas dados, sem código)

### 1. Atualizar a análise
- `UPDATE analyses SET guarantee_payment_date = '2026-03-01' WHERE id = '85706048-...'`

### 2. Atualizar o contrato
- `UPDATE contracts SET data_fim_contrato = '2027-03-01', is_migrated = true WHERE id = 'd13a4e7e-...'`

### 3. Deletar invoice_items atuais
- Os 12 invoice_items vinculados serão removidos (todas as faturas estão em "rascunho")
- Recalcular `total_value` das faturas afetadas (ou deletar faturas que fiquem vazias)

### 4. Deletar parcelas atuais
- Remover as 12 `guarantee_installments` do contrato

### 5. Regenerar parcelas e itens de fatura
- Chamar a edge function `generate-installments` com `contract_id` para recriar as 12 parcelas com as datas corretas (ref 04/2026→03/2027)
- A função já cria automaticamente os invoice_items e associa às faturas corretas

### 6. Registrar evento na timeline
- Inserir evento `manual_date_correction` na `analysis_timeline` para auditoria

## Observações
- Nenhuma parcela precisa ser marcada como "paga" pois a primeira parcela (ref 04/2026, due 2026-04-10) é posterior à data de criação do registro (2026-04-02)
- Nenhuma migração SQL necessária — são apenas atualizações de dados
- Nenhuma alteração de código necessária

