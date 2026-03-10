

# Corrigir erro de variavel duplicada na Edge Function `generate-acceptance-link`

## Problema
A Edge Function `generate-acceptance-link` declara `const token` duas vezes:
- Linha 36: `const token = authHeader.replace("Bearer ", "");` (token de autenticacao)
- Linha 65: `const token = crypto.randomUUID();` (token de aceite)

Isso causa um erro de runtime `SyntaxError: Identifier 'token' has already been declared`, impedindo a geracao do link de aceite.

## Correcao
Renomear a variavel da linha 36 de `token` para `authToken` e atualizar sua referencia na linha 37.

## Arquivo afetado

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/generate-acceptance-link/index.ts` | Renomear `token` (linha 36) para `authToken` e atualizar uso na linha 37 |

## Detalhe tecnico

```text
Linha 36: const token → const authToken
Linha 37: supabase.auth.getUser(token) → supabase.auth.getUser(authToken)
```

Nenhuma outra mudanca necessaria. O `token` da linha 65 (UUID de aceite) permanece inalterado e continua sendo usado corretamente no restante da funcao.

