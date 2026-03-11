

# Plano: Correção do Contrato #56620556 — Angela Pereira dos Santos

## Dados Atuais vs Novos

| Campo | Atual | Novo |
|-------|-------|------|
| Valor do aluguel | R$ 1.600,00 | R$ 1.800,00 |
| Taxa de garantia | 10% (START) | 13% (PRIME) |
| Plano | sem plano definido | PRIME |
| Garantia anual | R$ 1.920,00 | R$ 2.808,00 |
| Parcela mensal | R$ 160,00 | R$ 234,00 |
| Cobertura total (20x) | R$ 32.000,00 | R$ 36.000,00 |
| Limite custos de saída | R$ 4.000 | R$ 6.000 |
| Comissão (10% PRIME) | — | R$ 280,80/ano (R$ 23,40/mês) |

Cálculos:
- Garantia anual = R$ 1.800 × 12 × 13% = **R$ 2.808,00**
- Parcela mensal = R$ 2.808 / 12 = **R$ 234,00**
- Cobertura = R$ 1.800 × 20 = **R$ 36.000,00**

## Atualizações no Banco de Dados

### 1. Tabela `analyses` (analysis_id: `8f84ff82-...`)
- `valor_aluguel` → 1800
- `valor_total` → 1800
- `taxa_garantia_percentual` → 13
- `plano_garantia` → 'prime'
- `garantia_anual` → 2808

### 2. Tabela `guarantee_installments` (12 parcelas)
- `value` → 234 para todas as 12 parcelas

### 3. Tabela `invoice_items` (12 itens vinculados)
- `value` → 234 para todos os 12 itens

### 4. Registro na `analysis_timeline`
- Inserir evento `manual_date_correction` documentando a alteração dos valores

Não existem comissões geradas para essa análise, então não há necessidade de atualizar a tabela `commissions`.

