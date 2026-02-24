
# Correção: Race Condition na Impersonação

## Problema

Quando o admin clica em "Acessar como Imobiliária", uma nova aba abre em `/agency?impersonate=AGENCY_ID`. Porém, o `ImpersonationContext` precisa fazer uma chamada assíncrona ao banco para buscar os dados da agência. Antes dessa chamada completar, o `AgencyLayout` já renderiza com `isImpersonating = false` e redireciona o `master`/`analyst` de volta para `/` (dashboard interno).

```text
Nova aba abre
    |
    v
ImpersonationProvider monta
    |-- sessionStorage vazio (nova aba) --> state = null
    |-- useEffect dispara fetch assíncrono (ainda não completou)
    |
    v
AgencyLayout renderiza
    |-- isImpersonating = false (fetch não completou)
    |-- role = master, !isProduction
    |-- REDIRECIONA para "/" <--- problema aqui
    |
    v
useEffect nunca completa (componente desmontou)
```

## Solução

Adicionar um estado `impersonationLoading` ao `ImpersonationContext` que indica quando há um parâmetro `?impersonate=` na URL mas os dados ainda estão sendo carregados. O `AgencyLayout` espera esse loading terminar antes de tomar decisões de redirecionamento.

---

## Detalhes Técnicos

### 1. ImpersonationContext - Adicionar estado de loading

**Arquivo:** `src/contexts/ImpersonationContext.tsx`

Mudanças:
- Adicionar `impersonationLoading: boolean` ao tipo do contexto
- Inicializar como `true` quando há `?impersonate=` na URL e `sessionStorage` está vazio
- Setar como `false` após o fetch completar (sucesso ou erro)
- Se não há `?impersonate=` na URL, `impersonationLoading` começa como `false`

Lógica:
```text
Se URL tem ?impersonate= E sessionStorage está vazio:
  impersonationLoading = true
  Fetch agência...
  impersonationLoading = false (após completar)

Se URL NÃO tem ?impersonate=:
  impersonationLoading = false (imediato)

Se sessionStorage já tem dados da agência:
  impersonationLoading = false (imediato, usa cache)
```

### 2. AgencyLayout - Esperar loading da impersonação

**Arquivo:** `src/components/layout/AgencyLayout.tsx`

Mudanças:
- Importar `impersonationLoading` do contexto
- Na condição de loading (linha 114), adicionar `impersonationLoading` ao check:
  - De: `if (loading || loadingAgency)`
  - Para: `if (loading || loadingAgency || impersonationLoading)`

Isso garante que o layout mostre o spinner "Carregando..." enquanto a impersonação está sendo inicializada, e só depois de confirmar se é ou não impersonação, tome a decisão de redirecionar.

---

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/ImpersonationContext.tsx` | Adicionar `impersonationLoading` ao contexto com lógica de detecção do param na URL |
| `src/components/layout/AgencyLayout.tsx` | Incluir `impersonationLoading` na condição de loading inicial |

## Resultado Esperado

1. Admin clica "Acessar como Imobiliária" -> abre nova aba
2. Nova aba mostra spinner "Carregando..." enquanto busca dados da agência
3. Após fetch completar, `isImpersonating = true` -> portal da agência carrega com banner de suporte
4. Se o fetch falhar (agency_id inválido), `isImpersonating = false` -> redireciona normalmente
