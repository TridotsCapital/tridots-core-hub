

# Plano: Correção do Contrato #F6B6F948 — Leticia Renata de Oliveira

## Dados Atuais vs Novos

| Campo | Atual | Novo |
|-------|-------|------|
| Valor do aluguel | R$ 661,50 | **R$ 800,00** |
| Taxa de garantia | 10% (START) | 10% (START) — sem alteração |
| Garantia anual | R$ 793,80 | **R$ 960,00** |
| Parcela mensal | R$ 66,15 | **R$ 80,00** |
| Cobertura total (20x) | R$ 13.230,00 | **R$ 16.000,00** |
| Limite custos de saída | R$ 4.000 | R$ 4.000 — sem alteração |

Cálculos:
- Garantia anual = R$ 800 × 12 × 10% = **R$ 960,00**
- Parcela mensal = R$ 960 / 12 = **R$ 80,00**

## Atualizações no Banco de Dados

### 1. Tabela `analyses` (ID: `c5ecbff1-7ee9-4c5f-a606-cfc276845784`)
- `valor_aluguel` → 800
- `valor_total` → 800
- `plano_garantia` → 'start'
- `garantia_anual` → 960

### 2. Tabela `guarantee_installments` (12 parcelas)
- `value` → 80 para todas as 12 parcelas

### 3. Tabela `invoice_items` (12 itens)
- `value` → 80 para todos os 12 itens

### 4. Registro na `analysis_timeline`
- Inserir evento `manual_date_correction` documentando a alteração (valor antigo R$ 661,50 → R$ 800,00)

Sem comissões geradas — nada a atualizar nessa tabela.

