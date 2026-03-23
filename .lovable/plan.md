

# Plano: Migração de 2 Contratos — Natan e Leticia (Datas Corrigidas para 2026)

## Dados Corrigidos

| Inquilino | Contract ID | Analysis ID | created_at sistema | Data correta | Fim (+12m) |
|-----------|-------------|-------------|-------------------|--------------|------------|
| Natan Fratta da Silva | a843a9ec-... | 1aa4dbdc-... | 16/03/2026 | 02/02/2026 | 02/02/2027 |
| Leticia Renata de Oliveira | f6b6f948-... | c5ecbff1-... | 27/02/2026 | 10/02/2026 | 10/02/2027 |

**Diferença vs. plano anterior**: As datas corretas são **2026** (não 2025). Isso muda significativamente a lógica de parcelas — os contratos terminam em fev/2027, e a maioria das parcelas fica **após** o created_at do sistema.

## Lógica de parcelas (due_date < created_at → paga)

| Contrato | Parcelas pagas | Parcelas pendentes |
|----------|---------------|--------------------|
| Natan (início 02/02/2026, created_at 16/03/2026) | Parcela 1 (02/03/2026) → **1 paga** | Parcelas 2-12 → **11 pendentes** |
| Leticia (início 10/02/2026, created_at 27/02/2026) | Nenhuma (10/03/2026 > 27/02/2026) → **0 pagas** | Parcelas 1-12 → **12 pendentes** |

## Operações

### 1. UPDATE analyses — `guarantee_payment_date`
- Natan: `2026-02-02`
- Leticia: `2026-02-10`

### 2. UPDATE contracts — `is_migrated = true` + `data_fim_contrato`
- Natan: `data_fim_contrato = 2027-02-02`, `is_migrated = true`
- Leticia: `data_fim_contrato = 2027-02-10`, `is_migrated = true`

### 3. Desvincular faturas + limpar invoice_items
- Desvincular `invoice_item_id` nas parcelas atuais
- Deletar invoice_items vinculados
- Recalcular `total_value` das faturas afetadas (ou deletar as vazias)

### 4. DELETE parcelas atuais + INSERT 12 novas por contrato
- Natan: 1 paga + 11 pendentes
- Leticia: 0 pagas + 12 pendentes

### 5. INSERT eventos `manual_date_correction` na `analysis_timeline`

## Resumo

| Tabela | Operação | Registros |
|--------|----------|-----------|
| analyses | UPDATE | 2 |
| contracts | UPDATE | 2 |
| guarantee_installments | DELETE + INSERT | 24 removidos, 24 inseridos |
| invoice_items | DELETE | ~24 |
| agency_invoices | UPDATE ou DELETE | faturas afetadas |
| analysis_timeline | INSERT | 2 |

