

# Plano: Atualizar Datas dos Contratos

## Dados Atuais vs. Corretos

| Contrato | Inquilino | guarantee_payment_date atual | Correto | data_fim_contrato atual | Correto |
|---|---|---|---|---|---|
| #73D93CA5 | Rayana Nayara Semezatto de Almeida | 2026-02-27 | **2026-03-25** | 2027-02-27 | **2027-03-25** |
| #298E7156 | Paulo Ricardo Assumpção | 2026-02-27 | **2026-03-04** | 2027-02-27 | **2027-03-04** |

## O que será feito

### 1. Atualizar `guarantee_payment_date` na tabela `analyses`
A "Data de Início da Garantia" é a fonte de verdade para a data de criação do contrato. Será atualizada para as datas corretas informadas.

### 2. Atualizar `data_fim_contrato` na tabela `contracts`
Recalcular como +12 meses a partir da nova data de início.

### 3. Parcelas (installments)
As parcelas já estão todas com status `faturada` e vinculadas a faturas. As datas de vencimento das parcelas (dia 10 de cada mês) e os meses de referência **não precisam ser alterados**, pois representam o ciclo de cobrança mensal independente da data de criação do contrato.

### 4. Registro na timeline
Adicionar evento `manual_date_correction` na timeline de cada análise para manter rastreabilidade.

## Execução

Uma migração SQL com 3 updates:
- `analyses.guarantee_payment_date` para cada contrato
- `contracts.data_fim_contrato` para cada contrato  
- Insert de eventos na `analysis_timeline`

