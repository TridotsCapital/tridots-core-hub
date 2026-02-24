
# Modo Suporte: Impersonacao de Imobiliaria

## Resumo

Permitir que qualquer usuario interno da Tridots (master ou analyst) acesse o portal de qualquer imobiliaria com acesso total de leitura e escrita, a partir de um botao no painel interno. Acoes de criacao exigem confirmacao adicional, e tudo e rastreado nos logs de auditoria.

---

## Fluxo do Usuario

1. No painel Tridots, o usuario acessa `/agencies/:id` (detalhe da imobiliaria)
2. No topo da pagina, ao lado do botao "Voltar", aparece o botao **"Acessar como Imobiliaria"** (icone de escudo)
3. Ao clicar, abre uma nova aba em `/agency?impersonate=AGENCY_ID`
4. O portal da imobiliaria carrega com:
   - **Banner fixo** no topo: "Voce esta acessando como suporte Tridots - [Nome Imobiliaria]" com botao **"Voltar ao Painel"**
   - **Todos os menus** visiveis (Dashboard, Chamados, Analises, Contratos, Garantias, Comissoes, Faturas, Docs, Colaboradores, Ajuda)
   - **Banners de status** (Pendente, Inadimplencia) visiveis mas **sem bloquear acoes** do suporte
   - **NPS oculto** (pesquisas de satisfacao nao aparecem)
   - **Acoes de criacao** (Nova Analise, Solicitar Garantia) funcionam, mas exibem um **modal de confirmacao**: "Voce esta agindo em nome da imobiliaria X. Confirma?"
5. O botao "Voltar ao Painel" redireciona para `app.tridotscapital.com/agencies/:id` na mesma aba

---

## Arquitetura Tecnica

### 1. ImpersonationContext (novo arquivo)

**Arquivo:** `src/contexts/ImpersonationContext.tsx`

Contexto React responsavel por gerenciar o estado de impersonacao:

- Ao montar, verifica o parametro `?impersonate=AGENCY_ID` na URL
- Valida que o usuario logado tem role `master` ou `analyst` via `useAuth()`
- Se valido, busca dados da agencia (nome, active, billing_blocked_at) e ativa o modo
- Estado armazenado em `sessionStorage` (isolado por aba)
- Expoe: `isImpersonating`, `impersonatedAgencyId`, `impersonatedAgencyName`, `isAgencyActive`, `isBillingBlocked`, `stopImpersonation()`

Validacao de seguranca: se o usuario nao for master/analyst, o contexto ignora o parametro e nao ativa impersonacao.

### 2. Mudancas no AgencyLayout

**Arquivo:** `src/components/layout/AgencyLayout.tsx`

Logica atual (linhas 126-133):
```text
if (role === 'master' || role === 'analyst') && !isProduction -> redirect to /
if (role !== 'agency_user') -> redirect to /auth
```

Nova logica:
```text
if isImpersonating AND (role === 'master' || role === 'analyst'):
  -> PERMITIR acesso
  -> Usar impersonatedAgencyId em vez de buscar agency_users
  -> Exibir banner de suporte no topo
  -> Nao exibir NpsProvider
  -> Banners de status visiveis mas sem bloquear (isActionsBlocked = false para suporte)
else:
  -> manter logica atual
```

O banner de suporte sera um `div` fixo acima do header:
- Fundo vermelho/laranja com texto branco
- Texto: "Voce esta acessando como suporte Tridots - [Nome]"
- Botao "Voltar ao Painel" a direita que redireciona para o portal interno

### 3. Mudancas no useAgencyUser

**Arquivo:** `src/hooks/useAgencyUser.ts`

Quando `isImpersonating = true`, o hook retorna os dados da agencia impersonada diretamente do contexto, sem consultar `agency_users`. Isso garante que todos os hooks dependentes (dashboard, analises, contratos, etc.) recebam o `agency_id` correto.

### 4. Mudancas na AgencySidebar

**Arquivo:** `src/components/layout/AgencySidebar.tsx`

- Quando impersonando, `isActionsBlocked` e forcado para `false` (suporte nao e bloqueado por inadimplencia/inatividade)
- NPS (`hasPendingNps`) e forcado para `false` (ocultar pesquisa)
- Botoes "Nova Analise" e "Solicitar Garantia" exibem modal de confirmacao antes de navegar

### 5. Modal de Confirmacao de Acao

