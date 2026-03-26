

# Plano: Atualizar Datas do Contrato #078FBDAD

## Dados Atuais vs. Corretos

| Campo | Atual | Correto |
|---|---|---|
| `guarantee_payment_date` | `null` | **2026-02-28** |
| `data_fim_contrato` | `null` | **2027-02-28** |

## O que será feito

1. **Atualizar `guarantee_payment_date`** na tabela `analyses` (analysis_id: `5f3b5421-0688-4914-824e-824977ce2ed0`) para `2026-02-28`
2. **Atualizar `data_fim_contrato`** na tabela `contracts` (contract_id: `078fbdad-b873-4232-bc71-7e17b4e2c6d2`) para `2027-02-28`
3. **Registrar evento `manual_date_correction`** na `analysis_timeline` com metadados dos valores antigos e novos

## Execução

Três operações de UPDATE/INSERT via ferramenta de dados (sem migração de schema).

