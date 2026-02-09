
# Limpeza Completa da Imobiliaria Demo

## Resumo

Apagar todos os dados operacionais da **Imobiliaria Demo** (ID: `4f2ab3ed-6d0f-4a78-a34d-45abe25b22c0`) para deixa-la limpa para testes manuais. A agencia em si (cadastro, usuarios) sera mantida.

## Dados a Remover

| Tabela | Registros |
|--------|-----------|
| Tickets (+ mensagens, notificacoes, historico) | 20 |
| Claims (+ arquivos, notas, timeline) | 9 |
| Faturas unificadas (+ itens, timeline) | 1 |
| Parcelas de garantia | 144 |
| Contratos (+ renovacoes, documentos) | 25 |
| Comissoes | 106 |
| Analises (+ documentos, timeline) | 48 |

## Ordem de Execucao (respeitando FKs)

A exclusao deve seguir a ordem correta de dependencias:

```text
1. ticket_messages, ticket_notifications, ticket_analyst_history, ticket_typing_indicators
2. tickets
3. claim_files, claim_notes, claim_timeline
4. claims
5. invoice_timeline, invoice_items
6. agency_invoices
7. guarantee_installments
8. renewal_notifications, contract_renewals
9. internal_notes (referenciando contratos/analises)
10. commissions
11. analysis_documents, analysis_timeline
12. contracts
13. analyses
```

## Implementacao

Uma unica migration SQL usando o agency_id `4f2ab3ed-6d0f-4a78-a34d-45abe25b22c0` como filtro, executando DELETEs na ordem acima.

## Resultado Esperado

- Imobiliaria Demo com zero analises, contratos, chamados, sinistros, faturas e parcelas
- Cadastro da agencia e usuarios preservados
- Pronta para testes manuais do zero
