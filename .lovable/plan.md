

# Correção Urgente: Função validate-payments Quebrada

## Diagnóstico

### Site carregando normalmente
Acessei `tridotscapital.com`, `app.tridotscapital.com` e `portal.tridotscapital.com` -- todos carregam a tela de login corretamente. Se houve indisponibilidade, pode ter sido temporaria (DNS, cache do navegador, ou deploy em andamento).

### Bug Critico Encontrado
A funcao `validate-payments` esta **completamente fora do ar** com erro de boot:

```
Uncaught SyntaxError: Identifier 'cacheKey' has already been declared
  at validate-payments/index.ts:310:9
```

**Causa:** A variavel `cacheKey` e declarada com `const` duas vezes no mesmo escopo da funcao `generateCommissions`:
- Linha 293: primeira declaracao (usada para ler cache)
- Linha 367: segunda declaracao (usada para escrever cache) -- DUPLICADA

Isso impede o boot da funcao, fazendo com que **nenhuma validacao de pagamento funcione**.

## Impacto
- Nenhuma analise pode ser aprovada/rejeitada via validacao de pagamento
- Usuarios veem erro 500 ao tentar validar pagamentos
- Comissoes nao sao geradas para novas aprovacoes

## Correcao

### Passo 1: Remover declaracao duplicada em validate-payments
No arquivo `supabase/functions/validate-payments/index.ts`, na funcao `generateCommissions`, remover o segundo `const cacheKey` (linha 367) e reutilizar a variavel ja declarada na linha 293.

**Antes (linha 367):**
```typescript
const cacheKey = getCommissionCalculationKey(analysis.id);
setCachedValue(cacheKey, commissions, 60);
```

**Depois:**
```typescript
// cacheKey ja declarado na linha 293
setCachedValue(cacheKey, commissions, 60);
```

### Passo 2: Deploy e verificacao
- A funcao sera redeployada automaticamente
- Verificar nos logs que o erro de boot nao aparece mais

## Secao Tecnica
- Arquivo afetado: `supabase/functions/validate-payments/index.ts`
- Mudanca: Remover 1 linha (declaracao duplicada de `const cacheKey`)
- Risco: Nenhum -- a variavel `cacheKey` ja esta no escopo correto desde a linha 293 com o mesmo valor

