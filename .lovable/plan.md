

# Plano: Migração de 3 Contratos — Correção Manual de Datas

## Dados Identificados

| Inquilino | Contract ID | Analysis ID | created_at sistema | Data correta | Fim (+12m) |
|-----------|-------------|-------------|-------------------|--------------|------------|
| Ricardo | f8729310-... | 572ac02b-... | 2026-03-19 | 18/12/2025 | 18/12/2026 |
| Marcia | 5a2dd867-... | b8e9ed87-... | 2026-03-18 | 16/12/2025 | 16/12/2026 |
| Gilda | 80ac3238-... | 0dc7c264-... | 2026-03-13 | 27/11/2025 | 27/11/2026 |

**Nota**: Desta vez as datas são de 2025 (não 2024 como na migração anterior). Os contratos vencem em 2026, então algumas parcelas terão vencimento **antes** do `created_at` do sistema (marcadas como "paga") e outras **depois** (permanecem "pendente").

## Lógica de corte das parcelas

Usando a regra de migração: parcelas com `due_date < contract.created_at` → `paga`, demais → `pendente`.

| Contrato | Parcelas com due_date < created_at | Parcelas pendentes |
|----------|------------------------------------|--------------------|
| Ricardo (início 18/12/2025, created_at 19/03/2026) | Parcelas 1-3 (jan, fev, mar 2026) → paga | Parcelas 4-12 → pendente |
| Marcia (início 16/12/2025, created_at 18/03/2026) | Parcelas 1-3 (jan, fev, mar 2026) → paga | Parcelas 4-12 → pendente |
| Gilda (início 27/11/2025, created_at 13/03/2026) | Parcelas 1-3 (dez 2025, jan, fev 2026) → paga | Parcelas 4-12 → pendente |

## Operações (via insert tool — dados, não schema)

### 1. UPDATE analyses — `guarantee_payment_date`
- Ricardo: `2025-12-18`
- Marcia: `2025-12-16`
- Gilda: `2025-11-27`

### 2. UPDATE contracts — `is_migrated = true` + `data_fim_contrato`
- Ricardo: `data_fim_contrato = 2026-12-18`, `is_migrated = true`
- Marcia: `data_fim_contrato = 2026-12-16`, `is_migrated = true`
- Gilda: `data_fim_contrato = 2026-11-27`, `is_migrated = true`

### 3. DELETE parcelas atuais + INSERT 12 novas por contrato
Cada contrato terá 12 parcelas com `due_date` baseada na data correta (+1, +2, ..., +12 meses). As 3 primeiras de cada serão `status = 'paga'`, as 9 restantes `status = 'pendente'`.

### 4. INSERT eventos `manual_date_correction` na `analysis_timeline`
Um evento por análise com metadados (datas antigas → novas), visível em ambos os portais.

## Resumo

| Tabela | Operação | Registros |
|--------|----------|-----------|
| analyses | UPDATE | 3 |
| contracts | UPDATE | 3 |
| guarantee_installments | DELETE + INSERT | 36 removidos, 36 inseridos |
| analysis_timeline | INSERT | 3 |

A badge "Migrado" e a timeline já estão implementados — aparecerão automaticamente em ambos os portais.