**Arquivo:** `src/components/agency/ImpersonationConfirmDialog.tsx` (novo)

AlertDialog simples que aparece ao clicar em "Nova Analise" ou "Solicitar Garantia" durante impersonacao:

```text
Titulo: "Acao em nome da imobiliaria"
Mensagem: "Voce esta agindo como suporte em nome de [Nome Imobiliaria]. Esta acao sera registrada nos logs. Deseja continuar?"
Botoes: [Cancelar] [Confirmar e Continuar]
```

### 6. Botao no AgencyForm

**Arquivo:** `src/pages/AgencyForm.tsx`

Adicionar botao no topo (ao lado do "Voltar"), visivel apenas em modo edicao:

```text
[Escudo] Acessar como Imobiliaria
```

Ao clicar, executa `window.open('/agency?impersonate=' + id, '_blank')`.

### 7. Rastreabilidade (Audit Log)

O `log_audit_event()` ja registra `auth.uid()` como `user_id`. Como o usuario logado e o membro Tridots, as acoes ficam naturalmente vinculadas ao usuario real no audit log. Nao e necessario alterar o trigger.

Para rastreabilidade extra no frontend, o contexto de impersonacao disponibiliza um metodo para injetar `impersonated_agency_id` em chamadas a Edge Functions via header customizado (implementacao futura opcional).

### 8. RLS - Revisao de Policies

A maioria das policies de leitura para tabelas de agencia ja permite acesso via `has_any_role(auth.uid())` para masters/analysts. Isso significa que o suporte ja consegue **ler** dados de qualquer agencia.

Para **escrita**, as policies de INSERT em tabelas como `analyses`, `claims`, `tickets` verificam:
- `is_agency_user(auth.uid())` com `agency_id = get_user_agency_id(auth.uid())`

O usuario Tridots nao esta em `agency_users`, mas as policies alternativas `has_any_role(auth.uid())` ja cobrem INSERT para team members na maioria das tabelas (analyses, claims, tickets). Nao e necessaria nenhuma migracao de RLS.

Tabelas revisadas que ja tem cobertura para team members:
- `analyses`: INSERT com `has_any_role` (ok)
- `claims`: INSERT com `has_any_role` (ok)
- `tickets`: INSERT com `has_any_role` (ok)
- `ticket_messages`: INSERT com `has_any_role` (ok)
- `analysis_documents`: INSERT exige `is_agency_user` - **atencao**: o suporte pode usar a policy de team member se existir, mas esta tabela so tem policy de agency_user para INSERT. Sera necessario adicionar uma policy `Team members can upload analysis documents` para permitir upload pelo suporte.
- `claim_files`: INSERT com `has_any_role` (ok)

**Migracao necessaria**: adicionar policy de INSERT em `analysis_documents` para team members.

---

## Arquivos Afetados

| # | Arquivo | Tipo | Descricao |
|---|---------|------|-----------|
| 1 | `src/contexts/ImpersonationContext.tsx` | Novo | Contexto de impersonacao com validacao de role e sessionStorage |
| 2 | `src/components/agency/ImpersonationConfirmDialog.tsx` | Novo | Modal de confirmacao para acoes de criacao |
| 3 | `src/components/layout/AgencyLayout.tsx` | Modificado | Permitir master/analyst quando impersonando; banner de suporte; ocultar NPS |
| 4 | `src/hooks/useAgencyUser.ts` | Modificado | Retornar dados da agencia impersonada quando ativo |
| 5 | `src/components/layout/AgencySidebar.tsx` | Modificado | Desbloquear acoes; ocultar NPS; adicionar confirmacao |
| 6 | `src/pages/AgencyForm.tsx` | Modificado | Botao "Acessar como Imobiliaria" no topo |
| 7 | `src/App.tsx` | Modificado | Envolver rotas agency com ImpersonationProvider |
| 8 | Migracao SQL | Novo | Policy de INSERT em analysis_documents para team members |

---

## Pontos de Atencao

- **Sem nova role no banco**: masters e analysts ja existem e tem permissoes RLS adequadas
- **Sem registro falso em agency_users**: o contexto injeta o agency_id diretamente
- **Isolamento por aba**: sessionStorage e por aba, permitindo acessar multiplas imobiliarias simultaneamente
- **Seguranca**: apenas roles master/analyst podem ativar (validado no frontend via useAuth e no backend via RLS existentes)
- **Uma unica migracao SQL**: apenas para `analysis_documents` INSERT policy
