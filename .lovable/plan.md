

# Correção: invoice_items do contrato #D13A4E7E + prevenção futura

## Diagnóstico da varredura completa

A varredura cobriu todas as tabelas de vínculo (analyses, contracts, invoice_items, guarantee_installments, commissions). Resultado:

- **0 análises órfãs** (aprovada sem contrato)
- **0 contratos órfãos** (sem análise)
- **0 inconsistências** em outros contratos
- **1 único problema**: os 12 invoice_items do contrato `d13a4e7e` (Massaru Imóveis) com `tenant_name = 'ADELINO GOMES MORENO'` e `property_address = 'RUA MARECHAL DEODORO, 1282'` — ambos incorretos, introduzidos por inserção manual anterior

## Correção de dados (única ação necessária)

Atualizar os 12 registros em `invoice_items` para:

| Campo | Valor incorreto | Valor correto |
|---|---|---|
| `tenant_name` | ADELINO GOMES MORENO | Erik Matheus Saldanha Santana |
| `property_address` | RUA MARECHAL DEODORO, 1282 | Rua João Luiz Dias, 459 |

```sql
UPDATE invoice_items
SET tenant_name = 'Erik Matheus Saldanha Santana',
    property_address = 'Rua João Luiz Dias, 459'
WHERE contract_id = 'd13a4e7e-39f2-44bb-b177-3de67e49e928';
```

Nenhuma alteração de código necessária. A edge function `generate-installments` já busca os dados corretamente da análise — o problema foi exclusivo da operação manual anterior.

