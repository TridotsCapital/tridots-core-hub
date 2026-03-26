

# Plano: Corrigir Valores dos Contratos #844217A0 e #078FBDAD

## Situação Atual vs. Correta

| Contrato | Inquilino | garantia_anual atual | Correta | Parcela mensal atual | Parcela correta |
|---|---|---|---|---|---|
| #844217A0 | Nathaniely | R$ 1.569,30 | **R$ 1.465,82** | R$ 130,775 | **R$ 122,15** |
| #078FBDAD | Gislaine | R$ 888,12 | **R$ 762,30** | R$ 74,01 | **R$ 63,525** |

Ambos os contratos **já aparecem na fatura de março** com itens vinculados. O problema é apenas o valor incorreto.

## O que será feito

### 1. Atualizar `garantia_anual` na tabela `analyses`
- Nathaniely: 1569.30 → 1465.82
- Gislaine: 888.12 → 762.30

### 2. Atualizar valor de todas as 12 parcelas (`guarantee_installments`)
- Nathaniely: cada parcela de 130.775 → 122.1517 (1465.82 / 12)
- Gislaine: cada parcela de 74.01 → 63.525 (762.30 / 12)

### 3. Atualizar valor de todos os 12 `invoice_items`
Mesmos valores das parcelas acima.

### 4. Recalcular `total_value` de todas as faturas abertas impactadas
12 faturas da Massaru (março/2026 a fevereiro/2027) terão o total recalculado pela soma real dos itens.

### 5. Registrar auditoria
Inserir evento `value_correction` na `analysis_timeline` para ambos os contratos.

## Execução
Operações de dados (UPDATE/INSERT) via ferramenta de inserção. Nenhuma mudança de schema.

