
# Correção: Segunda Race Condition - Role ainda não carregou

## Problema Identificado

A impersonação falha porque existe uma corrida entre o carregamento do `role` (AuthContext) e a decisão do `ImpersonationContext`:

```text
Nova aba abre
    |
    v
AuthContext: loading=true, role=null
ImpersonationContext useEffect executa:
    |-- isAllowedRole = (null === "master") = FALSE
    |-- Seta impersonationLoading = false (desiste)
    |
    v
AuthContext termina: role="master", loading=false
ImpersonationContext useEffect re-executa:
    |-- isAllowedRole = true, inicia fetch
    |-- MAS impersonationLoading ja e false!
    |
    v
AgencyLayout renderiza:
    |-- loading=false, impersonationLoading=false
    |-- isImpersonating=false (fetch ainda em andamento)
    |-- isInternalUser=true, !isProduction=true
    |-- REDIRECIONA para "/" <--- problema
```

## Solução

Modificar o `ImpersonationContext` para **não desistir enquanto o auth ainda estiver carregando**. Se há um parametro `?impersonate=` na URL, o loading so pode ser setado como `false` quando:
1. O `role` ja foi carregado (auth `loading = false`), E
2. A decisao foi tomada (buscar agencia ou ignorar)

## Detalhes Tecnicos

### ImpersonationContext.tsx

Mudancas:
- Importar `loading` do `useAuth()` junto com `role`
- Na logica do `impersonationLoading` inicial: manter `true` se ha `?impersonate=` na URL (independente do role, pois o role pode ainda nao ter carregado)
- No `useEffect`: so executar `setImpersonationLoading(false)` quando `isAllowedRole` for `false` **E** o auth ja tiver terminado de carregar (`loading === false`). Se `loading` ainda for `true`, nao fazer nada (aguardar re-execucao do effect)
- Adicionar `loading` (do auth) na lista de dependencias do `useEffect`

Logica revisada:
```text
useEffect:
  Se nao tem ?impersonate= na URL:
    impersonationLoading = false (nada a fazer)
    return

  Se auth ainda esta carregando (loading === true):
    return (manter impersonationLoading = true, aguardar)

  Se isAllowedRole === false (auth carregou, mas nao e master/analyst):
    impersonationLoading = false
    return

  Se isAllowedRole === true:
    Se ja tem cache no sessionStorage:
      impersonationLoading = false
      return
    Senao:
      Fetch agencia...
      impersonationLoading = false (apos completar)
```

### AgencyLayout.tsx

Nenhuma mudanca necessaria - o `impersonationLoading` ja esta sendo verificado corretamente. A correcao e apenas no timing de quando ele e setado como `false`.

## Arquivos Afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/contexts/ImpersonationContext.tsx` | Aguardar auth loading antes de decidir; adicionar `loading` nas deps do useEffect |

## Resultado Esperado

1. Admin clica "Acessar como Imobiliaria" - nova aba abre
2. `impersonationLoading = true` (tem ?impersonate= na URL)
3. AgencyLayout mostra "Carregando..." (auth loading + impersonation loading)
4. Auth termina: role = "master"
5. ImpersonationContext: isAllowedRole = true, busca agencia
6. Fetch completa: isImpersonating = true, impersonationLoading = false
7. AgencyLayout permite acesso, exibe portal com banner de suporte

Nao ha necessidade de janela anonima - a sessao compartilhada funciona corretamente quando o timing esta certo.
