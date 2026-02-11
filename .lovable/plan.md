

# Ajuste de Due Date das Comissoes - Mes Subsequente (Dia 10)

## Problema Identificado
Atualmente, o `due_date` das comissoes recorrentes e de setup esta sendo definido no **mesmo mes** do `mes_referencia`. A regra de negocio correta e: **toda comissao so e paga no mes seguinte ao mes de referencia da parcela, sempre no dia 10**.

Exemplo: parcela do mes 08/2026 paga -> comissao com `due_date = 10/09/2026`.

## Regras Confirmadas
1. **Setup**: tambem e pago no mes seguinte a ativacao, dia 10
2. **Recorrente**: `due_date` = dia 10 do mes seguinte ao `mes_referencia`
3. **Todos os metodos de pagamento** (Boleto Unificado, Pix, Cartao): mesma regra
4. **mes_referencia**: representa o mes da parcela de garantia (servico prestado), NAO o mes do pagamento da comissao
5. **Dia fixo**: sempre dia 10, independente da agencia

## Alteracoes Necessarias

### 1. Edge Function `validate-payments/index.ts` (geracao de comissoes)
Na funcao `generateCommissions`, ajustar o calculo de `due_date`:

- **Setup**: `due_date` = dia 10 do mes seguinte ao mes da validacao (nao mais o mesmo mes)
- **Recorrente**: `due_date` = dia 10 do mes seguinte ao `mes_referencia` da comissao (atualmente usa `startDate + i + 1` como due_date, o que ja e o mes seguinte ao startDate, mas o dia e variavel e o mes pode nao corresponder ao mes_referencia + 1)

Logica correta:
```
Para cada comissao recorrente:
  mes_referencia = mes calculado
  ano_referencia = ano calculado  
  due_date = dia 10 do (mes_referencia + 1)

Para setup:
  mes_referencia = mes da ativacao
  due_date = dia 10 do (mes da ativacao + 1)
```

### 2. Hook `useCommissions.ts` (geracao client-side)
A funcao `useGenerateContractCommissions` tem a mesma logica de geracao. Aplicar a mesma correcao:
- Setup: `due_date` = dia 10 do mes seguinte
- Recorrente: `due_date` = dia 10 do mes seguinte ao `mes_referencia`

### 3. Correcao retroativa dos dados existentes (SQL)
Executar um UPDATE nos registros ja criados para ajustar o `due_date`:
- Para comissoes recorrentes: `due_date` = dia 10 do mes seguinte ao `mes_referencia/ano_referencia`
- Para comissoes de setup: `due_date` = dia 10 do mes seguinte ao `mes_referencia/ano_referencia`

### 4. Hook `useAgencyInvoices.ts` (registro de pagamento de fatura)
Verificar se ao transicionar comissoes de `pendente` para `a_pagar`, o `due_date` ja esta correto (com a correcao acima, ja estara). Nenhuma alteracao adicional deve ser necessaria neste hook apos a correcao na geracao.

## Resumo de Arquivos Afetados
- `supabase/functions/validate-payments/index.ts` - corrigir `generateCommissions`
- `src/hooks/useCommissions.ts` - corrigir `useGenerateContractCommissions`
- Migracao SQL para corrigir dados existentes
