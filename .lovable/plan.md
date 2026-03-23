

# Plano: Corrigir Regra de 1ª Parcela e Retroatividade

## Entendimento da Regra

A regra correta (e que já está documentada nas memórias do sistema) é:

> **A primeira parcela do Boleto Unificado é SEMPRE agendada para o mês SUBSEQUENTE ao da ativação/criação do contrato.**

Exemplo: contrato criado em março → 1ª parcela = abril, não março.

## O Bug (já corrigido no código)

A Edge Function `generate-installments` **já está com o código correto** (linhas 143-152). Porém, em versões anteriores do deploy, a lógica gerava a 1ª parcela no **mesmo mês** da criação. Os contratos criados **antes da correção** ficaram com parcelas erradas.

## Diagnóstico — 4 Contratos Afetados

| # | Contract ID | Inquilino | Imobiliária | created_at | 1ª parcela atual | 1ª parcela correta |
|---|-------------|-----------|-------------|------------|------------------|--------------------|
| 1 | `c3e5c4f8` | teste boleto unificado 3 | teste 15 | 06/02/2026 | Fev/2026 | Mar/2026 |
| 2 | `56620556` | Angela Pereira dos Santos | EMPRECOL | 04/03/2026 | Mar/2026 | Abr/2026 |
| 3 | `5254aa81` | Teste Goreti | Demo | 06/03/2026 | Mar/2026 | Abr/2026 |
| 4 | `580d4934` | Teste Isme | Demo | 09/03/2026 | Mar/2026 | Abr/2026 |

Todos têm `is_migrated = false` e `guarantee_payment_date = null`.

## Operações (via insert tool — dados, não schema)

### 1. Para cada contrato afetado:

a. **Desvincular parcelas** — SET `invoice_item_id = null` em `guarantee_installments`

b. **Deletar `invoice_items`** vinculados a essas parcelas

c. **Recalcular `total_value`** das `agency_invoices` afetadas (ou deletar se ficarem vazias)

d. **Deletar parcelas** atuais (12 por contrato)

e. **Inserir 12 novas parcelas** com `reference_month` e `due_date` deslocados +1 mês (1ª parcela = mês seguinte ao da criação)

f. **Criar/atualizar faturas** para os novos meses e vincular via `invoice_items`

### 2. INSERT eventos `installment_date_correction` na `analysis_timeline`
Um evento por análise registrando a correção retroativa, visível em ambos os portais.

## Resumo de Impacto

| Tabela | Operação | Registros estimados |
|--------|----------|---------------------|
| guarantee_installments | DELETE + INSERT | 48 removidos, 48 inseridos |
| invoice_items | DELETE + INSERT | 48 removidos, 48 inseridos |
| agency_invoices | UPDATE/DELETE + INSERT | ~48 ajustes |
| analysis_timeline | INSERT | 4 |

A Edge Function `generate-installments` **não precisa de alteração** — o código atual já está correto. Contratos futuros serão gerados com a 1ª parcela no mês subsequente.

