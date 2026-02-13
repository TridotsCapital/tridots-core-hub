

# Auditoria de Bugs na Jornada do Analista

Apos uma revisao detalhada do codigo, identifiquei **5 bugs** que impactam diretamente os usuarios com role `analyst`. Abaixo esta a descricao de cada um, a causa raiz e a correcao proposta.

---

## Bug 1 (CRITICO): Hooks do React chamados condicionalmente no Dashboard

**Arquivo:** `src/pages/Dashboard.tsx` (linhas 63-67)

**Problema:** Os hooks `useAnalyses()`, `useAgencies()`, `useCommissions()`, `usePendingAgenciesCount()` e `usePaymentInterestMetrics()` sao chamados **depois** de varios `return` antecipados (linhas 33-61). Isso viola a regra fundamental do React: hooks devem ser chamados incondicionalmente no topo do componente.

**Impacto:** Em certas condicoes (por exemplo, quando o estado de autenticacao muda), o React pode lançar um erro tipo "Rendered more/fewer hooks than during the previous render", causando crash na pagina para qualquer usuario interno (master ou analista).

**Correcao:** Mover todas as chamadas de hooks para o topo do componente, antes de qualquer `return` condicional.

---

## Bug 2 (CRITICO): Botoes de acao restritos apenas ao Master no AnalysisForm

**Arquivo:** `src/pages/AnalysisForm.tsx` (linhas 217-251)

**Problema:** Os botoes "Iniciar Analise", "Aprovar" e "Reprovar" na pagina de detalhe da analise verificam `isMaster` ao inves de verificar `isMaster || role === 'analyst'`. Resultado: quando o analista abre uma analise por essa rota (`/analyses/:id`), ele **nao consegue iniciar, aprovar ou reprovar** nenhuma analise.

**Nota:** Pelo Kanban (drawer), o analista consegue realizar essas acoes normalmente, pois o `AnalysisDrawer.tsx` nao faz essa restricao. Porem o AnalysisForm e acessivel via link direto ou pela visao de tabela.

**Correcao:** Substituir `isMaster` por `(isMaster || role === 'analyst')` nas tres verificacoes.

---

## Bug 3 (MEDIO): Sidebar exibe itens "masterOnly" para analistas

**Arquivo:** `src/components/layout/AppSidebar.tsx` (linhas 100-114, 159)

**Problema:** Os itens de menu `Usuarios`, `Logs` e `Cloud Monitoring` possuem a propriedade `masterOnly: true`, porem o `menuItems.map()` na linha 159 **nao filtra** esses itens com base no role do usuario. Analistas veem esses links no menu e podem clicar, mas as paginas nao tem conteudo util para eles (ou podem gerar erros de permissao).

**Correcao:** Adicionar um filtro no `.map()` para esconder itens `masterOnly` quando o role nao e `master`.

---

## Bug 4 (MEDIO): Filtro de analista nao funciona na visao Tabela

**Arquivo:** `src/pages/Analyses.tsx` (linhas 51-54, 70-81)

**Problema:** A pagina de Analises tem um filtro de "Analista" que funciona apenas na visao Kanban (passado via `filters.analyst_id`). Na visao Tabela, o `useAnalyses()` recebe apenas `status` e `agency_id` como filtros, **ignorando completamente** o filtro de analista. Quando o analista seleciona seu proprio nome no filtro e muda para visao tabela, vê todas as analises ao inves de apenas as suas.

**Correcao:** Passar `analyst_id` como filtro adicional no `useAnalyses()` e implementar o filtro na query do hook.

---

## Bug 5 (BAIXO): AnalysisForm pula fluxo de aprovacao correto

**Arquivo:** `src/pages/AnalysisForm.tsx` (linhas 229-240)

**Problema:** O botao "Aprovar" no AnalysisForm chama `handleStatusChange('aprovada')` diretamente, mudando o status para `aprovada` sem passar pelo fluxo correto de `aguardando_pagamento` (que e o fluxo implementado no Kanban). Isso contradiz a regra de negocio onde a aprovacao deve primeiro gerar o link de aceite e aguardar pagamento.

**Impacto:** Se um usuario master (unico que atualmente ve os botoes) clicar em "Aprovar" por essa tela, a analise pula a etapa de pagamento, nao gera link de aceite, nao cobra o inquilino e vai direto para "Aprovada" de forma incorreta.

**Correcao:** Substituir o botao "Aprovar" por um que abra o mesmo `ApprovalModal` usado no Kanban (mudando status para `aguardando_pagamento`), ou remover o botao duplicado em favor do drawer.

---

## Secao Tecnica - Resumo das Correcoes

| # | Arquivo | Mudanca |
|---|---|---|
| 1 | `src/pages/Dashboard.tsx` | Mover hooks para antes dos returns condicionais |
| 2 | `src/pages/AnalysisForm.tsx` | Trocar `isMaster` por `(isMaster \|\| role === 'analyst')` nos botoes |
| 3 | `src/components/layout/AppSidebar.tsx` | Filtrar `menuItems` com `masterOnly` baseado no role |
| 4 | `src/pages/Analyses.tsx` + `src/hooks/useAnalyses.ts` | Propagar filtro `analyst_id` para visao tabela |
| 5 | `src/pages/AnalysisForm.tsx` | Corrigir fluxo de aprovacao para usar `aguardando_pagamento` |

## Ordem de Execucao

1. Bug 1 - Dashboard hooks (crash potencial)
2. Bug 2 - Botoes do AnalysisForm bloqueados para analista
3. Bug 5 - Fluxo de aprovacao incorreto no AnalysisForm
4. Bug 3 - Sidebar exibindo itens restritos
5. Bug 4 - Filtro de analista na tabela

