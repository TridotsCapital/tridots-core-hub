

# Correção: Dados Zerados no Modo Suporte

## Problema

Vários módulos do portal da imobiliária (Contratos, Garantias, Dashboard, Nova Análise, Nova Garantia) buscam o `agency_id` diretamente na tabela `agency_users` filtrando pelo `user_id` do usuário logado. Como o usuário Tridots (master/analyst) **não está** na tabela `agency_users`, essas consultas retornam `null`, resultando em dados zerados.

O hook `useAgencyUser()` já foi corrigido para retornar o `agency_id` da imobiliária impersonada, mas os módulos não o utilizam -- cada um faz sua própria consulta direta.

```text
Fluxo atual (quebrado):
  AgencyContracts -> SELECT agency_id FROM agency_users WHERE user_id = ADMIN_ID
                  -> Resultado: NULL (admin não está em agency_users)
                  -> Contratos: []

Fluxo correto:
  AgencyContracts -> useAgencyUser() -> agency_id da imobiliária impersonada
                  -> Contratos carregam normalmente
```

## Solução

Substituir todas as consultas diretas a `agency_users` nos módulos do portal por uso do `useAgencyUser()`, que já lida com a impersonação corretamente.

---

## Arquivos Afetados

### 1. `src/pages/agency/AgencyContracts.tsx`
- **Remover** o `useEffect` que busca `agency_id` via `supabase.from('agency_users')` (linhas 48-96)
- **Usar** `useAgencyUser()` para obter o `agency_id`
- Passar o `agency_id` do hook para a consulta de contratos

### 2. `src/pages/agency/AgencyClaims.tsx`
- **Remover** o `useEffect` que busca `agency_id` via `supabase.from('agency_users')` (linhas 40-62)
- **Usar** `useAgencyUser()` para obter o `agency_id`

### 3. `src/pages/agency/AgencyNewAnalysis.tsx`
- **Remover** o `useEffect` que busca `agency_id` via `supabase.from('agency_users')` (linhas 17-48)
- **Usar** `useAgencyUser()` para obter `agency_id`, `active` e `desconto_pix_percentual`

### 4. `src/pages/agency/AgencyNewClaim.tsx`
- **Remover** o `useEffect` que busca `agency_id` via `supabase.from('agency_users')` (linhas 107-130)
- **Usar** `useAgencyUser()` para obter o `agency_id`

### 5. `src/hooks/useAgencyDashboard.ts` (hook `useCurrentAgencyId`)
- **Modificar** para usar `useAgencyUser()` em vez de consultar `agency_users` diretamente
- Isso corrige o Dashboard (KPIs, gráficos, ranking, etc.)

### 6. `src/hooks/useAgencyProfile.ts`
- **Modificar** para usar `useAgencyUser()` em vez de consultar `agency_users` diretamente

### 7. `src/components/agency/claims/ClaimTicketSheet.tsx`
- **Modificar** para usar `useAgencyUser()` em vez de consultar `agency_users` diretamente

---

## Padrão da Correção

Em cada arquivo, a mudança segue o mesmo padrão:

**Antes:**
```text
const [agencyId, setAgencyId] = useState(null);
useEffect(() => {
  const { data } = await supabase
    .from('agency_users')
    .select('agency_id')
    .eq('user_id', user.id)
    .single();
  setAgencyId(data.agency_id);
}, [user]);
```

**Depois:**
```text
const { data: agencyUserData } = useAgencyUser();
const agencyId = agencyUserData?.agency_id || null;
```

O `useAgencyUser()` já retorna o `agency_id` correto tanto para usuários normais da imobiliária quanto para o modo suporte.

## Resultado Esperado

Após a correção, ao acessar o portal como suporte:
- Dashboard mostrará os KPIs reais da imobiliária
- Contratos listarão todos os contratos da imobiliária
- Garantias listarão todas as solicitações
- Chamados, Comissões e demais módulos funcionarão normalmente
- Nova Análise e Nova Garantia receberão o `agency_id` correto para criação

