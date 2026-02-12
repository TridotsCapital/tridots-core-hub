
## Oportunidades de Melhoria para Tridots - Análise e Plano de Ação

### 1. **Bugs & Code Debt Identificados**

#### 1.1 - Bug na Verificação de Role (DocumentSection.tsx)
- **Localização**: `src/components/kanban/DocumentSection.tsx`, linha 120
- **Problema**: `const isMaster = profile?.id === profile?.id;` sempre retorna `true` ou `undefined`
- **Impacto**: Controle de acesso incorreto para deletar documentos
- **Solução**: Substituir por verificação correta: `isMaster = role === 'master'` usando o context `useAuth()`

### 2. **Otimizações no Modelo de Dados**

#### 2.1 - Adição de Índices de Banco de Dados
Baseado na análise do código, há 30+ hooks que consultam as seguintes tabelas com frequência:
- `commissions` (mes_referencia, ano_referencia, due_date, agency_id, status)
- `analyses` (agency_id, status, created_at)
- `contracts` (agency_id, status, payment_method, due_date)
- `invoices` (agency_id, status, due_date, created_at)
- `profiles` (user_id, role, agency_id)

**Impacto**: Reduzir latência em queries recorrentes (especialmente em dashboards com múltiplos filtros)

#### 2.2 - Otimização de Pagination em Queries
Muitos hooks fazem queries sem `limit()`, podendo retornar > 1000 registros.
Exemplo: `useAgencies`, `useAnalyses`, `useContracts` em dashboards com muitos registros.

**Impacto**: Melhorar performance em agências com alto volume de dados

### 3. **Melhorias em Edge Functions**

#### 3.1 - Cache para Operações Custosas
Identificadas operações recorrentes que poderiam ser cacheadas:
- Cálculo de comissões (usado em 5+ funções)
- Geração de relatórios mensais (`process-monthly-commissions`)
- Validação de pagamentos (`validate-payments`)

**Impacto**: Reduzir execução de functions desnecessárias, economizando custos

#### 3.2 - Consolidação de Funções Similares
- `generate-invoice-drafts`, `generate-invoice-pdf`, `generate-invoice-excel` poderiam compartilhar lógica de geração
- `send-*-notification` funções (10+) poderiam usar um único template system
- `*-renewal-*` funções (4+) poderiam ser unificadas

**Impacto**: Reduzir código duplicado, melhorar manutenibilidade e reduzir execuções

### 4. **Melhorias de UX/UI**

#### 4.1 - Dashboard de Monitoramento de Consumo Lovable Cloud
- Adicionar página `src/pages/CloudMonitoring.tsx` com métricas em tempo real:
  - Database queries por dia/semana
  - Edge Function executions e duração média
  - Storage usage
  - Alertas quando ultrapassar thresholds

**Impacto**: Usuário consegue visualizar consumo e planejar otimizações

#### 4.2 - Confirmação de Ações Críticas
- Adicionar modal de confirmação em operações destrutivas (ex: deletar agência, cancelar contrato)
- Implementar "soft delete" para alguns registros antes de delete permanente

**Impacto**: Reduzir erros do usuário, evitar exclusões acidentais

### 5. **Monitoramento e Observabilidade**

#### 5.1 - Rastreamento Melhorado de Erros
- Implementar logging estruturado em Edge Functions
- Adicionar tratamento de erro mais específico em hooks (diferenciar network vs business logic errors)
- Criar dashboard de erros frequentes

**Impacto**: Facilitar debugging, identificar padrões de falha

#### 5.2 - Métricas de Performance
- Adicionar tracking de tempo de execução em operações críticas (approve analysis, generate commission, etc)
- Monitorar N90/N99 de latência em queries mais usadas
- Identificar queries com mais tempo de execução

**Impacto**: Base de dados para otimizações futuras

### Priorização Recomendada

| # | Item | Esforço | Impacto | Prioridade |
|---|------|---------|--------|-----------|
| 1 | Bug DocumentSection.tsx | Mínimo | Alto | **CRÍTICA** |
| 2 | Índices de DB (commissions, analyses, contracts) | Baixo | Alto | **ALTA** |
| 3 | Pagination em hooks | Médio | Médio | Alta |
| 4 | Cache em Edge Functions | Médio | Alto | Alta |
| 5 | Dashboard Cloud Monitoring | Médio | Médio | Média |
| 6 | Consolidação de Edge Functions | Alto | Médio | Média |
| 7 | Logging/Observabilidade | Médio | Médio | Média |

### Próximos Passos

Qual destas áreas você gostaria de priorizar? Recomendo começar por:
1. **Primeiro**: Corrigir o bug de role verification (1-2 min)
2. **Segundo**: Adicionar índices de DB (5-10 min)
3. **Terceiro**: Implementar pagination nos hooks principais (1-2h)

Isso daria um bom ganho de performance e stability sem muito esforço inicial.
