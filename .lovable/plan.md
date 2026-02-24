

# Correção: "Imobiliária não encontrada" no Modo Suporte

## Problema

Quando o admin navega internamente no portal (ex: clica em "Nova Análise"), a URL muda para `/agency/analyses/new` **sem** o parametro `?impersonate=`. Nesse momento:

1. O `AuthContext` ainda pode estar carregando o `role`
2. `isAllowedRole = (null === "master") = false`
3. `isImpersonating = false` (apesar do sessionStorage ter os dados)
4. `useAgencyUser` executa o caminho nao-impersonado: busca em `agency_users` pelo user_id do admin
5. Retorna `null` -> componente mostra "Erro: Imobiliária não encontrada"

Mesmo quando o `role` carrega depois e `isImpersonating` vira `true`, o componente ja renderizou o estado de erro.

```text
Admin navega para /agency/analyses/new
    |
    v
AuthContext: loading=true, role=null
ImpersonationContext: isAllowedRole=false, isImpersonating=false
    |                  (sessionStorage TEM dados, mas isAllowedRole bloqueia)
    v
useAgencyUser: isImpersonating=false
    |-- Busca em agency_users WHERE user_id = admin_id
    |-- Resultado: null
    |
    v
AgencyNewAnalysis: agencyId=null -> "Erro: Imobiliária não encontrada"
```

## Solucao

Modificar o `useAgencyUser` para considerar o estado de carregamento do auth. Se o auth ainda esta carregando e ha dados de impersonacao no sessionStorage, o hook deve aguardar antes de executar a query.

## Detalhes Tecnicos

### 1. `src/hooks/useAgencyUser.ts`

Mudancas:
- Importar `loading` (authLoading) do `useAuth()`
- Importar `impersonationLoading` do `useImpersonation()`
- Na query, verificar se o auth ainda esta carregando: se `authLoading` e `true` e ha dados no sessionStorage, retornar `undefined` (manter estado de loading)
- Adicionar `authLoading` e `impersonationLoading` ao `enabled` da query: so habilitar quando ambos terminarem
- Isso garante que a query so executa quando `isImpersonating` tem seu valor definitivo

Logica:
```text
enabled: !!user?.id && !authLoading && !impersonationLoading
```

Com isso, a query so roda quando:
- O usuario esta autenticado
- O role ja foi carregado (auth nao esta loading)
- A impersonacao ja foi inicializada (impersonationLoading = false)

Nesse ponto, `isImpersonating` tera o valor correto e a query seguira o caminho adequado.

### 2. Demais paginas

**Nenhuma mudanca necessaria** nas paginas (`AgencyNewAnalysis`, `AgencyContracts`, `AgencyClaims`, etc.) pois todas ja usam `isLoading` do `useAgencyUser()`. Como a query ficara desabilitada enquanto o auth carrega, `isLoading` sera `true` e os componentes mostrarao o spinner em vez do erro.

## Arquivos Afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useAgencyUser.ts` | Adicionar `authLoading` e `impersonationLoading` ao `enabled` da query |

## Resultado Esperado

1. Admin navega pelo portal da imobiliaria (modo suporte)
2. `useAgencyUser` aguarda auth + impersonation carregarem
3. Query executa com `isImpersonating = true` -> busca agencia correta
4. Todas as paginas (Analises, Contratos, Garantias, etc.) carregam dados normalmente

