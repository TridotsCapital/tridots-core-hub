

# Correcao Critica: billing_due_day nao sendo salvo no cadastro

## Problema

O formulario de cadastro da imobiliaria coleta o campo "Dia de Vencimento" (billing_due_day) no Step 5, porem esse valor **nao e enviado** para o backend nem salvo no banco de dados. Resultado: todas as agencias ficam com `billing_due_day = NULL` ("Nao definido") no painel Tridots.

## Causa Raiz

Dois arquivos estao omitindo o campo `billing_due_day`:

1. **Auth.tsx** (linha ~115-135): O objeto `body` enviado para a Edge Function nao inclui `billing_due_day`
2. **register-agency/index.ts** (linha ~89-107): A interface `AgencyRegistrationData` e o INSERT nao incluem `billing_due_day`

## Correcao

### 1. Auth.tsx - Adicionar billing_due_day ao body da chamada

Incluir `billing_due_day: formData.billing_due_day || 10` no objeto enviado para `register-agency`.

### 2. register-agency/index.ts - Aceitar e salvar o campo

- Adicionar `billing_due_day?: number` na interface `AgencyRegistrationData`
- Incluir `billing_due_day: data.billing_due_day || 10` no INSERT da tabela agencies

### 3. Corrigir dado da agencia teste17

Executar um UPDATE direto para corrigir o registro da agencia que ja se cadastrou com o valor perdido:

```text
UPDATE agencies SET billing_due_day = 15 WHERE email = 'teste17@imobi17.com';
```

## Arquivos Afetados

| Arquivo | Mudanca |
|---|---|
| `src/pages/Auth.tsx` | Adicionar 1 linha: `billing_due_day` no body |
| `supabase/functions/register-agency/index.ts` | Adicionar campo na interface e no INSERT |

