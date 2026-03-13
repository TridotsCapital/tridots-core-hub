

# Plano: Alterar Data de Ativação de 3 Contratos para 27/02/2026 + Etiqueta MIGRADO

## Contratos Afetados

| Contrato | Inquilino | Parcela Mensal | Criado no Sistema |
|----------|-----------|----------------|-------------------|
| #844217A0 | Nathaniely Marciely Morais Gomes | R$ 130,78 | 10/03/2026 |
| #298E7156 | Paulo Ricardo Assumpção | R$ 243,50 | 11/03/2026 |
| #73D93CA5 | Rayana Nayara Semezatto de Almeida | R$ 105,00 | 12/03/2026 |

Agência: `0fac5f2d-a537-4db9-b6b5-a138803d83c0`

## Atualizações no Banco de Dados

### 1. Tabela `analyses` (3 registros)
- `guarantee_payment_date` → `2026-02-27`

IDs: `6f552368`, `a5cabe20`, `39d3a884`

### 2. Tabela `contracts` (3 registros)
- `data_fim_contrato` → `2027-02-27`
- `is_migrated` → `true`

IDs: `844217a0`, `298e7156`, `73d93ca5`

### 3. Tabela `guarantee_installments` (36 registros)
Deslocar 1 mes para tras em todas as 36 parcelas:
- `reference_month` -1 (com wrap 1→12 e year -1)
- `due_date` -1 mes (04-10 → 03-10, ..., 03-10/2027 → 02-10/2027)

**Status de migração**: parcelas com vencimento anterior ao `created_at` do contrato marcadas como `paga`:
- **Paulo** (criado 11/03): parcela 1 vence 10/03 → `paga`
- **Rayana** (criado 12/03): parcela 1 vence 10/03 → `paga`
- **Nathaniely** (criada 10/03): parcela 1 vence 10/03 → mesmo dia, mantém status atual

### 4. Tabela `invoice_items` (36 registros)
Mover cada item para a fatura do mes anterior:
- Itens de abr/2026 → fatura mar/2026 (`a51ad834`)
- Itens de mai/2026 → fatura abr/2026 (`64d75298`)
- ... e assim por diante
- Itens de mar/2027 → fatura fev/2027 (`58694171`)

### 5. Tabela `agency_invoices` — recalcular totais
Faturas afetadas (mar/2026 a mar/2027): recalcular `total_value` baseado na soma dos `invoice_items` de cada fatura.

### 6. Tabela `analysis_timeline` (3 eventos)
Inserir evento `manual_date_correction` para cada analise documentando:
- Data de ativacao definida para 27/02/2026
- Contrato marcado como MIGRADO
- Deslocamento das parcelas de abr-mar para mar-fev

## Nenhuma alteração de código necessária
O campo `is_migrated` ja é suportado nas listas e detalhes dos contratos com o badge roxo "Migrado".

